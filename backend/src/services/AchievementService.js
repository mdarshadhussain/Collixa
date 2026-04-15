import { supabase, supabaseAdmin } from '../config/database.js';
import NotificationService from './NotificationService.js';
import CreditService from './CreditService.js';

const getClient = () => supabaseAdmin || supabase;

// Achievement definitions with requirements and rewards
export const ACHIEVEMENTS = {
  // Intent-related achievements
  FIRST_INTENT: {
    id: 'first_intent',
    name: 'First Steps',
    description: 'Created your first intent',
    icon: 'first_intent.png',
    requirement: 1,
    reward: 5,
    category: 'intents'
  },
  INTENT_ENTHUSIAST_5: {
    id: 'intent_enthusiast_5',
    name: 'Intent Enthusiast',
    description: 'Created 5 intents',
    icon: 'intent_enthusiast_5.png',
    requirement: 5,
    reward: 10,
    category: 'intents'
  },
  INTENT_MASTER_10: {
    id: 'intent_master_10',
    name: 'Intent Master',
    description: 'Created 10 intents',
    icon: 'intent_master_10.png',
    requirement: 10,
    reward: 25,
    category: 'intents'
  },
  INTENT_LEGEND_25: {
    id: 'intent_legend_25',
    name: 'Intent Legend',
    description: 'Created 25 intents',
    icon: 'intent_legend_25.png',
    requirement: 25,
    reward: 50,
    category: 'intents'
  },

  // Session-related achievements
  FIRST_SESSION: {
    id: 'first_session',
    name: 'Collaboration Starter',
    description: 'Completed your first session',
    icon: 'first_session.png',
    requirement: 1,
    reward: 10,
    category: 'sessions'
  },
  SESSION_SEEKER_5: {
    id: 'session_seeker_5',
    name: 'Session Seeker',
    description: 'Completed 5 sessions',
    icon: 'session_seeker_5.png',
    requirement: 5,
    reward: 25,
    category: 'sessions'
  },
  SESSION_MASTER_15: {
    id: 'session_master_15',
    name: 'Session Master',
    description: 'Completed 15 sessions',
    icon: 'session_master_15.png',
    requirement: 15,
    reward: 50,
    category: 'sessions'
  },

  // Skill/Tribe related achievements
  FIRST_SKILL: {
    id: 'first_skill',
    name: 'Skill Sharer',
    description: 'Added your first skill to a tribe',
    icon: 'first_skill.png',
    requirement: 1,
    reward: 5,
    category: 'skills'
  },
  SKILL_COLLECTOR_3: {
    id: 'skill_collector_3',
    name: 'Skill Collector',
    description: 'Added 3 skills to tribes',
    icon: 'skill_collector_3.png',
    requirement: 3,
    reward: 15,
    category: 'skills'
  },

  // Social achievements
  FIRST_REVIEW: {
    id: 'first_review',
    name: 'Feedback Giver',
    description: 'Left your first review',
    icon: 'first_review.png',
    requirement: 1,
    reward: 5,
    category: 'social'
  },
  REVIEWER_5: {
    id: 'reviewer_5',
    name: 'Community Voice',
    description: 'Left 5 reviews',
    icon: 'reviewer_5.png',
    requirement: 5,
    reward: 15,
    category: 'social'
  },

  // Credit achievements
  FIRST_SHARE: {
    id: 'first_share',
    name: 'Credit Sharer',
    description: 'Shared credits for the first time',
    icon: 'first_share.png',
    requirement: 1,
    reward: 10,
    category: 'credits'
  },
  CREDIT_HOLDER_100: {
    id: 'credit_holder_100',
    name: 'Credit Saver',
    description: 'Accumulated 100 credits',
    icon: 'credit_holder_100.png',
    requirement: 100,
    reward: 20,
    category: 'credits'
  }
};

export class AchievementService {
  /**
   * Get all achievements for a user
   */
  static async getUserAchievements(userId) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        // Handle missing table gracefully
        if (error.code === 'PGRST205' || error.message?.includes('cache')) {
          console.warn(`[AchievementService] user_achievements table missing for user ${userId}`);
          return [];
        }
        console.error(`[AchievementService] getUserAchievements error:`, error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error(`[AchievementService] getUserAchievements exception:`, err);
      return [];
    }
  }

  /**
   * Get achievement progress for a user
   */
  static async getUserStats(userId) {
    const client = getClient();

    // Helper to safely execute a Supabase query and return count or 0
    const safeCount = async (query) => {
      try {
        const { count, error } = await query;
        if (error) {
          console.error(`[AchievementService] Query error:`, error);
          return 0;
        }
        return count || 0;
      } catch (err) {
        console.error(`[AchievementService] Exception:`, err);
        return 0;
      }
    };

    // Get counts from various tables
    const [
      intentCount,
      sessionCount,
      skillCount,
      reviewCount,
      shareCount,
      userRes
    ] = await Promise.all([
      safeCount(client.from('intents').select('*', { count: 'exact', head: true }).eq('created_by', userId)),
      safeCount(client.from('sessions').select('*', { count: 'exact', head: true }).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).eq('status', 'COMPLETED')),
      safeCount(client.from('skills').select('*', { count: 'exact', head: true }).eq('user_id', userId)),
      safeCount(client.from('session_reviews').select('*', { count: 'exact', head: true }).eq('reviewer_id', userId)),
      safeCount(client.from('credit_transfers').select('*', { count: 'exact', head: true }).eq('sender_id', userId)),
      (async () => {
        try {
          const { data, error } = await client.from('users').select('credits').eq('id', userId).single();
          if (error) return { data: { credits: 0 } };
          return { data };
        } catch (e) {
          return { data: { credits: 0 } };
        }
      })()
    ]);

    return {
      intents: intentCount,
      sessions: sessionCount,
      skills: skillCount,
      reviews: reviewCount,
      shares: shareCount,
      credits: userRes.data?.credits || 0
    };
  }

  /**
   * Check and award achievements based on user stats
   */
  static async checkAndAwardAchievements(userId) {
    const stats = await this.getUserStats(userId);
    const existingAchievements = await this.getUserAchievements(userId);
    const existingIds = new Set(existingAchievements.map(a => a.achievement_id));

    const newlyUnlocked = [];

    // Check each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (existingIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      let progress = 0;

      switch (achievement.category) {
        case 'intents':
          progress = stats.intents;
          shouldUnlock = progress >= achievement.requirement;
          break;
        case 'sessions':
          progress = stats.sessions;
          shouldUnlock = progress >= achievement.requirement;
          break;
        case 'skills':
          progress = stats.skills;
          shouldUnlock = progress >= achievement.requirement;
          break;
        case 'social':
          progress = stats.reviews;
          shouldUnlock = progress >= achievement.requirement;
          break;
        case 'credits':
          if (achievement.id === 'first_share') {
            progress = stats.shares;
            shouldUnlock = progress >= achievement.requirement;
          } else if (achievement.id === 'credit_holder_100') {
            progress = stats.credits;
            shouldUnlock = progress >= achievement.requirement;
          }
          break;
      }

      if (shouldUnlock) {
        await this.unlockAchievement(userId, achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Unlock an achievement for a user
   */
  static async unlockAchievement(userId, achievement) {
    const client = getClient();

    // Record the achievement
    const { error } = await client
      .from('user_achievements')
      .insert([{
        user_id: userId,
        achievement_id: achievement.id,
        achievement_name: achievement.name,
        achievement_description: achievement.description,
        achievement_icon: achievement.icon,
        reward: achievement.reward,
        unlocked_at: new Date().toISOString()
      }]);

    if (error) throw error;

    // Award credits
    if (achievement.reward > 0) {
      await CreditService.addCredits(userId, achievement.reward, 'ACHIEVEMENT');
    }

    // Send notification
    await NotificationService.send(
      userId,
      'ACHIEVEMENT_UNLOCKED',
      'Achievement Unlocked!',
      `Congratulations! You've unlocked "${achievement.name}" and earned ${achievement.reward} credits!`,
      '/profile'
    );

    return true;
  }

  /**
   * Get all available achievements with user's progress
   */
  static async getAllAchievementsWithProgress(userId) {
    const stats = await this.getUserStats(userId);
    const unlocked = await this.getUserAchievements(userId);
    const unlockedIds = new Set(unlocked.map(a => a.achievement_id));

    return Object.values(ACHIEVEMENTS).map(achievement => {
      let progress = 0;
      switch (achievement.category) {
        case 'intents':
          progress = stats.intents;
          break;
        case 'sessions':
          progress = stats.sessions;
          break;
        case 'skills':
          progress = stats.skills;
          break;
        case 'social':
          progress = stats.reviews;
          break;
        case 'credits':
          if (achievement.id === 'first_share') {
            progress = stats.shares;
          } else if (achievement.id === 'credit_holder_100') {
            progress = stats.credits;
          }
          break;
      }

      return {
        ...achievement,
        progress,
        isUnlocked: unlockedIds.has(achievement.id),
        unlockedAt: unlocked.find(a => a.achievement_id === achievement.id)?.unlocked_at || null
      };
    });
  }
  /**
   * Get global achievement statistics for admin
   */
  static async getGlobalAchievementStats() {
    try {
      const client = getClient();
      
      // Fetch all achievement IDs from unlocks table
      const { data: allUnlocks, error: unlockError } = await client
        .from('user_achievements')
        .select('achievement_id');

      if (unlockError) {
        if (unlockError.code === 'PGRST205' || unlockError.message?.includes('cache')) {
          console.warn('[AchievementService] user_achievements table missing or cache stale');
          return Object.values(ACHIEVEMENTS).map(a => ({ ...a, totalUnlocks: 0 }));
        }
        throw unlockError;
      }

      const stats = {};
      allUnlocks.forEach(u => {
        stats[u.achievement_id] = (stats[u.achievement_id] || 0) + 1;
      });

      // Combine with achievement definitions for full details
      return Object.values(ACHIEVEMENTS).map(a => ({
        ...a,
        totalUnlocks: stats[a.id] || 0
      }));
    } catch (err) {
      console.error(`[AchievementService] getGlobalAchievementStats error:`, err);
      return Object.values(ACHIEVEMENTS).map(a => ({ ...a, totalUnlocks: 0 }));
    }
  }
}

export default AchievementService;
