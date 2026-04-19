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
      
      // 1. Fetch available pool of intents and skills
      const [allIntents, allSkills] = await Promise.all([
        IntentService.getAllIntents(),
        SkillService.searchSkills({})
      ]);

      // 2. Filter out own intents and skills for recommendations
      const otherIntents = allIntents.filter(i => i.created_by !== userId && i.status === 'looking');
      const otherSkills = allSkills.filter(s => s.user_id !== userId);

      // 3. Use AI to rank top 3 intents
      const intentRecommendations = await AIService.getRecommendations(user, otherIntents.slice(0, 10)); // Limit pool for performance

      // 4. Use AI to rank top 3 potential partners
      const partnerRecommendations = await AIService.getRecommendations(user, otherSkills.slice(0, 10));

      res.status(200).json({
        intents: intentRecommendations,
        partners: partnerRecommendations
      });
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
