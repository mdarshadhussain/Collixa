import ReviewService from '../services/ReviewService.js';

export class ReviewController {
  static async create(req, res, next) {
    try {
      const review = await ReviewService.createReview(req.user.id, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
