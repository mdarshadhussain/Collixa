import { supabase, supabaseAdmin } from '../config/database.js';
import NotificationService from './NotificationService.js';

const getClient = () => supabaseAdmin || supabase;

export class ChatService {
  /**
   * Send a message and notify recipient
   */
  static async sendMessage(conversationId, senderId, content, type = 'text', metadata = null) {
    // 1. Insert message
    const { data: message, error } = await getClient()
      .from('messages')
      .insert([{ 
        conversation_id: conversationId, 
        sender_id: senderId, 
        content,
        type,
        metadata,
        is_read: false 
      }])
      .select('*, sender:users(id, name, avatar_url)')
      .single();

    if (error) throw error;

    // 2. Update conversation's last message and timestamp
    await getClient()
      .from('conversations')
      .update({ 
        last_message: type === 'location' ? '📍 Shared a location' : content, 
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
   * Update participant role
   */
  static async updateParticipantRole(conversationId, userId, role, actorId) {
    // 1. Check if actor is an ADMIN
    const { data: actor, error: actorError } = await getClient()
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', actorId)
      .single();

    if (actorError || actor?.role !== 'ADMIN') {
      const error = new Error('Only admins can update roles');
      error.statusCode = 403;
      throw error;
    }

    // 2. Update role
    const { error } = await getClient()
      .from('conversation_participants')
      .update({ role })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * Remove participant from conversation
   */
  static async removeParticipant(conversationId, userId, actorId) {
    // 1. Check if actor is an ADMIN or removing themselves
    if (userId !== actorId) {
      const { data: actor, error: actorError } = await getClient()
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', actorId)
        .single();

      if (actorError || actor?.role !== 'ADMIN') {
        const error = new Error('Only admins can remove participants');
        error.statusCode = 403;
        throw error;
      }
    }

    // 2. Remove participant
    const { error } = await getClient()
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    // 3. Add system message
    try {
      const { data: user } = await getClient().from('users').select('name').eq('id', userId).single();
      await this.sendMessage(conversationId, actorId, `[SYSTEM]: ${user?.name || 'User'} has left the conversation`, 'system');
    } catch (err) {
      console.error('Failed to send system message on departure:', err);
    }

    return true;
  }

  /**
   * Get unread messages count for a user
   */
  static async getUnreadCount(userId) {
    // First fetch participant conversation ids, then use a plain array in .in()
    const { data: memberships, error: membershipError } = await getClient()
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (membershipError) throw membershipError;

    const conversationIds = (memberships || []).map((m) => m.conversation_id);
    if (conversationIds.length === 0) return 0;

    const { count, error } = await getClient()
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false)
      .in('conversation_id', conversationIds);

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

  /**
   * Clear chat history for a specific user (personal view reset)
   */
  static async clearHistory(conversationId, userId) {
    const { error } = await getClient()
      .from('conversation_participants')
      .update({ history_cleared_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
}

export default ChatService;
