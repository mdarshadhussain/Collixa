import AchievementService from '../services/AchievementService.js';

export class AchievementController {
  /**
   * Get user's achievements
   */
  static async getMyAchievements(req, res, next) {
    try {
      const userId = req.user.id;
      const achievements = await AchievementService.getUserAchievements(userId);

      res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all achievements with progress for current user
   */
  static async getAllAchievements(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Auto-award any missing achievements before fetching list
      await AchievementService.checkAndAwardAchievements(userId).catch(err => console.error('Auto-award failed:', err));
      
      const achievements = await AchievementService.getAllAchievementsWithProgress(userId);
      
      res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check and award achievements (manual trigger)
   */
  static async checkAchievements(req, res, next) {
    try {
      const userId = req.user.id;
      const newlyUnlocked = await AchievementService.checkAndAwardAchievements(userId);

      res.status(200).json({
        success: true,
        data: {
          newlyUnlocked,
          count: newlyUnlocked.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user stats for achievements
   */
  static async getUserStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await AchievementService.getUserStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AchievementController;
