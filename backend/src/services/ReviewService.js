import ReviewModel from '../models/Review.js';
import SessionModel from '../models/Session.js';
import IntentModel from '../models/Intent.js';
import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class ReviewService {
  static async createReview(userId, payload) {
    const { sessionId, intentId, rating, comment } = payload;

    if (sessionId) {
      const session = await SessionModel.getById(sessionId);

      if (session.status !== 'COMPLETED') {
        throw new Error('Reviews are only allowed after session completion');
      }
      if (String(session.sender_id) !== String(userId) && String(session.receiver_id) !== String(userId)) {
        throw new Error('You are not a participant in this session');
      }

      const existing = await ReviewModel.findBySessionAndReviewer(sessionId, userId);
      if (existing) {
        throw new Error('You already submitted a review for this session');
      }

      const revieweeId = String(session.sender_id) === String(userId) ? session.receiver_id : session.sender_id;

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
       const collaborators = await IntentModel.getCollaborators(intentId);
       const collaboratorIds = collaborators.map(c => String(c.id));

       if (String(ownerId) !== String(userId) && !collaboratorIds.includes(String(userId))) {
         throw new Error('You are not a participant in this intent');
       }

       // Determine revieweeId
       const { revieweeId } = payload;
       let finalRevieweeId = revieweeId;
       
       if (String(ownerId) === String(userId)) {
         // If owner is the reviewer, they MUST specify WHICH collaborator they are reviewing
         if (!finalRevieweeId) {
           // Fallback for old 1:1 projects if any
           if (collaboratorIds.length === 1) {
             finalRevieweeId = collaboratorIds[0];
           } else {
             throw new Error('Please specify which collaborator you are reviewing.');
           }
         }
         
         if (!collaboratorIds.includes(String(finalRevieweeId))) {
           throw new Error('The selected user is not an accepted collaborator on this project.');
         }
       } else {
         // If collaborator is the reviewer, they are reviewing the owner
         finalRevieweeId = ownerId;
       }

       // Check if already reviewed THIS PERSON for THIS PROJECT
       const { data: existing, error: checkError } = await getClient()
         .from('session_reviews')
         .select('*')
         .eq('intent_id', intentId)
         .eq('reviewer_id', userId)
         .eq('reviewee_id', finalRevieweeId)
         .maybeSingle();
       
       if (checkError) throw new Error(`Review verification failed: ${checkError.message}`);
       
       if (existing) {
         throw new Error('You have already submitted a review for this participant.');
       }

       return await ReviewModel.create({
         intent_id: intentId,
         reviewer_id: userId,
         reviewee_id: finalRevieweeId,
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
