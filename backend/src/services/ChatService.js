import { supabase, supabaseAdmin } from '../config/database.js';
import NotificationService from './NotificationService.js';

const getClient = () => supabaseAdmin || supabase;

export class ChatService {
  /**
   * Send a message and notify recipient
   */
  static async sendMessage(conversationId, senderId, content) {
    // 1. Insert message
    const { data: message, error } = await getClient()
      .from('messages')
      .insert([{ 
        conversation_id: conversationId, 
        sender_id: senderId, 
        content,
        is_read: false 
      }])
      .select('*, sender:users(id, name, avatar_url)')
      .single();

    if (error) throw error;

    // 2. Update conversation's last message and timestamp
    await getClient()
      .from('conversations')
      .update({ 
        last_message: content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', conversationId);

    // 3. Trigger notification for recipient
    try {
      // Find other participants in the conversation
      const { data: participants } = await getClient()
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', senderId);

      const recipientIds = participants.map(p => p.user_id);
      
      for (const recipientId of recipientIds) {
        await NotificationService.notifyNewMessage(
            recipientId, 
            message.sender?.name || 'Someone', 
            conversationId
        );
      }
    } catch (err) {
      console.error('Failed to send chat notification:', err);
    }

    return message;
  }

  /**
   * Get unread messages count for a user
   */
  static async getUnreadCount(userId) {
    // We join with conversation_participants to ensure we only count messages in rooms the user belongs to
    // and where the sender is NOT the user.
    const { count, error } = await getClient()
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false)
      .in('conversation_id', (
          getClient()
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId)
      ));

    if (error) throw error;
    return count || 0;
  }

  /**
   * Mark all messages in a conversation as read for a user
   */
  static async markAsRead(conversationId, userId) {
    const { error } = await getClient()
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    
    // Clear message notifications for this conversation
    try {
      await NotificationService.clearMessageNotifications(userId, conversationId);
    } catch (err) {
      console.error('Failed to clear message notifications:', err);
    }

    return true;
  }
}

export default ChatService;
