import NotificationService from '../services/NotificationService.js';

export class NotificationController {
  /**
   * Get all notifications for current user
   */
  static async getMyNotifications(req, res, next) {
    try {
      const notifications = await NotificationService.getUserNotifications(req.user.id);
      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read or delete (based on 'disappear' requirement)
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      // The user wants notifications to disappear, so we delete on read
      await NotificationService.handleRead(id, true);
      res.status(200).json({
        success: true,
        message: 'Notification removed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all as read (delete all)
   */
  static async markAllRead(req, res, next) {
    try {
      await NotificationService.markAllRead(req.user.id);
      res.status(200).json({
        success: true,
        message: 'All notifications cleared'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
