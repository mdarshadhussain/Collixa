import { supabase, supabaseAdmin } from '../config/database.js';
import NotificationService from './NotificationService.js';

const getClient = () => supabaseAdmin || supabase;

/**
 * Force refresh Supabase schema cache (PostgREST)
 */
const refreshSchema = async () => {
  try {
    await getClient().rpc('notify_pgrst_schema_reload');
  } catch (err) {
    // RPC might not exist, ignore
  }
};

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

    // 2. Check if this is a DIRECT chat and if we should delete the whole record
    const { data: conversation } = await getClient()
      .from('conversations')
      .select('type')
      .eq('id', conversationId)
      .single();

    if (conversation?.type === 'DIRECT') {
      // 2a. Delete all messages first
      await getClient()
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // 2b. Delete all participants
      await getClient()
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);

      // 2c. Delete the conversation record
      const { error: deleteError } = await getClient()
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (deleteError) {
        console.error('Delete error for DIRECT chat:', deleteError);
        throw deleteError;
      }
    } else {
      // For GROUP chats, just remove the participant
      const { error } = await getClient()
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      if (error) throw error;

      // 3. Add system message (GROUP only)
      try {
        const { data: user } = await getClient().from('users').select('name').eq('id', userId).single();
        await this.sendMessage(conversationId, actorId, `[SYSTEM]: ${user?.name || 'User'} has left the conversation`, 'system');
      } catch (err) {
        console.error('Failed to send system message on departure:', err);
      }
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

  /**
   * Send a direct collaboration request to a user by email
   */
  static async createDirectRequest(senderId, recipientEmail) {
    // 1. Look up user by email
    const { data: recipient, error: userError } = await getClient()
      .from('users')
      .select('id, name')
      .eq('email', recipientEmail)
      .single();

    if (userError || !recipient) {
      throw new Error('User not found with this email address');
    }

    if (recipient.id === senderId) {
      throw new Error('You cannot invite yourself');
    }

    // 2. Check if an ACCEPTED conversation already exists
    const { data: existing } = await getClient()
      .from('conversations')
      .select('id')
      .eq('type', 'DIRECT')
      .eq('status', 'ACCEPTED')
      .or(`and(participant_1.eq.${senderId},participant_2.eq.${recipient.id}),and(participant_1.eq.${recipient.id},participant_2.eq.${senderId})`)
      .maybeSingle();

    if (existing) {
      // Check if they are actually participants
      const { data: pCount } = await getClient()
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', existing.id)
        .in('user_id', [senderId, recipient.id]);

      if (pCount && pCount.length === 2) {
        throw new Error('Chat already exists with this person');
      } else {
        // Zombie conversation detected (record exists but users are not participants)
        // Clean it up so we can start fresh
        await this.removeParticipant(existing.id, senderId, senderId);
      }
    }

    // 3. (REMOVED) - We no longer send a separate notification. 
    // The Action Center handles the request itself.

    // 4. Create a PENDING conversation so it shows in the Action Center
    const { data: conversation, error: insertError } = await getClient()
      .from('conversations')
      .insert([{
        type: 'DIRECT',
        participant_1: senderId,
        participant_2: recipient.id,
        status: 'PENDING',
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create pending conversation record:', insertError);
    } else {
      // 5. CRITICAL: Add participants so they can actually SEE the conversation in their lists
      await getClient().from('conversation_participants').insert([
        { conversation_id: conversation.id, user_id: senderId, role: 'MEMBER' },
        { conversation_id: conversation.id, user_id: recipient.id, role: 'MEMBER' }
      ]);

      // 6. Send a kickoff system message
      await this.sendMessage(
        conversation.id,
        senderId,
        `Collaboration request initiated.`,
        'system'
      );
    }

    return { success: true, message: 'Invitation sent' };
  }

  /**
   * Accept a direct chat invitation
   */
  static async acceptDirectRequest(conversationId, recipientId) {
    const { data: conversation, error: updateError } = await getClient()
      .from('conversations')
      .update({
        status: 'ACCEPTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError || !conversation) throw updateError || new Error('Conversation not found');

    const senderId = conversation.participant_1 === recipientId ? conversation.participant_2 : conversation.participant_1;

    // Send system message
    const { data: sender } = await getClient().from('users').select('name').eq('id', senderId).single();
    const { data: recipient } = await getClient().from('users').select('name').eq('id', recipientId).single();

    await this.sendMessage(
      conversation.id,
      senderId,
      `[SYSTEM]: Collaboration started between ${sender?.name} and ${recipient?.name}.`,
      'system'
    );

    // Notify requester
    try {
      await NotificationService.notifyRequestResponse(senderId, recipient?.name || 'A user', 'direct chat', true);
    } catch (e) { console.error('Failed to notify requester:', e); }

    return conversation;
  }

  /**
   * Reject a direct chat invitation
   */
  static async rejectDirectRequest(conversationId, recipientId) {
    const { data: conversation, error: updateError } = await getClient()
      .from('conversations')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError || !conversation) throw updateError || new Error('Conversation not found');

    const senderId = conversation.participant_1 === recipientId ? conversation.participant_2 : conversation.participant_1;
    const { data: recipient } = await getClient().from('users').select('name').eq('id', recipientId).single();

    // Notify requester
    try {
      await NotificationService.notifyRequestResponse(senderId, recipient?.name || 'A user', 'direct chat', false);
    } catch (e) { console.error('Failed to notify requester:', e); }

    return true;
  }

  /**
   * Get or create a direct conversation
   */
  static async getOrCreateDirectConversation(userId1, userId2) {
    // 1. Check if an ACCEPTED conversation already exists
    const { data: existing, error: findError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('type', 'DIRECT')
      .eq('status', 'ACCEPTED')
      .or(`and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`)
      .maybeSingle();

    if (findError?.message?.includes('schema cache')) {
      await refreshSchema();
      return this.getOrCreateDirectConversation(userId1, userId2);
    }

    if (existing) {
      // Check if both are actually participants
      const { data: pCount } = await supabaseAdmin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', existing.id)
        .in('user_id', [userId1, userId2]);

      if (pCount && pCount.length === 2) {
        return existing;
      } else {
        // Clean up zombie record
        await this.removeParticipant(existing.id, userId1, userId1);
      }
    }

    // 2. If not exists, check if a PENDING one exists and promote it
    const { data: pending } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('type', 'DIRECT')
      .eq('status', 'PENDING')
      .or(`and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`)
      .maybeSingle();

    if (pending) {
       const { data: promoted, error: updateError } = await supabaseAdmin
         .from('conversations')
         .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
         .eq('id', pending.id)
         .select()
         .single();
       
       if (updateError?.message?.includes('schema cache')) {
         await refreshSchema();
         return this.getOrCreateDirectConversation(userId1, userId2);
       }
       return promoted;
    }

    // 3. Create fresh accepted conversation
    const { data: conversation, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert([{
        type: 'DIRECT',
        participant_1: userId1,
        participant_2: userId2,
        status: 'ACCEPTED',
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) throw createError;

    // 4. Add participants
    await supabaseAdmin.from('conversation_participants').insert([
      { conversation_id: conversation.id, user_id: userId1, role: 'MEMBER' },
      { conversation_id: conversation.id, user_id: userId2, role: 'MEMBER' }
    ]);

    // 5. Kickoff message
    try {
      await supabaseAdmin.from('messages').insert([{ 
        conversation_id: conversation.id, 
        sender_id: userId1, 
        content: `[SYSTEM]: Chat initialized.`,
        type: 'system',
        is_read: false 
      }]);
    } catch (msgErr) {
      console.warn('Failed to send kickoff message:', msgErr);
    }

    return conversation;
  }
}

export default ChatService;
