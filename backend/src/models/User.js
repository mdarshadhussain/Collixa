import { supabase, supabaseAdmin } from '../config/database.js';

// Helper to get the best available client (prioritize admin client for RLS bypass)
const getClient = () => supabaseAdmin || supabase;

export class UserModel {
  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object or null
   */
  static async findByEmail(email) {
    const { data, error } = await getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw new Error(`Database error: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User object or null
   */
  static async findById(id) {
    const { data, error } = await getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    const { data, error } = await getClient()
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user object
   */
  static async update(id, updates) {
    const { data, error } = await getClient()
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const { error } = await getClient()
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} Array of users
   */
  static async getAll() {
    const { data, error } = await getClient()
      .from('users')
      .select('id, email, role, created_at, updated_at');

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }
}

export default UserModel;
