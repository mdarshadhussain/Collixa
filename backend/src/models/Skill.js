import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class SkillModel {
  static getClient() {
    return getClient();
  }

  /**
   * Create a new skill
   */
  static async create(skillData) {
    const { data, error } = await getClient()
      .from('skills')
      .insert([skillData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create skill: ${error.message}`);
    return data;
  }

  /**
   * Get all skills with optional filters
   */
  static async getAll(filters = {}) {
    let query = getClient()
      .from('skills')
      .select(`
        *,
        user:users(id, email, name, avatar_url)
      `);

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch skills: ${error.message}`);
    return data || [];
  }

  /**
   * Get skill by ID
   */
  static async getById(id) {
    const { data, error } = await getClient()
      .from('skills')
      .select(`
        *,
        user:users(id, email, name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Skill not found: ${error.message}`);
    return data;
  }

  /**
   * Get skills by user ID
   */
  static async getByUserId(userId) {
    const { data, error } = await getClient()
      .from('skills')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to fetch user skills: ${error.message}`);
    return data || [];
  }
}

export default SkillModel;
