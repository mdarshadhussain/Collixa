import SessionModel from '../models/Session.js';
import SkillExchangeModel from '../models/SkillExchange.js';
import UserModel from '../models/User.js';
import CreditTransactionModel from '../models/CreditTransaction.js';
import NotificationService from './NotificationService.js';

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

    const { data: existingSession } = await SessionModel.getClient()
      .from('sessions')
      .select('id, status')
      .eq('request_id', requestId)
      .neq('status', 'COMPLETED')
      .maybeSingle();

    if (existingSession) {
      throw new Error('A session is already scheduled for this request');
    }

    const session = await SessionModel.create({
      request_id: requestId,
      sender_id: exchange.requester_id,
      receiver_id: exchange.provider_id,
      scheduled_time: scheduledTime,
      meeting_link: meetingLink || null,
      status: 'SCHEDULED',
    });

    await SkillExchangeModel.updateStatus(requestId, 'SCHEDULED');

    try {
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
    } catch (err) {
      console.error('Failed to notify requester about session scheduling:', err);
    }

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
    if (session.status === 'COMPLETED') {
      throw new Error('Session is already completed');
    }

    const learner = await UserModel.findById(session.sender_id);
    const teacher = await UserModel.findById(session.receiver_id);

    if (!learner || !teacher) {
      throw new Error('Session participants were not found');
    }
    if ((learner.credits || 0) < 10) {
      throw new Error('Learner has insufficient credits');
    }

    await UserModel.update(learner.id, { credits: (learner.credits || 0) - 10 });
    await UserModel.update(teacher.id, { credits: (teacher.credits || 0) + 10 });

    await CreditTransactionModel.createMany([
      { user_id: teacher.id, amount: 10, type: 'EARN', session_id: session.id },
      { user_id: learner.id, amount: -10, type: 'SPEND', session_id: session.id },
    ]);

    return await SessionModel.update(session.id, { status: 'COMPLETED' });
  }
}

export default SessionService;
