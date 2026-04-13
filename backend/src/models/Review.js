import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class ReviewModel {
  static async create(reviewData) {
    const { data, error } = await getClient()
      .from('session_reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create review: ${error.message}`);
    return data;
  }

  static async findBySessionAndReviewer(sessionId, reviewerId) {
    const { data, error } = await getClient()
      .from('session_reviews')
      .select('*')
      .eq('session_id', sessionId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch review: ${error.message}`);
    return data || null;
  }

  static async getByReviewee(revieweeId) {
    const { data, error } = await getClient()
      .from('session_reviews')
      .select(`
        *,
        reviewer:users!session_reviews_reviewer_id_fkey(id, name, avatar_url),
        session:sessions(
          id, 
          exchange:skill_exchanges(
            id,
            skill:skills(name, category)
          )
        )
      `)
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);
    return data || [];
  }
}

export default ReviewModel;
