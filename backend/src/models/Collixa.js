import { supabase, supabaseAdmin } from '../config/database.js';

// Helper to get the best available client
const getClient = () => supabaseAdmin || supabase;

// Helper function to enrich intent with user data
const enrichIntentWithUser = async (intent) => {
  if (!intent || !intent.created_by) return intent;
  
  try {
    // Fetch user details
    const { data: user, error } = await getClient()
      .from('users')
      .select('id, email, name, avatar_url')
      .eq('id', intent.created_by)
      .single();
    
    if (!error && user) {
      return {
        ...intent,
        created_by: user
      };
    }
  } catch (err) {
    console.error('Error enriching intent with user:', err);
  }
  
  return intent;
};

// Helper function to enrich multiple intents with user data
const enrichIntentsWithUsers = async (intents) => {
  return Promise.all(intents.map(intent => enrichIntentWithUser(intent)));
};

export class IntentModel {
  /**
   * Create a new intent
   * @param {Object} intentData - Intent data
   * @returns {Promise<Object>} Created intent
   */
  static async create(intentData) {
    const { data, error } = await getClient()
      .from('intents')
      .insert([intentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create intent: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all intents
   * @returns {Promise<Array>} All intents
   */
  static async getAll() {
    const { data, error } = await getClient()
      .from('intents')
      .select(`*`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch intents: ${error.message}`);
    }

    // Enrich with user data
    return await enrichIntentsWithUsers(data || []);
  }

  /**
   * Get intent by ID
   * @param {string} id - Intent ID
   * @returns {Promise<Object>} Intent object or null
   */
  static async getById(id) {
    const { data, error } = await getClient()
      .from('intents')
      .select(`*`)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch intent: ${error.message}`);
    }

    if (!data) return null;
    
    // Enrich with user data
    return await enrichIntentWithUser(data);
  }

  /**
   * Get intents by userId
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's intents
   */
  static async getByUserId(userId) {
    const { data, error } = await getClient()
      .from('intents')
      .select(`*`)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user intents: ${error.message}`);
    }

    // Enrich with user data
    return await enrichIntentsWithUsers(data || []);
  }

  /**
   * Filter intents by category, location, or date
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered intents
   */
  static async filter(filters) {
    let query = getClient()
      .from('intents')
      .select(`*`);

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters.location && filters.location !== 'All') {
      query = query.eq('location', filters.location);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to filter intents: ${error.message}`);
    }

    // Enrich with user data
    return await enrichIntentsWithUsers(data || []);
  }

  /**
   * Update intent
   * @param {string} id - Intent ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated intent
   */
  static async update(id, updates) {
    const { data, error } = await getClient()
      .from('intents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update intent: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete intent
   * @param {string} id - Intent ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const { error } = await getClient()
      .from('intents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete intent: ${error.message}`);
    }

    return true;
  }

  /**
   * Create collaboration request
   * @param {Object} requestData - Request data (userId, intentId)
   * @returns {Promise<Object>} Created request
   */
  static async createRequest(requestData) {
    const { data, error } = await getClient()
      .from('collaboration_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create collaboration request: ${error.message}`);
    }

    return data;
  }

  /**
   * Get collaboration requests for an intent
   * @param {string} intentId - Intent ID
   * @returns {Promise<Array>} Collaboration requests
   */
  static async getRequestsForIntent(intentId) {
    const { data, error } = await getClient()
      .from('collaboration_requests')
      .select(`
        *,
        user:users(id, email, name, avatar_url)
      `)
      .eq('intent_id', intentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch collaboration requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update collaboration request status
   * @param {string} requestId - Request ID
   * @param {string} status - New status (ACCEPTED, REJECTED)
   * @returns {Promise<Object>} Updated request
   */
  static async updateRequest(requestId, status) {
    const { data, error } = await getClient()
      .from('collaboration_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update collaboration request: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if user already requested collaboration
   * @param {string} userId - User ID
   * @param {string} intentId - Intent ID
   * @returns {Promise<Object|null>} Existing request or null
   */
  static async getExistingRequest(userId, intentId) {
    const { data, error } = await getClient()
      .from('collaboration_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('intent_id', intentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check existing request: ${error.message}`);
    }

    return data || null;
  }
}

export default IntentModel;
