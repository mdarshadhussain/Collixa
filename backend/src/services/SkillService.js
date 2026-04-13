import SkillModel from '../models/Skill.js';
import SkillExchangeModel from '../models/SkillExchange.js';
import NotificationService from './NotificationService.js';

export class SkillService {
  /**
   * List a new skill
   */
  static async addSkill(userId, skillData) {
    return await SkillModel.create({
      user_id: userId,
      ...skillData
    });
  }

  /**
   * Get all skills with search
   */
  static async searchSkills(filters) {
    return await SkillModel.getAll(filters);
  }

  /**
   * Request a skill exchange
   */
  static async requestExchange(requesterId, requestId) {
    const { skillId, message } = requestId;
    
    // Get skill to find provider
    const skill = await SkillModel.getById(skillId);
    
    if (skill.user_id === requesterId) {
      throw new Error('You cannot request an exchange for your own skill.');
    }

    const exchange = await SkillExchangeModel.createRequest({
      requester_id: requesterId,
      provider_id: skill.user_id,
      skill_id: skillId,
      message,
      status: 'PENDING'
    });

    // Notify provider
    try {
      const { data: requester } = await SkillModel.getClient().from('users').select('name').eq('id', requesterId).single();
      await NotificationService.notifySkillRequest(skill.user_id, requester?.name || 'A user', skill.title);
    } catch (err) {
      console.error('Failed to send notification:', err);
    }

    return exchange;
  }

  /**
   * Schedule or update status
   */
  static async updateExchangeStatus(userId, exchangeId, status, data) {
    // Basic verification could go here (e.g., only provider can accept)
    const updated = await SkillExchangeModel.updateStatus(exchangeId, status, data);
    
    // Notify requester
    try {
      if (status === 'ACCEPTED' || status === 'REJECTED') {
        const { data: exchange } = await SkillExchangeModel.getClient()
          .from('skill_exchanges')
          .select('requester_id, skill_id, provider_id')
          .eq('id', exchangeId)
          .single();
        
        const { data: provider } = await SkillExchangeModel.getClient().from('users').select('name').eq('id', exchange.provider_id).single();
        const { data: skill } = await SkillExchangeModel.getClient().from('skills').select('title').eq('id', exchange.skill_id).single();
        
        await NotificationService.notifyRequestResponse(
          exchange.requester_id, 
          provider?.name || 'A provider', 
          skill?.title || 'skill', 
          status === 'ACCEPTED'
        );
      }
    } catch (err) {
      console.error('Failed to notify requester:', err);
    }

    return updated;
  }
}

export default SkillService;
