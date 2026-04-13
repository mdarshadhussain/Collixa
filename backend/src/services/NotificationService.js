import NotificationModel from '../models/Notification.js';

export class NotificationService {
  /**
   * Send a notification
   */
  static async send(userId, type, title, content, link = null) {
    return await NotificationModel.create({
      user_id: userId,
      type,
      title,
      content,
      link,
      is_read: false
    });
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId) {
    return await NotificationModel.getByUser(userId);
  }

  /**
   * Mark notification as read or delete if it should disappear
   */
  static async handleRead(notificationId, shouldDelete = false) {
    if (shouldDelete) {
      return await NotificationModel.delete(notificationId);
    }
    return await NotificationModel.markAsRead(notificationId);
  }

  /**
   * Mark all as read
   */
  static async markAllRead(userId) {
    return await NotificationModel.markAllAsRead(userId);
  }

  /**
   * Clear message notifications for a specific conversation
   */
  static async clearMessageNotifications(userId, conversationId) {
    const linkFragment = `id=${conversationId}`;
    return await NotificationModel.deleteByLinkFragment(userId, linkFragment);
  }

  // --- Convenience Methods ---

  static async notifySkillRequest(providerId, requesterName, skillName) {
    return await this.send(
      providerId,
      'SKILL_REQUEST',
      'New Tribal Request',
      `${requesterName} wants to exchange skills for ${skillName}.`,
      '/dashboard?tab=requests'
    );
  }

  static async notifyRequestResponse(requesterId, providerName, skillName, accepted) {
    return await this.send(
      requesterId,
      accepted ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
      accepted ? 'Request Accepted! 🏹' : 'Request Registry',
      `${providerName} has ${accepted ? 'accepted' : 'declined'} your request for ${skillName}.`,
      accepted ? '/skills' : null
    );
  }

  static async notifySessionScheduled(requesterId, providerName, skillName, scheduledTime) {
    const formatted = new Date(scheduledTime).toLocaleString();
    return await this.send(
      requesterId,
      'REQUEST_ACCEPTED',
      'Session Scheduled',
      `${providerName} scheduled your ${skillName} session for ${formatted}.`,
      '/skills'
    );
  }

  static async notifyNewMessage(recipientId, senderName, conversationId) {
    return await this.send(
      recipientId,
      'NEW_MESSAGE',
      'New Message',
      `${senderName} sent you a message.`,
      `/chat?id=${conversationId}`
    );
  }
}

export default NotificationService;
