import ChatService from '../services/ChatService.js';

export class ChatController {
  /**
   * Send a new message
   */
  static async sendMessage(req, res, next) {
    try {
      const { conversationId, content } = req.body;
      const message = await ChatService.sendMessage(conversationId, req.user.id, content);
      res.status(200).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total unread messages count for current user
   */
  static async getUnreadCount(req, res, next) {
    try {
      const count = await ChatService.getUnreadCount(req.user.id);
      res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark messages in a specific conversation as read
   */
  static async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;
      await ChatService.markAsRead(conversationId, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;
