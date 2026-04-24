import SessionModel from '../models/Session.js';
import SkillExchangeModel from '../models/SkillExchange.js';
import UserModel from '../models/User.js';
import CreditTransactionModel from '../models/CreditTransaction.js';
import NotificationService from './NotificationService.js';
import CreditService from './CreditService.js';
import LevelService from './LevelService.js';

export class SessionService {
  static async scheduleSession(userId, payload) {
    const { requestId, scheduledTime, meetingLink } = payload;
    const client = SkillExchangeModel.getClient();

    const { data: exchange, error } = await client
      .from('skill_exchanges')
      .select('id, requester_id, provider_id, skill_id, status')
      .eq('id', requestId)
      .single();

    if (error || !exchange) {
      throw new Error('Skill exchange request not found');
    }
    if (exchange.status !== 'ACCEPTED') {
      throw new Error('Session can only be scheduled for accepted requests');
    }
    if (exchange.provider_id !== userId) {
      throw new Error('Only the skill provider can schedule the session');
    }

    console.log(`[SessionService] Starting session schedule for request ${requestId} by user ${userId}`);
    const { data: existingSession } = await SessionModel.getClient()
      .from('sessions')
      .select('id, status')
      .eq('request_id', requestId)
      .neq('status', 'COMPLETED')
      .maybeSingle();

    if (existingSession) {
      console.warn(`[SessionService] Session already exists for request ${requestId}`);
      throw new Error('A session is already scheduled for this request');
    }

    console.log(`[SessionService] Creating session record...`);
    const session = await SessionModel.create({
      request_id: requestId,
      sender_id: exchange.requester_id,
      receiver_id: exchange.provider_id,
      scheduled_time: scheduledTime,
      meeting_link: meetingLink || null,
      status: 'SCHEDULED',
    });

    console.log(`[SessionService] Session created: ${session.id}. Updating exchange status...`);
    await SkillExchangeModel.updateStatus(requestId, 'SCHEDULED');

    try {
      console.log(`[SessionService] Sending notification to requester ${exchange.requester_id}...`);
      const provider = await UserModel.findById(exchange.provider_id);
      const { data: skill } = await SkillExchangeModel.getClient()
        .from('skills')
        .select('name')
        .eq('id', exchange.skill_id)
        .single();

      await NotificationService.notifySessionScheduled(
        exchange.requester_id,
        provider?.name || 'Provider',
        skill?.name || 'skill',
        scheduledTime
      );
      console.log(`[SessionService] Notification sent.`);
    } catch (err) {
      console.error('[SessionService] Failed to notify requester about session scheduling:', err);
    }

    console.log(`[SessionService] Scheduling complete.`);
    return session;
  }

  static async getUserSessions(userId) {
    return await SessionModel.getByUser(userId);
  }

  static async completeSession(userId, sessionId) {
    const session = await SessionModel.getById(sessionId);

    if (session.sender_id !== userId && session.receiver_id !== userId) {
      throw new Error('You are not allowed to complete this session');
    }
    
    // Check if scheduled time has passed
    const now = new Date();
    const scheduledTime = new Date(session.scheduled_time);
    if (now < scheduledTime) {
      throw new Error(`Session completion is only allowed after the scheduled time (${scheduledTime.toLocaleString()})`);
    }

    if (session.status === 'COMPLETED') {
      throw new Error('Session is already completed');
    }

    const updates = {};
    if (session.sender_id === userId) {
      updates.sender_confirmed = true;
    } else {
      updates.receiver_confirmed = true;
    }

    // Safety check for existing state
    const isSenderAlreadyConfirmed = session.sender_confirmed === true || updates.sender_confirmed === true;
    const isReceiverAlreadyConfirmed = session.receiver_confirmed === true || updates.receiver_confirmed === true;

    if (isSenderAlreadyConfirmed && isReceiverAlreadyConfirmed) {
      const learner = await UserModel.findById(session.sender_id);
      const teacher = await UserModel.findById(session.receiver_id);

      if (!learner || !teacher) {
        throw new Error('Session participants were not found');
      }
      if ((learner.credits || 0) < 10) {
        throw new Error('Learner has insufficient credits');
      }
      
      console.log(`[SessionService] Transferring 10 credits from ${learner.id} to ${teacher.id} for session ${session.id}`);
      
      // Use CreditService for consistent transaction recording and notifications
      await CreditService.deductCredits(learner.id, 10, 'SPEND');
      await CreditService.addCredits(teacher.id, 10, 'EARN', session.id);

      updates.status = 'COMPLETED';

      // AWARD XP: Provider gets 150 XP for teaching a session
      LevelService.awardXP(teacher.id, 150).catch(err => console.error('XP Award failure (Provider):', err));
      // Optionally give some to the learner too? Let's just do provider for now per plan.
    }

    return await SessionModel.update(session.id, updates);
  }

  /**
   * Complete a recurring session (creates a session record and confirms it)
   */
  static async completeRecurringSession(userId, payload) {
    const { exchangeId, scheduledTime } = payload;
    const client = SkillExchangeModel.getClient();

    const { data: exchange, error } = await client
      .from('skill_exchanges')
      .select('id, requester_id, provider_id, status')
      .eq('id', exchangeId)
      .single();

    if (error || !exchange) throw new Error('Skill exchange not found');
    if (exchange.status !== 'ACCEPTED') throw new Error('Tribe is not active');

    // Check if a session already exists for this exact time
    const { data: existing } = await client
      .from('sessions')
      .select('id')
      .eq('request_id', exchangeId)
      .eq('scheduled_time', scheduledTime)
      .maybeSingle();

    let session;
    if (existing) {
      session = existing;
    } else {
      // Create a new session record for this recurring slot
      session = await SessionModel.create({
        request_id: exchangeId,
        sender_id: exchange.requester_id,
        receiver_id: exchange.provider_id,
        scheduled_time: scheduledTime,
        status: 'SCHEDULED'
      });
    }

    // Now call the standard completeSession logic to confirm it for this user
    return await this.completeSession(userId, session.id);
  }
}

export default SessionService;
