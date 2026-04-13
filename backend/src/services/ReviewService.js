import ReviewModel from '../models/Review.js';
import SessionModel from '../models/Session.js';

export class ReviewService {
  static async createReview(userId, payload) {
    const { sessionId, rating, comment } = payload;
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
  }
}

export default ReviewService;
