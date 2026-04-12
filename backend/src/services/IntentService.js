import IntentModel from '../models/Intent.js';
import { supabase } from '../config/database.js';

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
      status: 'looking',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await IntentModel.create(intentData);
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
   * Complete an intent
   * @param {string} intentId - Intent ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated intent
   */
  static async completeIntent(intentId, userId) {
    const intent = await IntentModel.getById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    const creatorId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
    if (String(creatorId) !== String(userId)) {
      throw new Error('Not authorized to complete this intent');
    }

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
   * Accept collaboration request
   * @param {string} requestId - Request ID
   * @param {string} userId - User ID (must be intent creator)
   * @returns {Promise<Object>} Updated request
   */
  static async acceptRequest(requestId, userId) {
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
      throw new Error('Not authorized to accept this request');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot accept a ${request.status} request`);
    }

    return await IntentModel.updateRequest(requestId, 'ACCEPTED');
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
