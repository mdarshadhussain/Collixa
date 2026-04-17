import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class LevelService {
  /**
   * Award XP to a user and handle potential level-ups
   * @param {string} userId - User ID
   * @param {number} amount - XP amount to award
   */
  static async awardXP(userId, amount) {
    if (!userId || amount <= 0) return;

    try {
      // Fetch current XP and Level
      const { data: user, error } = await getClient()
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Error fetching user for XP award:', error);
        return;
      }

      const newXP = (user.xp || 0) + amount;
      let newLevel = user.level || 1;

      // Determine correct level based on new XP
      if (newXP >= 3500) newLevel = 5;
      else if (newXP >= 1500) newLevel = 4;
      else if (newXP >= 500) newLevel = 3;
      else if (newXP >= 100) newLevel = 2;
      else newLevel = 1;

      // Only update if something changed
      const updates = { xp: newXP };
      if (newLevel !== user.level) {
        updates.level = newLevel;
      }

      const { error: updateError } = await getClient()
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user XP/Level:', updateError);
      } else if (newLevel > (user.level || 1)) {
        console.log(`User ${userId} leveled up to ${newLevel}!`);
        // Future: Could trigger a notification here
      }
    } catch (err) {
      console.error('LevelService Error:', err);
    }
  }

  /**
   * Helper to get level label
   */
  static getLevelLabel(level) {
    const labels = {
      1: 'Novice',
      2: 'Contributor',
      3: 'Collaborator',
      4: 'Professional',
      5: 'Master'
    };
    return labels[level] || 'Novice';
  }
}

export default LevelService;
