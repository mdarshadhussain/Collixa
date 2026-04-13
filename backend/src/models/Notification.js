import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class NotificationModel {
  /**
   * Create a new notification
   */
  static async create(notificationData) {
    const { data, error } = await getClient()
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create notification: ${error.message}`);
    return data;
  }

  /**
   * Get notifications for a user
   */
  static async getByUser(userId) {
    const { data, error } = await getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
    return data || [];
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id) {
    const { data, error } = await getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
    return data;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    const { data, error } = await getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(`Failed to mark all as read: ${error.message}`);
    return data;
  }

  /**
   * Delete a notification (used for "disappearing" behavior)
   */
  static async delete(id) {
    const { error } = await getClient()
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete notification: ${error.message}`);
    return true;
  }

  /**
   * Delete notifications where link contains fragment (e.g., id=123)
   */
  static async deleteByLinkFragment(userId, fragment) {
    const { error } = await getClient()
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .ilike('link', `%${fragment}%`);

    if (error) throw new Error(`Failed to delete notifications by fragment: ${error.message}`);
    return true;
  }
}

export default NotificationModel;
