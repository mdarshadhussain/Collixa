import ReviewModel from '../models/Review.js';
import SessionModel from '../models/Session.js';
import IntentModel from '../models/Intent.js';
import { supabase } from '../config/database.js';

export class ReviewService {
  static async createReview(userId, payload) {
    const { sessionId, intentId, rating, comment } = payload;

    if (sessionId) {
      const session = await SessionModel.getById(sessionId);

      if (session.status !== 'COMPLETED') {
        throw new Error('Reviews are only allowed after session completion');
      }
      if (session.sender_id !== userId && session.receiver_id !== userId) {
        throw new Error('You are not a participant in this session');
      }

      const existing = await ReviewModel.findBySessionAndReviewer(sessionId, userId);
      if (existing) {
        throw new Error('You already submitted a review for this session');
      }

      const revieweeId = session.sender_id === userId ? session.receiver_id : session.sender_id;

      return await ReviewModel.create({
        session_id: sessionId,
        reviewer_id: userId,
        reviewee_id: revieweeId,
        rating,
        comment: comment || null,
      });
    } else if (intentId) {
       const intent = await IntentModel.getById(intentId);
       
       if (!intent) throw new Error('Intent not found');
       if (intent.status !== 'completed') {
         throw new Error('Reviews are only allowed after intent completion');
       }
       
       const ownerId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by;
       const collaboratorId = intent.collaborator_id;

       if (ownerId !== userId && collaboratorId !== userId) {
         throw new Error('You are not a participant in this intent');
       }

       // Check if already reviewed (we'll use a direct query for now)
       const { data: existing } = await supabase
         .from('session_reviews')
         .select('*')
         .eq('intent_id', intentId)
         .eq('reviewer_id', userId)
         .maybeSingle();
       
       if (existing) {
         throw new Error('You already submitted a review for this project');
       }

       const revieweeId = ownerId === userId ? collaboratorId : ownerId;

       return await ReviewModel.create({
         intent_id: intentId,
         reviewer_id: userId,
         reviewee_id: revieweeId,
         rating,
         comment: comment || null,
       });
    } else {
      throw new Error('Session ID or Intent ID is required');
    }
  }

  static async getReviewsForUser(userId) {
    return await ReviewModel.getByReviewee(userId);
  }
}

export default ReviewService;
