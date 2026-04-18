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
    // Data is already validated in the route
    const intentData = {
      ...data,
      created_by: userId,
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
        // Add owner as first participant
        await supabase
          .from('conversation_participants')
          .insert([{
            conversation_id: conversation.id,
            user_id: userId
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
    // If filters are provided, use filter method
    if (Object.keys(filters).length > 0) {
      return await IntentModel.filter(filters);
    }

    // Otherwise return all intents
    return await IntentModel.getAll();
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

    // Attach collaboration request count
    const requests = await IntentModel.getRequestsForIntent(intentId);
    intent.request_count = requests.length;
    intent.accepted_count = requests.filter(r => r.status === 'ACCEPTED').length;

    // Attach collaborator info if it exists
    if (intent.collaborator_id) {
       try {
         const userSelector = 'id, name, avatar_url, email, level';
         const { data: collaborator, error: collabError } = await getClient()
           .from('users')
           .select(userSelector)
           .eq('id', intent.collaborator_id)
           .single();
         
         if (!collabError) {
           intent.collaborator = collaborator;
         }
       } catch (err) {
         console.error('Failed to enrich collaborator info:', err);
       }
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
    const collaboratorId = intent.collaborator_id;

    if (String(userId) !== String(creatorId) && String(userId) !== String(collaboratorId)) {
      throw new Error('Only participants can confirm completion');
    }

    const updates = { updated_at: new Date().toISOString() };
    const isCreator = String(userId) === String(creatorId);
    const partnerId = isCreator ? collaboratorId : creatorId;

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

    // NOTIFICATION: Notify partner
    try {
      const type = willBeCompleted ? 'INTENT_COMPLETED' : 'INTENT_PARTIAL_COMPLETION';
      const title = willBeCompleted ? 'Connection Completed! 🤝' : 'Partner Sign-off';
      const content = willBeCompleted 
        ? `Your partnership on "${intent.title}" is officially completed. 5 credits awarded!`
        : `Your partner has marked "${intent.title}" as completed. Waiting for your signature.`;
      
      await supabase.from('notifications').insert([{
        user_id: partnerId,
        type,
        title,
        content,
        link: `/intent/${intentId}`,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Failed to send completion notification:', err);
    }

    // REWARDS: Award credits and XP on final completion
    if (willBeCompleted) {
      const CreditService = (await import('./CreditService.js')).default;
      
      // Award 5 credits to both
      await Promise.all([
        CreditService.addCredits(creatorId, 5, 'EARN').catch(e => console.error('Credit award failed:', e)),
        CreditService.addCredits(collaboratorId, 5, 'EARN').catch(e => console.error('Credit award failed:', e))
      ]);

      // Award 100 XP to both
      await Promise.all([
        LevelService.awardXP(creatorId, 100),
        LevelService.awardXP(collaboratorId, 100)
      ]);
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
    return await IntentModel.getByUserId(userId);
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

    return await IntentModel.createRequest(requestData);
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
   * Instant join an intent (adds to group chat immediately)
   * @param {string} intentId - Intent ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created/Updated collaboration request
   */
  static async joinIntent(intentId, userId) {
    // 1. Check if intent exists
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    // 2. Cannot join own intent
    const creatorId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
    if (String(creatorId) === String(userId)) {
      throw new Error('You are the owner of this project');
    }

    // 3. Check if already joined/requested
    const existing = await IntentModel.getExistingRequest(userId, intentId);
    if (existing && existing.status === 'ACCEPTED') {
      return existing; // Already in
    }

    // 4. Create or update request to ACCEPTED
    let request;
    if (existing) {
      request = await IntentModel.updateRequest(existing.id, 'ACCEPTED');
    } else {
      const requestData = {
        intent_id: intentId,
        user_id: userId,
        status: 'ACCEPTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      request = await IntentModel.createRequest(requestData);
    }

    // 5. Add to Group Chat
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('intent_id', intentId)
        .eq('type', 'GROUP')
        .single();

      if (conversation) {
        // Check if already a participant
        const { data: alreadyPart } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversation.id)
          .eq('user_id', userId)
          .single();

        if (!alreadyPart) {
          await supabase
            .from('conversation_participants')
            .insert([{
              conversation_id: conversation.id,
              user_id: userId
            }]);
        }
      }
    } catch (err) {
      console.error('Failed to auto-add user to group chat on join:', err);
    }

    return request;
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

    if (request.status !== 'PENDING' && request.status !== 'ACCEPTED') {
      throw new Error(`Cannot accept a ${request.status} request`);
    }

    // Enforce ONE-ON-ONE: Check if intent is already in progress or has a collaborator
    if (request.intent.status === 'in_progress' || request.intent.collaborator_id) {
      throw new Error('This intent is already in progress with another collaborator');
    }

    // 1. Update the request status
    const updatedRequest = await IntentModel.updateRequest(requestId, 'ACCEPTED');

    // 2. Update the intent to IN PROGRESS and set the collaborator_id
    await IntentModel.update(request.intent_id, {
      status: 'in_progress',
      collaborator_id: request.user_id,
      updated_at: new Date().toISOString()
    });

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
        await supabase
          .from('conversation_participants')
          .insert([{
            conversation_id: conversation.id,
            user_id: request.user_id
          }]);
      }
    } catch (err) {
      console.error('Failed to auto-add user to group chat:', err);
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

    return await IntentModel.updateRequest(requestId, 'REJECTED');
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
