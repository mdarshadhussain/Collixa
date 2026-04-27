import IntentModel from '../models/Intent.js';
import { supabase } from '../config/database.js';
import LevelService from './LevelService.js';

export class IntentService {
  /**
   * Create a new intent
   * @param {Object} data - Intent data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created intent
   */
  static async createIntent(data, userId) {
    // 1. Fetch user to check limits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('level, tier')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');

    // Count intents created THIS month only (monthly limit)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 2. Check current intent count for this month
    const { count, error: countError } = await supabase
      .from('intents')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .gte('created_at', startOfMonth);

    if (countError) throw new Error('Failed to verify intent limits');

    const limits = LevelService.getTierLimits(user.tier);
    if (count >= limits.maxIntents) {
      throw new Error(`Monthly limit reached! Your ${user.tier} rank allows ${limits.maxIntents} intents per month. Gain more XP to level up!`);
    }

    // Data is already validated in the route
    const intentData = {
      ...data,
      created_by: userId,
      collaborator_limit: data.collaborator_limit || 1,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const intent = await IntentModel.create(intentData);

    // AUTOMATION: Create a Project Group Chat
    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert([{
          type: 'GROUP',
          title: intent.title,
          intent_id: intent.id,
          admin_id: userId
        }])
        .select()
        .single();

      if (!convError && conversation) {
        // Add owner as first participant (Admin)
        await supabase
          .from('conversation_participants')
          .insert([{
            conversation_id: conversation.id,
            user_id: userId,
            role: 'ADMIN'
          }]);
      }
    } catch (err) {
      console.error('Failed to auto-create group chat:', err);
      // We don't throw here to avoid failing intent creation if chat fails
    }

    // AWARD XP: User gets 50 XP for starting a new Intent
    LevelService.awardXP(userId, 50).catch(err => console.error('XP Award failure:', err));

    return intent;
  }

  /**
   * Get all intents with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Intents
   */
  static async getAllIntents(filters = {}) {
    let intents;
    // If filters are provided, use filter method
    if (Object.keys(filters).length > 0) {
      intents = await IntentModel.filter(filters);
    } else {
      intents = await IntentModel.getAll();
    }

    // ATTACH CONVERSATION IDs
    try {
      const intentIds = intents.map(i => i.id);
      if (intentIds.length > 0) {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, intent_id')
          .in('intent_id', intentIds)
          .eq('type', 'GROUP');
        
        if (convs) {
          const convMap = convs.reduce((acc, c) => {
            acc[c.intent_id] = c.id;
            return acc;
          }, {});
          
          intents.forEach(i => {
            if (convMap[i.id]) i.conversation_id = convMap[i.id];
          });
        }
      }
    } catch (err) {
      console.error('Failed to attach conversation IDs to marketplace intents:', err);
    }

    return intents;
  }

  /**
   * Get intent by ID with full details
   * @param {string} intentId - Intent ID
   * @returns {Promise<Object>} Intent with details
   */
  static async getIntentById(intentId) {
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

     // Attach accepted collaborators
     intent.collaborators = await IntentModel.getCollaborators(intentId);
     intent.accepted_count = intent.collaborators.length;

     // AUTOMATION: Fetch and attach group chat ID for easy navigation
     try {
       const { data: conv } = await supabase
         .from('conversations')
         .select('id')
         .eq('intent_id', intentId)
         .eq('type', 'GROUP')
         .maybeSingle();
       
       if (conv) intent.conversation_id = conv.id;
     } catch (err) {
       console.error('Failed to fetch conversation ID for intent:', err);
     }

     return intent;
  }

  /**
   * Update intent
   * @param {string} intentId - Intent ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated intent
   */
  static async updateIntent(intentId, updates, userId) {
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    // Check authorization
    const creatorId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
    if (String(creatorId) !== String(userId)) {
      throw new Error('Not authorized to update this intent');
    }

    updates.updated_at = new Date().toISOString();
    return await IntentModel.update(intentId, updates);
  }

  /**
   * Confirm completion of an intent (Dual confirmation)
   * @param {string} intentId - Intent ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated intent
   */
  static async confirmCompletion(intentId, userId) {
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    if (intent.status !== 'in_progress') {
      throw new Error('Completion can only be confirmed for projects in progress');
    }

    const creatorId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
    
    // Multi-collaborator check
    const collaborators = await IntentModel.getCollaborators(intentId);
    const collaboratorIds = collaborators.map(c => String(c.id || c.user?.id));
    const isCollaborator = collaboratorIds.includes(String(userId));

    if (String(userId) !== String(creatorId) && !isCollaborator) {
      throw new Error('Only participants can confirm completion');
    }

    const updates = { updated_at: new Date().toISOString() };
    const isCreator = String(userId) === String(creatorId);
    
    // For notifications, we need a partnerId. 
    // In a multi-collaborator scenario, we might want to notify the owner (if collaborator confirms) 
    // or all collaborators (if owner confirms).
    // For now, let's keep it simple: if collaborator confirms, notify owner. If owner confirms, notify all collaborators.
    const partnersToNotify = isCreator ? collaboratorIds : [creatorId];

    if (isCreator) {
      if (intent.creator_confirmed_at) throw new Error('You have already confirmed completion');
      updates.creator_confirmed_at = new Date().toISOString();
    } else {
      if (intent.collaborator_confirmed_at) throw new Error('You have already confirmed completion');
      updates.collaborator_confirmed_at = new Date().toISOString();
    }

    // Check if both have confirmed
    const willBeCompleted = (isCreator && intent.collaborator_confirmed_at) || 
                            (!isCreator && intent.creator_confirmed_at);

    if (willBeCompleted) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    const updatedIntent = await IntentModel.update(intentId, updates);

    // NOTIFICATION: Notify partners
    try {
      const type = willBeCompleted ? 'INTENT_COMPLETED' : 'INTENT_PARTIAL_COMPLETION';
      const title = willBeCompleted ? 'Connection Completed! 🤝' : 'Partner Sign-off';
      const content = willBeCompleted 
        ? `Your partnership on "${intent.title}" is officially completed. 5 credits awarded!`
        : `Your partner has marked "${intent.title}" as completed. Waiting for your signature.`;
      
      await Promise.all(partnersToNotify.map(pid => 
        supabase.from('notifications').insert([{
          user_id: pid,
          type,
          title,
          content,
          link: `/intent/${intentId}`,
          is_read: false,
          created_at: new Date().toISOString()
        }])
      ));
    } catch (err) {
      console.error('Failed to send completion notifications:', err);
    }

    // REWARDS: Award credits and XP on final completion
    if (willBeCompleted) {
      const CreditService = (await import('./CreditService.js')).default;
      
      // Award 5 credits to EVERYONE involved
      const allParticipants = [creatorId, ...collaboratorIds];
      await Promise.all(allParticipants.map(pid => 
        CreditService.addCredits(pid, 5, 'EARN').catch(e => console.error('Credit award failed:', e))
      ));

      // Award 100 XP to EVERYONE involved
      await Promise.all(allParticipants.map(pid => 
        LevelService.awardXP(pid, 100)
      ));
    }

    return updatedIntent;
  }

  /**
   * Complete an intent (Legacy/Admin force)
   * @param {string} intentId - Intent ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated intent
   */
  static async completeIntent(intentId, userId) {
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    // Check if user is admin (this is a legacy method used by complete route, now better as admin override)
    // For simplicity, we keep it as a legacy single-sided completion if needed, 
    // but the new flow uses confirmCompletion.
    
    return await IntentModel.update(intentId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Delete intent
   * @param {string} intentId - Intent ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success
   */
  static async deleteIntent(intentId, userId) {
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    const creatorId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
    if (String(creatorId) !== String(userId)) {
      throw new Error('Not authorized to delete this intent');
    }

    return await IntentModel.delete(intentId);
  }

  /**
   * Get intents created by a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's intents
   */
  static async getUserIntents(userId) {
    const intents = await IntentModel.getByUserId(userId);
    
    // ATTACH CONVERSATION IDs
    try {
      const intentIds = intents.map(i => i.id);
      if (intentIds.length > 0) {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, intent_id')
          .in('intent_id', intentIds)
          .eq('type', 'GROUP');
        
        if (convs) {
          const convMap = convs.reduce((acc, c) => {
            acc[c.intent_id] = c.id;
            return acc;
          }, {});
          
          intents.forEach(i => {
            if (convMap[i.id]) i.conversation_id = convMap[i.id];
          });
        }
      }
    } catch (err) {
      console.error('Failed to attach conversation IDs to user intents:', err);
    }

    return intents;
  }

  /**
   * Send collaboration request
   * @param {string} intentId - Intent ID
   * @param {string} userId - User ID sending request
   * @returns {Promise<Object>} Created request
   */
  static async sendCollaborationRequest(intentId, userId) {
    // Check if intent exists
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    // Cannot request own intent
    const creatorId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
    if (String(creatorId) === String(userId)) {
      throw new Error('Cannot request collaboration on your own intent');
    }

    // Check if already requested
    const existing = await IntentModel.getExistingRequest(userId, intentId);
    if (existing) {
      if (existing.status === 'PENDING') {
        throw new Error('You have already requested collaboration on this intent');
      }
      if (existing.status === 'ACCEPTED') {
        throw new Error('You are already collaborating on this intent');
      }
    }

    const requestData = {
      intent_id: intentId,
      user_id: userId,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const request = await IntentModel.createRequest(requestData);

    // NOTIFICATION: Notify intent owner
    try {
      const { data: requester } = await supabase.from('users').select('name').eq('id', userId).single();
      
      await supabase.from('notifications').insert([{
        user_id: creatorId,
        type: 'COLLABORATION_REQUEST',
        title: 'New Collaboration Request! 🚀',
        content: `${requester?.name || 'Someone'} wants to collaborate on "${intent.title}"`,
        link: `/intent/${intentId}`,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Failed to send collaboration request notification:', err);
    }

    return request;
  }

  /**
   * Get collaboration requests for an intent
   * @param {string} intentId - Intent ID
   * @returns {Promise<Array>} Collaboration requests
   */
  static async getCollaborationRequests(intentId) {
    return await IntentModel.getRequestsForIntent(intentId);
  }

  /**
   * Get collaboration requests for an intent
   * @param {string} intentId - Intent ID
   * @returns {Promise<Array>} Collaboration requests
   */
  static async getCollaborationRequests(intentId) {
    return await IntentModel.getRequestsForIntent(intentId);
  }

  /**
   * Accept collaboration request
   * @param {string} requestId - Request ID
   * @param {string} userId - User ID (must be intent creator)
   * @returns {Promise<Object>} Updated request
   */
  static async acceptRequest(requestId, userId) {
    // Verify the request exists and get full details
    const { data: request, error: fetchError } = await supabase
      .from('collaboration_requests')
      .select('*, intent:intents(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new Error('Request not found');
    }

    // Verify user is intent creator
    const creatorId = typeof request.intent.created_by === 'object' ? request.intent.created_by.id : request.intent.created_by;
    if (String(creatorId) !== String(userId)) {
      throw new Error('Not authorized to accept this request');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot accept a ${request.status} request`);
    }

    // MULTI-MEMBER LOGIC: Check against collaborator_limit
    const collaborators = await IntentModel.getCollaborators(request.intent_id);
    const limit = request.intent.collaborator_limit || 1;

    if (collaborators.length >= limit) {
      throw new Error(`This intent has already reached its limit of ${limit} collaborators`);
    }

    // 1. Update the request status
    const updatedRequest = await IntentModel.updateRequest(requestId, 'ACCEPTED');

    // 2. Update the intent status if it's the first collaborator
    if (collaborators.length === 0) {
      await IntentModel.update(request.intent_id, {
        status: 'in_progress',
        updated_at: new Date().toISOString()
      });
    }

    // 3. Fetch user info for the system message
    const { data: acceptedUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', request.user_id)
      .single();

    // AUTOMATION: Add user to Project Group Chat
    try {
      // Find the group chat for this intent
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('intent_id', request.intent_id)
        .eq('type', 'GROUP')
        .single();

      if (conversation) {
        // Add to participants
        await supabase
          .from('conversation_participants')
          .insert([{
            conversation_id: conversation.id,
            user_id: request.user_id,
            role: 'MEMBER'
          }]);

        // Insert WhatsApp-style Join Message
        const ChatService = (await import('./ChatService.js')).default;
        await ChatService.sendMessage(
          conversation.id, 
          userId, // Sent by owner (or system)
          `[SYSTEM]: ${acceptedUser?.name || 'A new member'} joined the group`
        );
      }
    } catch (err) {
      console.error('Failed to auto-add user to group chat:', err);
    }

    // NOTIFICATION: Notify requester
    try {
      await supabase.from('notifications').insert([{
        user_id: request.user_id,
        type: 'REQUEST_ACCEPTED',
        title: 'Request Accepted! 🎉',
        content: `Your request to join "${request.intent.title}" has been accepted.`,
        link: `/intent/${request.intent_id}`,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Failed to send acceptance notification:', err);
    }

    return updatedRequest;
  }

  /**
   * Reject collaboration request
   * @param {string} requestId - Request ID
   * @param {string} userId - User ID (must be intent creator)
   * @returns {Promise<Object>} Updated request
   */
  static async rejectRequest(requestId, userId) {
    // Verify the request exists and get full details
    const { data: request, error: fetchError } = await supabase
      .from('collaboration_requests')
      .select('*, intent:intents(created_by)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new Error('Request not found');
    }

    // Verify user is intent creator
    if (request.intent.created_by !== userId) {
      throw new Error('Not authorized to reject this request');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot reject a ${request.status} request`);
    }

    const updatedRequest = await IntentModel.updateRequest(requestId, 'REJECTED');

    // NOTIFICATION: Notify requester
    try {
      const { data: intent } = await supabase.from('intents').select('title').eq('id', request.intent_id).single();
      
      await supabase.from('notifications').insert([{
        user_id: request.user_id,
        type: 'REQUEST_REJECTED',
        title: 'Request Declined',
        content: `Your request to join "${intent?.title}" was not accepted at this time.`,
        link: `/intent/${request.intent_id}`,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Failed to send rejection notification:', err);
    }

    return updatedRequest;
  }

  /**
   * Filter intents by category and/or location
   * @param {string} category - Category filter
   * @param {string} location - Location filter
   * @returns {Promise<Array>} Filtered intents
   */
  static async filterIntents(category, location) {
    const filters = {};

    if (category && category !== 'All') {
      filters.category = category;
    }

    if (location && location !== 'All') {
      filters.location = location;
    }

    return await IntentModel.filter(filters);
  }

  /**
   * Search intents by title or description
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Matching intents
   */
  static async searchIntents(keyword) {
    const allIntents = await IntentModel.getAll();

    return allIntents.filter(intent =>
      intent.title.toLowerCase().includes(keyword.toLowerCase()) ||
      intent.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}

export default IntentService;
