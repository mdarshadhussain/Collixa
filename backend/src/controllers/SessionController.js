import SessionService from '../services/SessionService.js';
import { AchievementService } from '../services/AchievementService.js';

export class SessionController {
  static async schedule(req, res, next) {
    try {
      const session = await SessionService.scheduleSession(req.user.id, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  static async getMySessions(req, res, next) {
    try {
      const sessions = await SessionService.getUserSessions(req.user.id);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  static async complete(req, res, next) {
    try {
      const session = await SessionService.completeSession(req.user.id, req.params.id);

      // Check for achievements for both participants (don't block response)
      AchievementService.checkAndAwardAchievements(req.user.id).catch(console.error);
      if (session.requester_id !== req.user.id) {
        AchievementService.checkAndAwardAchievements(session.requester_id).catch(console.error);
      }
      if (session.provider_id !== req.user.id) {
        AchievementService.checkAndAwardAchievements(session.provider_id).catch(console.error);
      }

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
}

export default SessionController;
