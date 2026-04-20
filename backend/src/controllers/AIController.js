import AIService from '../services/AIService.js';
import IntentService from '../services/IntentService.js';
import SkillService from '../services/SkillService.js';
import AuthService from '../services/AuthService.js';

export class AIController {
  /**
   * Get personalized recommendations for intents and partners
   * GET /api/ai/recommendations
   */
  static async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await AuthService.getProfile(userId);
      
      const CACHE_TTL = 60 * 60 * 1000; // 1 hour
      const now = new Date();
      const lastUpdated = user.recommendations_updated_at ? new Date(user.recommendations_updated_at) : null;

      // 1. Check Cache Validity
      if (user.cached_recommendations && lastUpdated && (now - lastUpdated < CACHE_TTL)) {
        console.log(`[AIController] Serving cached recommendations for user ${userId}`);
        const cached = typeof user.cached_recommendations === 'string' 
          ? JSON.parse(user.cached_recommendations) 
          : user.cached_recommendations;
          
        return res.status(200).json(cached);
      }

      console.log(`[AIController] Cache stale/missing for user ${userId}. Fetching fresh AI recommendations...`);

      // 2. Fetch available pool of intents and skills
      const [allIntents, allSkills] = await Promise.all([
        IntentService.getAllIntents(),
        SkillService.searchSkills({})
      ]);

      // 3. Filter out own intents and skills for recommendations
      const otherIntents = allIntents.filter(i => i.created_by !== userId && i.status === 'looking');
      const otherSkills = allSkills.filter(s => s.user_id !== userId);

      // 4. Use Unified AI Call (Consolidated to save quota)
      const freshRecommendations = await AIService.getUnifiedRecommendations(
        user, 
        otherIntents.slice(0, 10), 
        otherSkills.slice(0, 10)
      );

      // 5. Update Cache in Database (Non-blocking or gracefully handled)
      try {
        await AuthService.updateProfile(userId, {
          cached_recommendations: freshRecommendations,
          recommendations_updated_at: now.toISOString()
        });
      } catch (dbError) {
        // If columns don't exist yet, we just log and skip caching
        console.warn('[AIController] Cache persistence failed (columns may be missing):', dbError.message);
      }

      res.status(200).json(freshRecommendations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate match score for a specific intent
   * GET /api/ai/match/intent/:intentId
   */
  static async matchWithIntent(req, res, next) {
    try {
      const userId = req.user.id;
      const { intentId } = req.params;
      
      const [user, intent] = await Promise.all([
        AuthService.getProfile(userId),
        IntentService.getIntentById(intentId)
      ]);

      const match = await AIService.calculateMatch(user, intent);
      
      res.status(200).json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unified match endpoint
   * POST /api/ai/match
   */
  static async match(req, res, next) {
    try {
      const userId = req.user.id;
      const { type, itemId, itemTitle, itemDescription } = req.body;

      console.log(`[AIController] Matching user ${userId} with ${type} ${itemId}`);

      const user = await AuthService.getProfile(userId);
      let targetData = { title: itemTitle, description: itemDescription };

      // In the future, we could fetch full objects if itemId is provided
      // but passing them from frontend is faster for initial display.

      const match = await AIService.calculateMatch(user, targetData);
      
      res.status(200).json({ success: true, data: match });
    } catch (error) {
      console.error('[AIController] Match error:', error);
      next(error);
    }
  }

  /**
   * Generate a learning roadmap for a goal
   * POST /api/ai/learning-path
   */
  static async generateLearningPath(req, res, next) {
    try {
      const userId = req.user.id;
      const { goal } = req.body;
      
      console.log(`[AIController] Generating roadmap for user ${userId} and goal: "${goal}"`);

      if (!goal) {
        return res.status(400).json({ error: 'Goal is required' });
      }

      const user = await AuthService.getProfile(userId);
      const roadmap = await AIService.generateLearningPath(user, goal);
      
      console.log(`[AIController] Successfully generated roadmap for user ${userId}`);
      res.status(200).json({ success: true, roadmap });
    } catch (error) {
      console.error('[AIController] Learning Path Error:', error.message);
      next(error);
    }
  }
}

export default AIController;
