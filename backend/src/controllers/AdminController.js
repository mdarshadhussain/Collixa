import { supabase, supabaseAdmin } from '../config/database.js';
import { NotificationService } from '../services/NotificationService.js';

const getClient = () => supabaseAdmin || supabase;

// Admin emails configuration
const ADMIN_EMAILS = ['admin@collixa.space'];

/**
 * Check if email is admin
 */
const isAdminEmail = (email) => ADMIN_EMAILS.includes(email);

export class AdminController {
  /**
   * Get admin dashboard stats
   */
  static async getStats(req, res, next) {
    try {
      const client = getClient();

      // Get total users count
      const { count: totalUsers, error: usersError } = await client
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total intents count
      const { count: totalIntents, error: intentsError } = await client
        .from('intents')
        .select('*', { count: 'exact', head: true });

      // Get total skills/tribes count
      const { count: totalTribes, error: tribesError } = await client
        .from('skills')
        .select('*', { count: 'exact', head: true });

      // Get total sessions count (scheduled sessions)
      const { count: totalSessions, error: sessionsError } = await client
        .from('skill_sessions')
        .select('*', { count: 'exact', head: true });

      // Get total credits in system
      const { data: creditsData, error: creditsError } = await client
        .from('users')
        .select('credits');

      const totalCredits = creditsData?.reduce((sum, user) => sum + (user.credits || 0), 0) || 0;

      // Get new users today
      const today = new Date().toISOString().split('T')[0];
      const { count: newUsersToday, error: newUsersError } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      if (usersError || intentsError || tribesError || sessionsError || creditsError) {
        throw new Error('Failed to fetch stats');
      }

      return res.status(200).json({
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          totalIntents: totalIntents || 0,
          totalTribes: totalTribes || 0,
          totalSessions: totalSessions || 0,
          totalCredits: totalCredits,
          newUsersToday: newUsersToday || 0,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req, res, next) {
    try {
      const client = getClient();

      const { data: users, error } = await client
        .from('users')
        .select('id, email, name, avatar_url, credits, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: users || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      // Use supabaseAdmin to bypass RLS policies
      const adminClient = supabaseAdmin || getClient();

      // Check if trying to delete an admin
      const { data: userToDelete, error: fetchError } = await adminClient
        .from('users')
        .select('email')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (isAdminEmail(userToDelete.email)) {
        return res.status(403).json({
          error: 'Cannot delete admin users'
        });
      }

      // Delete user from database
      const { error } = await adminClient
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Also delete from Supabase Auth if admin client available
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(id);
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ban a user
   */
  static async banUser(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { error } = await client
        .from('users')
        .update({ role: 'BANNED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'User banned successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unban a user
   */
  static async unbanUser(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { error } = await client
        .from('users')
        .update({ role: 'VERIFIED_USER', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'User unbanned successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all intents
   */
  static async getAllIntents(req, res, next) {
    try {
      const client = getClient();

      const { data: intents, error } = await client
        .from('intents')
        .select(`
          *,
          created_by:users(id, name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: intents || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get intent by ID
   */
  static async getIntentById(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { data: intent, error } = await client
        .from('intents')
        .select(`
          *,
          created_by:users(id, name, email, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: intent
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an intent
   */
  static async updateIntent(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, category, location, status } = req.body;
      const client = getClient();

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (location !== undefined) updates.location = location;
      if (status !== undefined) updates.status = status;
      updates.updated_at = new Date().toISOString();

      const { data: intent, error } = await client
        .from('intents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Intent updated successfully',
        data: intent
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an intent
   */
  static async deleteIntent(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { error } = await client
        .from('intents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Intent deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tribes/skills
   */
  static async getAllTribes(req, res, next) {
    try {
      const client = getClient();

      const { data: tribes, error } = await client
        .from('skills')
        .select(`
          *,
          user:users(id, name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: tribes || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a tribe/skill
   */
  static async deleteTribe(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { error } = await client
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Tribe deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a tribe/skill
   */
  static async updateTribe(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, category, hourly_rate } = req.body;
      const client = getClient();

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;

      const { data, error } = await client
        .from('skills')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Tribe updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all sessions
   */
  static async getAllSessions(req, res, next) {
    try {
      const client = getClient();

      const { data: sessions, error } = await client
        .from('skill_sessions')
        .select(`
          *,
          skill:skills(id, name),
          learner:users!skill_sessions_learner_id_fkey(id, name, email),
          teacher:users!skill_sessions_teacher_id_fkey(id, name, email)
        `)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: sessions || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark session as completed
   */
  static async completeSession(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { error } = await client
        .from('skill_sessions')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Session marked as completed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a session
   */
  static async cancelSession(req, res, next) {
    try {
      const { id } = req.params;
      const client = getClient();

      const { error } = await client
        .from('skill_sessions')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Session cancelled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get credit transactions
   */
  static async getCreditTransactions(req, res, next) {
    try {
      const client = getClient();

      const { data: transactions, error } = await client
        .from('credit_transactions')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: transactions || []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add credits to user
   */
  static async addCredits(req, res, next) {
    try {
      const { userId, amount, reason } = req.body;
      const client = getClient();

      // Get current credits
      const { data: user, error: fetchError } = await client
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newCredits = (user.credits || 0) + amount;

      // Update user credits
      const { error: updateError } = await client
        .from('users')
        .update({ credits: newCredits })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record transaction
      await client
        .from('credit_transactions')
        .insert([{
          user_id: userId,
          amount: amount,
          type: 'ADMIN_ADD',
          description: reason || 'Admin credit addition'
        }]);

      // Send notification to user
      await NotificationService.send(
        userId,
        'CREDIT_ADDED',
        'Credits Added',
        `Admin has added ${amount} credits to your account. Reason: ${reason || 'Bonus'}`,
        '/profile'
      );

      return res.status(200).json({
        success: true,
        message: `${amount} credits added successfully`,
        data: { newBalance: newCredits }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deduct credits from user
   */
  static async deductCredits(req, res, next) {
    try {
      const { userId, amount, reason } = req.body;
      const client = getClient();

      // Get current credits
      const { data: user, error: fetchError } = await client
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newCredits = Math.max(0, (user.credits || 0) - amount);

      // Update user credits
      const { error: updateError } = await client
        .from('users')
        .update({ credits: newCredits })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record transaction
      await client
        .from('credit_transactions')
        .insert([{
          user_id: userId,
          amount: -amount,
          type: 'ADMIN_DEDUCT',
          description: reason || 'Admin credit deduction'
        }]);

      // Send notification to user
      await NotificationService.send(
        userId,
        'CREDIT_DEDUCTED',
        'Credits Deducted',
        `Admin has deducted ${amount} credits from your account. Reason: ${reason || 'Admin adjustment'}`,
        '/profile'
      );

      return res.status(200).json({
        success: true,
        message: `${amount} credits deducted successfully`,
        data: { newBalance: newCredits }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reports (placeholder - can be extended with actual reporting)
   */
  static async getReports(req, res, next) {
    try {
      // This can be extended to include flagged content, reports from users, etc.
      return res.status(200).json({
        success: true,
        data: {
          message: 'Reports feature - extend as needed',
          flaggedIntents: [],
          flaggedUsers: [],
          recentReports: []
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
