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

    // Count tribes created THIS month only (monthly limit)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error: countError } = await SkillModel.getClient()
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth);

    if (countError) throw new Error('Failed to verify tribe limits');

    const limits = LevelService.getTierLimits(user.tier);
    if (count >= limits.maxSkills) {
      throw new Error(`Monthly limit reached! Your ${user.tier} rank allows listing ${limits.maxSkills} tribes per month. Gain more XP to level up!`);
    }

    const skill = await SkillModel.create({
      ...skillData,
      user_id: userId,
      max_members: skillData.max_members || 5,
      schedule: skillData.schedule || [],
      meeting_link: skillData.meeting_link || `https://meet.jit.si/CollixaTribe_${userId}_${Date.now()}`,
      status: 'pending',
    });

    // AUTOMATION: Create a Tribe Group Chat
    const { data: conversation, error: convError } = await SkillModel.getClient()
      .from('conversations')
      .insert([{
        title: `Tribe: ${skill.name}`,
        type: 'GROUP',
        admin_id: userId
      }])
      .select()
      .single();

    if (!convError && conversation) {
      // Link conversation back to skill
      await SkillModel.update(skill.id, { conversation_id: conversation.id });

      // Add owner as first participant (Admin)
      await SkillModel.getClient()
        .from('conversation_participants')
        .insert([{
          conversation_id: conversation.id,
          user_id: userId,
          role: 'ADMIN'
        }]);
    }

    // Award XP for creating a tribe
    LevelService.awardXP(userId, 30, 'Created a Tribe').catch(console.error);

    return skill;
  }

  /**
   * Get all skills with search
   * @param {Object} filters - search filters
   * @param {string} [currentUserId] - current user ID (to show their pending tribes)
   */
  static async searchSkills(filters, currentUserId = null) {
    const skills = await SkillModel.getAll(filters, currentUserId);
    
    // ATTACH CONVERSATION IDs by Title
    try {
      const tribeTitles = skills.map(s => `Tribe: ${s.name}`);
      if (tribeTitles.length > 0) {
        const { data: convs } = await SkillModel.getClient()
          .from('conversations')
          .select('id, title')
          .in('title', tribeTitles)
          .eq('type', 'GROUP');
        
        if (convs) {
          const titleMap = convs.reduce((acc, c) => {
            acc[c.title] = c.id;
            return acc;
          }, {});
          
          skills.forEach(s => {
            const title = `Tribe: ${s.name}`;
            if (titleMap[title]) s.conversation_id = titleMap[title];
          });
        }
      }
    } catch (err) {
      console.error('Failed to attach conversation IDs to search skills:', err);
    }

    return skills;
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
        let targetConversationId = skill.conversation_id;
        
        // FALLBACK: If not linked, find by title
        if (!targetConversationId) {
          try {
            const { data: conv } = await client
              .from('conversations')
              .select('id')
              .eq('type', 'GROUP')
              .eq('title', `Tribe: ${skill.name}`)
              .maybeSingle();
            
            if (conv) {
              targetConversationId = conv.id;
            }
          } catch (err) {
            console.error('Failed to find tribe conversation for new member:', err);
          }
        }

        if (status === 'ACCEPTED' && targetConversationId) {
          try {
            // 1. Add to participants
            await client.from('conversation_participants').upsert([
              { conversation_id: targetConversationId, user_id: existing.requester_id, role: 'MEMBER' }
            ]);

            // 2. Send system message to group
            const { data: student } = await client.from('users').select('name').eq('id', existing.requester_id).single();
            
            const { ChatService } = await import('./ChatService.js');
            await ChatService.sendMessage(
              targetConversationId,
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
   * Get all skills for a specific user (listed and enrolled)
   */
  static async getUserSkills(userId) {
    // 1. Get skills listed by the user
    const listedSkills = await SkillModel.getByUserId(userId);
    
    // 2. Get skills the user is enrolled in
    const { data: exchanges, error } = await SkillModel.getClient()
      .from('skill_exchanges')
      .select(`
        skill_id
      `)
      .eq('requester_id', userId)
      .eq('status', 'ACCEPTED');

    if (error) {
      console.error('Error fetching enrolled skill IDs:', error);
      return listedSkills;
    }

    const enrolledSkillIds = (exchanges || []).map(e => e.skill_id);
    if (enrolledSkillIds.length === 0) return listedSkills;

    // Filter out skills already in listedSkills
    const listedIds = new Set(listedSkills.map(s => s.id));
    const uniqueEnrolledIds = enrolledSkillIds.filter(id => !listedIds.has(id));

    if (uniqueEnrolledIds.length === 0) return listedSkills;

    // Fetch details for enrolled skills
    const enrolledSkills = await Promise.all(
      uniqueEnrolledIds.map(id => SkillModel.getById(id).catch(() => null))
    );

    const allSkills = [...listedSkills, ...enrolledSkills.filter(Boolean)];

    // ATTACH CONVERSATION IDs by Title
    try {
      const tribeTitles = allSkills.map(s => `Tribe: ${s.name}`);
      if (tribeTitles.length > 0) {
        const { data: convs } = await SkillModel.getClient()
          .from('conversations')
          .select('id, title')
          .in('title', tribeTitles)
          .eq('type', 'GROUP');
        
        if (convs) {
          const titleMap = convs.reduce((acc, c) => {
            acc[c.title] = c.id;
            return acc;
          }, {});
          
          allSkills.forEach(s => {
            const title = `Tribe: ${s.name}`;
            if (titleMap[title]) s.conversation_id = titleMap[title];
          });
        }
      }
    } catch (err) {
      console.error('Failed to attach conversation IDs to user skills:', err);
    }

    return allSkills;
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
    
    // ATTACH CONVERSATION ID
    let conversation_id = skill.conversation_id;
    
    // FALLBACK: Search by title if not linked (or if the link is an invalid UUID string)
    if (!conversation_id) {
      try {
        const { data: conv } = await SkillModel.getClient()
          .from('conversations')
          .select('id')
          .eq('type', 'GROUP')
          .eq('title', `Tribe: ${skill.name}`)
          .maybeSingle();
        
        if (conv) {
          conversation_id = conv.id;
        }
      } catch (err) {
        console.error('Failed to find tribe conversation by title:', err);
      }
    }
    
    return {
      ...skill,
      members: members.map(m => ({ ...m.user, exchange_id: m.id })).filter(Boolean),
      notices,
      conversation_id
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
