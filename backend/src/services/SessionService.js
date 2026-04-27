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
      // STRICT SEQUENTIAL: Student can only mark done AFTER owner
      if (!session.receiver_confirmed) {
        throw new Error('Please wait for the Tribe Owner to mark this session as done first.');
      }
      updates.sender_confirmed = true;
    } else {
      // Owner can mark done anytime
      updates.receiver_confirmed = true;
    }

    const isSenderAlreadyConfirmed = session.sender_confirmed === true || updates.sender_confirmed === true;
    const isReceiverAlreadyConfirmed = session.receiver_confirmed === true || updates.receiver_confirmed === true;

    const skillName = session.exchange?.skill?.name || 'Tribe';

    if (isSenderAlreadyConfirmed && isReceiverAlreadyConfirmed) {
      console.log(`[SessionService] Both confirmed, moving to feedback phase: ${sessionId}`);
      updates.status = 'WAITING_FOR_FEEDBACK';
      
      // NOTIFY BOTH: Ready for Feedback
      try {
        const recipientId = userId === session.sender_id ? session.receiver_id : session.sender_id;
        
        // Notify both that it's time for feedback (credits will be handled in finalizeSession)
        await NotificationService.send(recipientId, 'SESSION_UPDATE', 'Session Confirmed! ✅', `The session for "${skillName}" is confirmed. Credits are being transferred. Please provide your feedback.`, `/skills?session_id=${sessionId}`);
        await NotificationService.send(userId, 'SESSION_UPDATE', 'Session Confirmed! ✅', `You have confirmed completion for "${skillName}". Credits are being transferred. Please provide your feedback.`, `/skills?session_id=${sessionId}`);
      } catch (err) {
        console.error('Final confirmation notification failed:', err);
      }
    } else {
      // ONLY ONE PERSON CONFIRMED (Must be Owner if we followed the rule)
      updates.status = 'WAITING'; 
      try {
        const sender = await UserModel.findById(userId);
        const recipientId = userId === session.sender_id ? session.receiver_id : session.sender_id;
        await NotificationService.notifySessionMarkedDone(recipientId, sender?.name || 'Partner', skillName, sessionId, false);
      } catch (err) {
        console.error('Confirmation notification failed:', err);
      }
    }

    const updated = await SessionModel.update(session.id, updates);

    // If both confirmed, finalize immediately (Credits transfer)
    if (isSenderAlreadyConfirmed && isReceiverAlreadyConfirmed) {
       try {
         await this.finalizeSession(session.id);
         // Refetch updated session to return the final status
         return await SessionModel.getById(session.id);
       } catch (err) {
         console.error('[SessionService] Immediate finalization failed:', err);
       }
    }

    return updated;
  }

  /**
   * Finalize session: Transfer credits and award XP
   * Triggered only when both parties have reviewed
   */
  static async finalizeSession(sessionId) {
    const session = await SessionModel.getById(sessionId);
    
    if (session.status === 'COMPLETED') return session;
    
    // Only require confirmations now, not reviews
    if (!session.sender_confirmed || !session.receiver_confirmed) {
      console.log(`[SessionService] Session ${sessionId} not ready for finalization. Flags: ${JSON.stringify({
        sender_confirmed: session.sender_confirmed,
        receiver_confirmed: session.receiver_confirmed
      })}`);
      return session;
    }

    console.log(`[SessionService] ALL CONDITIONS MET. Finalizing session: ${sessionId}`);
    
    const fee = session.exchange?.skill?.session_fee !== undefined ? session.exchange.skill.session_fee : 20;
    const skillName = session.exchange?.skill?.name || 'Tribe';
    
    const learner = await UserModel.findById(session.sender_id);
    const teacher = await UserModel.findById(session.receiver_id);

    if (fee > 0) {
      if ((learner.credits || 0) < fee) {
        // Log error but don't block? Or block?
        // Usually, we should have checked this earlier, but better safe than sorry.
        console.error(`[SessionService] Finalization failed: Learner ${learner.id} has insufficient credits.`);
        throw new Error(`Learner has insufficient credits (${learner.credits}) for the session fee (${fee}).`);
      }
      
      console.log(`[SessionService] Finalizing: Transferring ${fee} credits for session ${session.id}`);
      await CreditService.deductCredits(learner.id, fee, 'SPEND');
      await CreditService.addCredits(teacher.id, fee, 'EARN', session.id);
    }

    // Award XP
    await LevelService.awardXP(teacher.id, 250, `Session: ${skillName} (Provider)`).catch(err => console.error('XP Award failure (Teacher):', err));
    await LevelService.awardXP(learner.id, 100, `Session: ${skillName} (Student)`).catch(err => console.error('XP Award failure (Learner):', err));

    const finalUpdates = { status: 'COMPLETED' };
    const updatedSession = await SessionModel.update(session.id, finalUpdates);

    // NOTIFY BOTH: Session Fully Completed
    try {
      const formattedFee = fee.toLocaleString();
      await NotificationService.send(
        session.sender_id, 
        'SESSION_UPDATE', 
        'Session Finalized! ✅', 
        `The session for "${skillName}" is complete. ${formattedFee} credits have been deducted from your wallet.`, 
        `/skills?session_id=${sessionId}`
      );
      
      await NotificationService.send(
        session.receiver_id, 
        'SESSION_UPDATE', 
        'Session Finalized! ✅', 
        `The session for "${skillName}" is complete. You have received ${formattedFee} credits for your expertise.`, 
        `/skills?session_id=${sessionId}`
      );
    } catch (err) {
      console.error('Final completion notification failed:', err);
    }

    return updatedSession;
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
