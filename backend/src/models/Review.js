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
}

export default ReviewModel;
