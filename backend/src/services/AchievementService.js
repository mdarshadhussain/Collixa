import { supabase, supabaseAdmin } from '../config/database.js';
import { NotificationService } from './NotificationService.js';
import CreditService from './CreditService.js';

const getClient = () => supabaseAdmin || supabase;

// Achievement definitions with requirements and rewards
export const ACHIEVEMENTS = {
  // Intent-related achievements
  FIRST_INTENT: {
    id: 'first_intent',
    name: 'First Steps',
    description: 'Created your first intent',
    icon: 'Footprints',
    requirement: 1,
    reward: 5,
    category: 'intents'
  },
  INTENT_ENTHUSIAST_5: {
    id: 'intent_enthusiast_5',
    name: 'Intent Enthusiast',
    description: 'Created 5 intents',
    icon: 'Lightbulb',
    requirement: 5,
    reward: 10,
    category: 'intents'
  },
  INTENT_MASTER_10: {
    id: 'intent_master_10',
    name: 'Intent Master',
    description: 'Created 10 intents',
    icon: 'Crown',
    requirement: 10,
    reward: 25,
    category: 'intents'
  },
  INTENT_LEGEND_25: {
    id: 'intent_legend_25',
    name: 'Intent Legend',
    description: 'Created 25 intents',
    icon: 'Star',
    requirement: 25,
    reward: 50,
    category: 'intents'
  },

  // Session-related achievements
  FIRST_SESSION: {
    id: 'first_session',
    name: 'Collaboration Starter',
    description: 'Completed your first session',
    icon: 'Handshake',
    requirement: 1,
    reward: 10,
    category: 'sessions'
  },
  SESSION_SEEKER_5: {
    id: 'session_seeker_5',
    name: 'Session Seeker',
    description: 'Completed 5 sessions',
    icon: 'Target',
    requirement: 5,
    reward: 25,
    category: 'sessions'
  },
  SESSION_MASTER_15: {
    id: 'session_master_15',
    name: 'Session Master',
    description: 'Completed 15 sessions',
    icon: 'Trophy',
    requirement: 15,
    reward: 50,
    category: 'sessions'
  },

  // Skill/Tribe related achievements
  FIRST_SKILL: {
    id: 'first_skill',
    name: 'Skill Sharer',
    description: 'Added your first skill to a tribe',
    icon: 'Wrench',
    requirement: 1,
    reward: 5,
    category: 'skills'
  },
  SKILL_COLLECTOR_3: {
    id: 'skill_collector_3',
    name: 'Skill Collector',
    description: 'Added 3 skills to tribes',
    icon: 'Toolbox',
    requirement: 3,
    reward: 15,
    category: 'skills'
  },

  // Social achievements
  FIRST_REVIEW: {
    id: 'first_review',
    name: 'Feedback Giver',
    description: 'Left your first review',
    icon: 'MessageSquare',
    requirement: 1,
    reward: 5,
    category: 'social'
  },
  REVIEWER_5: {
    id: 'reviewer_5',
    name: 'Community Voice',
    description: 'Left 5 reviews',
    icon: 'Megaphone',
    requirement: 5,
    reward: 15,
    category: 'social'
  },

  // Credit achievements
  FIRST_SHARE: {
    id: 'first_share',
    name: 'Credit Sharer',
    description: 'Shared credits for the first time',
    icon: 'Share2',
    requirement: 1,
    reward: 10,
    category: 'credits'
  },
  CREDIT_HOLDER_100: {
    id: 'credit_holder_100',
    name: 'Credit Saver',
    description: 'Accumulated 100 credits',
    icon: 'PiggyBank',
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
    const client = getClient();
    const { data, error } = await client
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get achievement progress for a user
   */
  static async getUserStats(userId) {
    const client = getClient();

    // Get counts from various tables
    const [
      { count: intentCount },
      { count: sessionCount },
      { count: skillCount },
      { count: reviewCount },
      { count: shareCount },
      { data: userData }
    ] = await Promise.all([
      client.from('intents').select('*', { count: 'exact', head: true }).eq('created_by', userId),
      client.from('sessions').select('*', { count: 'exact', head: true }).or(`requester_id.eq.${userId},provider_id.eq.${userId}`).eq('status', 'completed'),
      client.from('skills').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('reviews').select('*', { count: 'exact', head: true }).eq('reviewer_id', userId),
      client.from('credit_transfers').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
      client.from('users').select('credits').eq('id', userId).single()
    ]);

    return {
      intents: intentCount || 0,
      sessions: sessionCount || 0,
      skills: skillCount || 0,
      reviews: reviewCount || 0,
      shares: shareCount || 0,
      credits: userData?.credits || 0
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
}

export default AchievementService;
