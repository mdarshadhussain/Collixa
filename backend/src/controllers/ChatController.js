import ChatService from '../services/ChatService.js';

export class ChatController {
  /**
   * Send a new message
   */
  static async sendMessage(req, res, next) {
    try {
      const { conversationId, content, type, metadata } = req.body;
      const message = await ChatService.sendMessage(conversationId, req.user.id, content, type, metadata);
      res.status(200).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update participant role (Admin only)
   */
  static async updateParticipantRole(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { userId, role } = req.body;
      await ChatService.updateParticipantRole(conversationId, userId, role, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Participant role updated'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove participant (Admin only or self-removal)
   */
  static async removeParticipant(req, res, next) {
    try {
      const { conversationId, userId } = req.params;
      await ChatService.removeParticipant(conversationId, userId, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Participant removed successfully'
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

  /**
   * Clear chat history for the current user
   */
  static async clearChat(req, res, next) {
    try {
      const { conversationId } = req.params;
      await ChatService.clearHistory(conversationId, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Chat history cleared for your view'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invite user by email
   */
  static async inviteUser(req, res, next) {
    try {
      const { email } = req.body;
      const result = await ChatService.createDirectRequest(req.user.id, email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept invitation
   */
  static async acceptInvite(req, res, next) {
    try {
      const { senderId } = req.body;
      const conversation = await ChatService.acceptDirectRequest(senderId, req.user.id);
      res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get or create a direct conversation
   */
  static async getOrCreateDirectConversation(req, res, next) {
    try {
      const { userId } = req.body;
      const conversation = await ChatService.getOrCreateDirectConversation(req.user.id, userId);
      res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;
