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

  static async notifySkillRequest(providerId, requesterName, skillName, skillId) {
    return await this.send(
      providerId,
      'SKILL_REQUEST',
      'Tribe Admission Request',
      `${requesterName} wants to join your "${skillName}" Tribe.`,
      skillId ? `/skills/${skillId}` : '/skills?tab=academy'
    );
  }

  static async notifyRequestResponse(requesterId, providerName, skillName, accepted) {
    const isChat = skillName === 'direct chat';
    return await this.send(
      requesterId,
      accepted ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
      accepted ? (isChat ? 'Chat Request Accepted' : 'Admitted to Tribe! 🏹') : 'Request Update',
      `${providerName} has ${accepted ? 'accepted' : 'declined'} your request for ${isChat ? 'a direct chat' : `"${skillName}"`}.`,
      accepted ? (isChat ? '/chat' : '/skills?tab=enrollments') : null
    );
  }

  static async notifySessionScheduled(requesterId, providerName, skillName, scheduledTime) {
    const formatted = new Date(scheduledTime).toLocaleString();
    return await this.send(
      requesterId,
      'REQUEST_ACCEPTED',
      'Class Session Scheduled',
      `${providerName} scheduled your "${skillName}" session for ${formatted}.`,
      '/skills?tab=enrollments'
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

  static async notifySessionMarkedDone(recipientId, senderName, skillName, sessionId, isBothDone) {
    return await this.send(
      recipientId,
      'SESSION_UPDATE',
      isBothDone ? 'Session Finalized! 🎉' : 'Session Completion Request',
      isBothDone 
        ? `${senderName} also marked the "${skillName}" session as done. You can now leave feedback!` 
        : `${senderName} marked your "${skillName}" session as done. Please confirm to finalize.`,
      `/skills?session_id=${sessionId}`
    );
  }

  static async notifyFeedbackReceived(recipientId, senderName, skillName) {
    return await this.send(
      recipientId,
      'FEEDBACK_RECEIVED',
      'New Feedback Received',
      `${senderName} left feedback for the "${skillName}" session.`,
      '/profile'
    );
  }
}

export default NotificationService;
