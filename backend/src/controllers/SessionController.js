import SessionService from '../services/SessionService.js';

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
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
}

export default SessionController;
