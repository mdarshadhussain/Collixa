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

    let finalQuery = query;
    if (filters.sortBy === 'rating') {
      // Note: Supabase doesn't easily sort by joined views in a single 'order' call on the main table
      // but since we are flattening anyway, we can sort the results in memory OR try a raw order
      // For simplicity and correctness with pagination (if added later), 
      // we'll try to order by the skill_ratings view if possible, or just sort in memory.
      // Since SkillModel already flattens, we can sort after retrieval.
    } else {
      finalQuery = finalQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await finalQuery;

    if (error) throw new Error(`Failed to fetch skills: ${error.message}`);
    
    if (!data || data.length === 0) return [];

    // Fetch all ratings for these skills in one go
    const skillIds = data.map(s => s.id);
    const { data: ratingData } = await getClient()
      .from('skill_ratings')
      .select('skill_id, avg_rating, review_count')
      .in('skill_id', skillIds);

    const ratingsMap = (ratingData || []).reduce((acc, curr) => {
      acc[curr.skill_id] = curr;
      return acc;
    }, {});

    // Flatten results
    let results = data.map(item => ({
      ...item,
      avg_rating: ratingsMap[item.id]?.avg_rating || 0,
      review_count: ratingsMap[item.id]?.review_count || 0
    }));

    if (filters.sortBy === 'rating') {
      results.sort((a, b) => b.avg_rating - a.avg_rating);
    }

    return results;
  }

  /**
   * Get skill by ID
   */
  static async getById(id) {
    const { data: skill, error } = await getClient()
      .from('skills')
      .select(`
        *,
        user:users(id, email, name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Skill not found: ${error.message}`);
    
    // Fetch rating separately
    const { data: ratingData } = await getClient()
      .from('skill_ratings')
      .select('avg_rating, review_count')
      .eq('skill_id', id)
      .single();

    return {
      ...skill,
      avg_rating: ratingData?.avg_rating || 0,
      review_count: ratingData?.review_count || 0
    };
  }

  /**
   * Update skill
   */
  static async update(id, updates) {
    const { data, error } = await getClient()
      .from('skills')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update skill: ${error.message}`);
    return data;
  }

  /**
   * Delete skill
   */
  static async delete(id) {
    const { error } = await getClient()
      .from('skills')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete skill: ${error.message}`);
    return true;
  }

  /**
   * Get skills by user ID
   */
  static async getByUserId(userId) {
    const { data: skills, error } = await getClient()
      .from('skills')
      .select(`*`)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to fetch user skills: ${error.message}`);
    
    if (!skills || skills.length === 0) return [];

    // Fetch ratings for these skills
    const skillIds = skills.map(s => s.id);
    const { data: ratingData } = await getClient()
      .from('skill_ratings')
      .select('skill_id, avg_rating, review_count')
      .in('skill_id', skillIds);

    const ratingsMap = (ratingData || []).reduce((acc, curr) => {
      acc[curr.skill_id] = curr;
      return acc;
    }, {});

    return skills.map(item => ({
      ...item,
      avg_rating: ratingsMap[item.id]?.avg_rating || 0,
      review_count: ratingsMap[item.id]?.review_count || 0
    }));
  }
}

export default SkillModel;
