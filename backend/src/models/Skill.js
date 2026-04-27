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
    try {
      const { data, error } = await getClient()
        .from('skills')
        .insert([skillData])
        .select()
        .single();

      if (error) {
        // Handle missing columns in schema surgically
        if (error.message && (error.message.includes("in the schema cache") || error.message.includes("does not exist"))) {
           const match = error.message.match(/column "(.*?)"/i) || error.message.match(/column '(.*?)'/i);
           const missingColumn = match ? match[1] : null;
           
           if (missingColumn && skillData[missingColumn] !== undefined) {
             console.warn(`[SkillModel] Stripping missing column: ${missingColumn}`);
             const { [missingColumn]: _, ...remainingData } = skillData;
             return this.create(remainingData); // Recursive retry with one less column
           } else {
             // If we can't identify the column or it's not in our list, try the broad fallback
             const { duration, status, max_members, schedule, meeting_link, conversation_id, start_date, ...rest } = skillData;
             const { data: retryData, error: retryError } = await getClient()
               .from('skills')
               .insert([rest])
               .select()
               .single();
             
             if (retryError) throw new Error(`Failed to create skill (schema fallback): ${retryError.message}`);
             return retryData;
           }
        }

        throw new Error(`Failed to create skill: ${error.message}`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get all skills with optional filters
   * @param {Object} filters - search/category/sort filters
   * @param {string|null} currentUserId - if provided, also include this user's pending skills
   */
  static async getAll(filters = {}, currentUserId = null) {
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

    // Status filter: show active + the current user's own pending tribes
    if (currentUserId) {
      // Show active OR (pending AND owned by current user)
      query = query.or(`status.eq.active,and(status.eq.pending,user_id.eq.${currentUserId})`);
    } else {
      // No authenticated user — only show active
      query = query.eq('status', 'active');
    }

    let finalQuery = query;
    if (filters.sortBy === 'rating') {
      // Sort by rating in memory after retrieval
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
   * Get all members of a skill (accepted exchanges)
   */
  static async getMembers(id) {
    const { data, error } = await getClient()
      .from('skill_exchanges')
      .select(`
        id,
        status,
        user:users!skill_exchanges_requester_id_fkey(id, name, avatar_url, email)
      `)
      .eq('skill_id', id)
      .eq('status', 'ACCEPTED');

    if (error) throw new Error(`Failed to fetch skill members: ${error.message}`);
    return data || [];
  }

  /**
   * Update skill
   */
  static async update(id, updates) {
    try {
      const { data, error } = await getClient()
        .from('skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Handle missing columns in updates surgically
        if (error.message && (error.message.includes("in the schema cache") || error.message.includes("does not exist"))) {
           const match = error.message.match(/column "(.*?)"/i) || error.message.match(/column '(.*?)'/i);
           const missingColumn = match ? match[1] : null;

           if (missingColumn && updates[missingColumn] !== undefined) {
             console.warn(`[SkillModel] Stripping missing column from update: ${missingColumn}`);
             const { [missingColumn]: _, ...remainingUpdates } = updates;
             return this.update(id, remainingUpdates); // Recursive retry
           } else {
             const { duration, status, max_members, schedule, meeting_link, conversation_id, start_date, ...rest } = updates;
             const { data: retryData, error: retryError } = await getClient()
               .from('skills')
               .update(rest)
               .eq('id', id)
               .select()
               .single();
             
             if (retryError) throw new Error(`Failed to update skill (schema fallback): ${retryError.message}`);
             return retryData;
           }
        }
        throw new Error(`Failed to update skill: ${error.message}`);
      }
      return data;
    } catch (err) {
      throw err;
    }
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

  /**
   * Get notices for a skill
   */
  static async getNotices(skillId) {
    const { data, error } = await getClient()
      .from('skill_notices')
      .select(`
        *,
        author:users(id, name, avatar_url)
      `)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('relation "skill_notices" does not exist')) return [];
      throw new Error(`Failed to fetch notices: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Add a notice to a skill
   */
  static async addNotice(skillId, authorId, content, type = 'info') {
    const { data, error } = await getClient()
      .from('skill_notices')
      .insert([{
        skill_id: skillId,
        author_id: authorId,
        content,
        type
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to add notice: ${error.message}`);
    return data;
  }
}

export default SkillModel;
