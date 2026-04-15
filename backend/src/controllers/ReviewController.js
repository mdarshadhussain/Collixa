import ReviewService from '../services/ReviewService.js';
import { AchievementService } from '../services/AchievementService.js';

export class ReviewController {
  static async create(req, res, next) {
    try {
      const review = await ReviewService.createReview(req.user.id, req.body);

      // Check for achievements (don't block response)
      AchievementService.checkAndAwardAchievements(req.user.id).catch(console.error);

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  static async getUserReviews(req, res, next) {
    try {
      const reviews = await ReviewService.getReviewsForUser(req.params.userId);
      res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
