import SkillModel from '../models/Skill.js';
import SkillExchangeModel from '../models/SkillExchange.js';

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

    return await SkillExchangeModel.createRequest({
      requester_id: requesterId,
      provider_id: skill.user_id,
      skill_id: skillId,
      message,
      status: 'PENDING'
    });
  }

  /**
   * Schedule or update status
   */
  static async updateExchangeStatus(userId, exchangeId, status, data) {
    // Basic verification could go here (e.g., only provider can accept)
    return await SkillExchangeModel.updateStatus(exchangeId, status, data);
  }
}

export default SkillService;
