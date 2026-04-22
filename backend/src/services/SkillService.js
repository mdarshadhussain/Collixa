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
      status: 'active',
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
      await NotificationService.notifySkillRequest(skill.user_id, requester?.name || 'A user', skill.name);
    } catch (err) {
      console.error('Failed to send notification:', err);
    }

    return exchange;
  }

  static async getUserExchanges(userId) {
    return await SkillExchangeModel.getByUser(userId);
  }

  /**
   * Schedule or update status
   */
  static async updateExchangeStatus(userId, exchangeId, status, data) {
    const client = SkillExchangeModel.getClient();
    const { data: existing, error } = await client
      .from('skill_exchanges')
      .select('id, requester_id, provider_id, skill_id, status')
      .eq('id', exchangeId)
      .single();

    if (error || !existing) {
      throw new Error('Exchange request not found');
    }

    if (existing.provider_id !== userId) {
      throw new Error('Only the skill provider can update this request');
    }

    if (existing.status !== 'PENDING' && (status === 'ACCEPTED' || status === 'REJECTED')) {
      throw new Error(`Cannot update a ${existing.status} request`);
    }

    const updated = await SkillExchangeModel.updateStatus(exchangeId, status, data);
    
    // Notify requester
    try {
      if (status === 'ACCEPTED' || status === 'REJECTED') {
        const { data: exchange } = await client
          .from('skill_exchanges')
          .select('requester_id, skill_id, provider_id')
          .eq('id', exchangeId)
          .single();
        
        const { data: provider } = await client.from('users').select('name').eq('id', exchange.provider_id).single();
        const { data: skill } = await client.from('skills').select('name').eq('id', exchange.skill_id).single();
        
        await NotificationService.notifyRequestResponse(
          exchange.requester_id, 
          provider?.name || 'A provider', 
          skill?.name || 'skill',
          status === 'ACCEPTED'
        );

        // AUTOMATION: Create a Direct Chat for Accepted Tribe Exchanges
        if (status === 'ACCEPTED') {
          try {
            // 1. Create the conversation
            const { data: conversation, error: convError } = await client
              .from('conversations')
              .insert([{
                type: 'DIRECT',
                participant_1: exchange.provider_id,
                participant_2: exchange.requester_id,
                title: `Tribe: ${skill?.name || 'Collaboration'}`
              }])
              .select()
              .single();

            if (!convError && conversation) {
              // 2. Add participants
              await client.from('conversation_participants').insert([
                { conversation_id: conversation.id, user_id: exchange.provider_id, role: 'ADMIN' },
                { conversation_id: conversation.id, user_id: exchange.requester_id, role: 'MEMBER' }
              ]);

              // 3. Send system message
              const { data: requester } = await client.from('users').select('name').eq('id', exchange.requester_id).single();
              const { data: prov } = await client.from('users').select('name').eq('id', exchange.provider_id).single();
              
              const { ChatService } = await import('./ChatService.js');
              await ChatService.sendMessage(
                conversation.id,
                exchange.provider_id,
                `[SYSTEM]: Tribe collaboration started! You can now chat and schedule meetings for "${skill?.name || 'this skill'}".`,
                'system'
              );
            }
          } catch (err) {
            console.error('Failed to auto-create tribe chat:', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to notify requester:', err);
    }

    return updated;
  }

  /**
   * Update a skill
   */
  static async updateSkill(userId, skillId, updateData) {
    const skill = await SkillModel.getById(skillId);
    if (skill.user_id !== userId) {
      throw new Error('You are not authorized to update this skill');
    }
    return await SkillModel.update(skillId, updateData);
  }

  /**
   * Get all skills for a specific user
   */
  static async getUserSkills(userId) {
    return await SkillModel.getByUserId(userId);
  }

  /**
   * Delete a skill
   */
  static async deleteSkill(userId, skillId) {
    const skill = await SkillModel.getById(skillId);
    if (skill.user_id !== userId) {
      throw new Error('You are not authorized to delete this skill');
    }
    return await SkillModel.delete(skillId);
  }
}

export default SkillService;
