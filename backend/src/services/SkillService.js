import SkillModel from '../models/Skill.js';
import SkillExchangeModel from '../models/SkillExchange.js';
import NotificationService from './NotificationService.js';
import LevelService from './LevelService.js';

export class SkillService {
  /**
   * List a new skill
   */
  static async addSkill(userId, skillData) {
    // 1. Check limits
    const { data: user, error: userError } = await SkillModel.getClient()
      .from('users')
      .select('level, tier')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');

    const { count, error: countError } = await SkillModel.getClient()
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw new Error('Failed to verify tribe limits');

    const limits = LevelService.getTierLimits(user.tier);
    if (count >= limits.maxSkills) {
      throw new Error(`Limit reached! Your ${user.tier} rank allows listing only ${limits.maxSkills} tribes. Reach the next level to unlock more!`);
    }

    const skill = await SkillModel.create({
      user_id: userId,
      status: 'active',
      max_members: skillData.max_members || 5,
      schedule: skillData.schedule || [],
      meeting_link: skillData.meeting_link || `https://meet.jit.si/CollixaTribe_${userId}_${Date.now()}`,
      ...skillData
    });

    // AUTOMATION: Create a Permanent Tribe Group Chat
    try {
      const { data: conversation, error: convError } = await SkillModel.getClient()
        .from('conversations')
        .insert([{
          type: 'GROUP',
          title: `Tribe: ${skill.name}`,
          admin_id: userId,
          last_message: 'Tribe Group Created'
        }])
        .select()
        .single();

      if (!convError && conversation) {
        // Add expert as ADMIN
        await SkillModel.getClient().from('conversation_participants').insert([
          { conversation_id: conversation.id, user_id: userId, role: 'ADMIN' }
        ]);

        // Link conversation to skill
        await SkillModel.update(skill.id, { conversation_id: conversation.id });

        // Send welcome message
        const { ChatService } = await import('./ChatService.js');
        await ChatService.sendMessage(
          conversation.id,
          userId,
          `Welcome to the "${skill.name}" Tribe! This is your permanent classroom group.`,
          'system'
        );
      }
    } catch (err) {
      console.error('Failed to create tribe group chat:', err);
    }

    // Award XP for creating a tribe
    LevelService.awardXP(userId, 30, 'Created a Tribe').catch(console.error);

    return skill;
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
      throw new Error('You cannot join your own tribe.');
    }

    // Check if tribe is full
    const { count, error: countError } = await SkillModel.getClient()
      .from('skill_exchanges')
      .select('*', { count: 'exact', head: true })
      .eq('skill_id', skillId)
      .eq('status', 'ACCEPTED');

    if (!countError && count >= (skill.max_members || 5)) {
      throw new Error('This tribe has reached its maximum number of students.');
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
      throw new Error('Only the tribe admin can update this request');
    }

    if (existing.status !== 'PENDING' && (status === 'ACCEPTED' || status === 'REJECTED')) {
      throw new Error(`Cannot update a ${existing.status} request`);
    }

    const updated = await SkillExchangeModel.updateStatus(exchangeId, status, data);
    
    // Notify requester
    try {
      if (status === 'ACCEPTED' || status === 'REJECTED') {
        const { data: skill } = await client
          .from('skills')
          .select('id, name, conversation_id, user_id')
          .eq('id', existing.skill_id)
          .single();
        
        const { data: provider } = await client.from('users').select('name').eq('id', existing.provider_id).single();
        
        await NotificationService.notifyRequestResponse(
          existing.requester_id, 
          provider?.name || 'A provider', 
          skill?.name || 'tribe',
          status === 'ACCEPTED'
        );

        // AUTOMATION: Add student to the Tribe Group Chat
        if (status === 'ACCEPTED' && skill.conversation_id) {
          try {
            // 1. Add to participants
            await client.from('conversation_participants').upsert([
              { conversation_id: skill.conversation_id, user_id: existing.requester_id, role: 'MEMBER' }
            ]);

            // 2. Send system message to group
            const { data: student } = await client.from('users').select('name').eq('id', existing.requester_id).single();
            
            const { ChatService } = await import('./ChatService.js');
            await ChatService.sendMessage(
              skill.conversation_id,
              skill.user_id,
              `${student?.name} has joined the Tribe!`,
              'system'
            );
          } catch (err) {
            console.error('Failed to add student to tribe group chat:', err);
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

  /**
   * Get skill details with collaborator list
   */
  static async getSkillWithCollaborators(skillId) {
    const skill = await SkillModel.getById(skillId);
    if (!skill) throw new Error('Tribe not found');

    const members = await SkillModel.getMembers(skillId);
    const notices = await SkillModel.getNotices(skillId);
    
    return {
      ...skill,
      members: members.map(m => m.user),
      notices
    };
  }

  /**
   * Create a notice for a tribe
   */
  static async createNotice(userId, skillId, content, type) {
    const skill = await SkillModel.getById(skillId);
    if (skill.user_id !== userId) {
      throw new Error('Only the tribe leader can post notices');
    }
    return await SkillModel.addNotice(skillId, userId, content, type);
  }

  /**
   * Delete a notice
   */
  static async deleteNotice(userId, noticeId) {
    // 1. Get notice to check skill ownership
    const { data: notice, error } = await SkillModel.getClient()
      .from('skill_notices')
      .select('skill_id')
      .eq('id', noticeId)
      .single();
    
    if (error || !notice) throw new Error('Notice not found');

    const skill = await SkillModel.getById(notice.skill_id);
    if (skill.user_id !== userId) {
      throw new Error('Only the tribe leader can delete notices');
    }

    const { error: deleteError } = await SkillModel.getClient()
      .from('skill_notices')
      .delete()
      .eq('id', noticeId);

    if (deleteError) throw deleteError;
    return true;
  }
}

export default SkillService;
