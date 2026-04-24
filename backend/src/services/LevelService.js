import { supabase, supabaseAdmin } from '../config/database.js';
import NotificationService from './NotificationService.js';

const getClient = () => supabaseAdmin || supabase;

/**
 * LevelService - Handles XP calculations and Level/Tier transitions
 * Leveling is compounding: each level requires 5% more XP than the previous one.
 */
export class LevelService {
  static BASE_XP = 1000;
  static GROWTH_RATE = 0.05;

  /**
   * Calculate the total XP required to reach a specific level
   * Formula: Sum of (BASE_XP * (1.05 ^ (i-2))) for i from 2 to level
   * @param {number} level 
   * @returns {number} totalXPRequired
   */
  static getThresholdForLevel(level) {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += Math.floor(this.BASE_XP * Math.pow(1 + this.GROWTH_RATE, i - 2));
    }
    return total;
  }

  /**
   * Determine the current level based on total XP
   * @param {number} xp 
   * @returns {number} level
   */
  static getLevelFromXP(xp) {
    let level = 1;
    while (xp >= this.getThresholdForLevel(level + 1)) {
      level++;
    }
    return level;
  }

  /**
   * Get the tier label based on level
   * @param {number} level 
   * @returns {string} tier
   */
  static getTierFromLevel(level) {
    if (level >= 50) return 'Oracle';
    if (level >= 25) return 'Luminary';
    if (level >= 10) return 'Architect';
    return 'Nomad';
  }

  /**
   * Award XP to a user and handle level/tier updates
   * @param {string} userId - User ID
   * @param {number} amount - XP amount to award
   * @param {string} reason - Optional reason for notification
   */
  static async awardXP(userId, amount, reason = 'Engagement') {
    if (!userId || amount <= 0) return;

    try {
      // 1. Fetch current user state
      const { data: user, error } = await getClient()
        .from('users')
        .select('xp, level, tier, name')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('[LevelService] Error fetching user:', error);
        return;
      }

      const oldXP = user.xp || 0;
      const oldLevel = user.level || 1;
      const oldTier = user.tier || 'Nomad';

      const newXP = oldXP + amount;
      const newLevel = this.getLevelFromXP(newXP);
      const newTier = this.getTierFromLevel(newLevel);

      // 2. Prepare updates
      const updates = { 
        xp: newXP,
        updated_at: new Date().toISOString()
      };

      let leveledUp = false;
      let tierShifted = false;

      if (newLevel > oldLevel) {
        updates.level = newLevel;
        leveledUp = true;
      }

      if (newTier !== oldTier) {
        updates.tier = newTier;
        tierShifted = true;
      }

      // 3. Update Database
      const { error: updateError } = await getClient()
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('[LevelService] Error updating user:', updateError);
        return;
      }

      // 4. Log XP Transaction
      await getClient()
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: reason.toUpperCase().replace(/\s+/g, '_'),
          description: reason,
          created_at: new Date().toISOString()
        });

      // 5. Notifications & Logs
      if (leveledUp) {
        console.log(`[LevelService] User ${userId} (${user.name}) leveled up to ${newLevel}!`);
        await NotificationService.send(
          userId,
          'LEVEL_UP',
          'Level Up!',
          `Congratulations! You've reached Level ${newLevel}. Your influence grows.`,
          '/profile'
        );
      }

      if (tierShifted) {
        console.log(`[LevelService] User ${userId} shifted to ${newTier} tier!`);
        await NotificationService.send(
          userId,
          'TIER_PROMOTED',
          'Tier Promotion',
          `Incredible! You have been promoted to the rank of ${newTier}. Your economic benefits have increased.`,
          '/credits'
        );
      }

    } catch (err) {
      console.error('[LevelService] awardXP Exception:', err);
    }
  }

  /**
   * Get progress details for frontend
   */
  static async getProgress(userId) {
    const { data: user } = await getClient()
      .from('users')
      .select('xp, level, tier')
      .eq('id', userId)
      .single();
    
    if (!user) return null;

    const currentLevelThreshold = this.getThresholdForLevel(user.level);
    const nextLevelThreshold = this.getThresholdForLevel(user.level + 1);
    const progressInCurrentLevel = user.xp - currentLevelThreshold;
    const totalNeededForNext = nextLevelThreshold - currentLevelThreshold;
    const percentage = Math.floor((progressInCurrentLevel / totalNeededForNext) * 100);

    return {
      xp: user.xp,
      level: user.level,
      tier: user.tier,
      nextThreshold: nextLevelThreshold,
      percentage
    };
  }

  /**
   * Get limits for a tier
   * @param {string} tier 
   * @returns {Object} { maxIntents, maxSkills }
   */
  static getTierLimits(tier) {
    switch (tier) {
      case 'Oracle':   return { maxIntents: 20, maxSkills: 20 };
      case 'Luminary': return { maxIntents: 10, maxSkills: 10 };
      case 'Architect': return { maxIntents: 5, maxSkills: 5 };
      case 'Nomad':    
      default:         return { maxIntents: 2, maxSkills: 2 };
    }
  }
}

export default LevelService;
