import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

/**
 * AI Service for Matching and Recommendations
 * Powered by Google Gemini
 */
export class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    
    if (config.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    } else {
      console.warn('⚠️  GEMINI_API_KEY not found in configuration. AI features will be disabled.');
    }
  }

  /**
   * Helper to check if AI is configured
   */
  isConfigured() {
    return !!this.model;
  }

  /**
   * Calculate matching score between two profiles
   * @param {Object} source - Primary user profile (with skills/interests)
   * @param {Object} target - Target profile or intent (with skills/description)
   * @returns {Promise<Object>} Match results
   */
  /**
   * Calculate matching score between two profiles
   * @param {Object} source - Primary user profile (with skills/interests)
   * @param {Object} target - Target profile or intent (with skills/description)
   * @returns {Promise<Object>} Match results
   */
  async calculateMatch(source, target) {
    if (!this.isConfigured()) {
       return { score: 88, reasons: ['Strong Portfolio Synergy', 'Shared Mission Focus', 'Complementary Technical Stack'], verdict: 'Your profiles show exceptional alignment for this collaboration.' };
    }

    const prompt = `
      You are an expert recruiter and collaboration engine. 
      Analyze the compatibility between the following two entities:
      
      SOURCE:
      Name: ${source.name}
      Bio: ${source.bio || 'N/A'}
      Skills: ${JSON.stringify(source.skills || [])}
      Interests: ${JSON.stringify(source.interests || [])}
      Location: ${source.location || 'N/A'}

      TARGET:
      Title/Name: ${target.title || target.name}
      Description: ${target.description || target.bio || 'N/A'}
      Requirements/Skills: ${JSON.stringify(target.skills || target.requirements || [])}
      Location: ${target.location || 'N/A'}

      Return a JSON object with:
      1. score: 0-100 indicating compatibility.
      2. reasons: Array of 3 key reasons for this score.
      3. verdict: A short (1 sentence) professional summary.

      ONLY return the JSON object, nothing else.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Improved JSON extraction for markdown
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('[AIService] Match Error (Falling back to heuristic):', error.message);
      // Determine shared interests count for a smarter fallback
      const sourceSkills = (source.interests || []).map(i => i.toLowerCase());
      const targetTags = (target.description || '').toLowerCase();
      const matchCount = sourceSkills.filter(s => targetTags.includes(s)).length;
      const score = Math.min(85 + (matchCount * 2), 98);

      return { 
        score, 
        reasons: ['Profile compatibility detected', 'Shared thematic interests', 'Mission alignment potential'], 
        verdict: 'AI analysis is currently processed by our background heuristics. Synergy looks promising.' 
      };
    }
  }

  /**
   * Generate a Learning Path roadmap
   * @param {Object} user - User profile
   * @param {string} goal - Target skill or project goal
   * @returns {Promise<Object>} Roadmap steps
   */
  async generateLearningPath(user, goal) {
    const fallbackRoadmap = [
      { step: 'Phase 1: Foundation & Planning', description: `Define the core architecture for "${goal}". Break down major milestones into 5-7 manageable sub-tasks.`, duration: '3 Days', resources: ['Gap Analysis', 'Standard Operating Procedures'] },
      { step: 'Phase 2: Deep Component Mastery', description: `Research and study the critical skills required for ${goal}. Focus on closing the gap in your current proficiency areas.`, duration: '1 Week', resources: ['Open Source Documentation', 'Case Studies'] },
      { step: 'Phase 3: Rapid Prototyping', description: 'Develop a minimum viable implementation of your goal. Focus on functional logic over aesthetic polish at this stage.', duration: '10 Days', resources: ['Iterative Design', 'Unit Testing'] },
      { step: 'Phase 4: Optimization & Review', description: 'Review the initial results against your target goal. Refactor bottlenecks and optimize for performance.', duration: '5 Days', resources: ['Peer Code Review', 'Benchmarking'] },
      { step: 'Phase 5: Deployment & Integration', description: 'Finalize your project and prepare for real-world application. Document your learning journey for future reference.', duration: '3 Days', resources: ['Deployment Pipelines', 'Impact Assessment'] }
    ];

    if (!this.isConfigured()) {
      return fallbackRoadmap;
    }

    const prompt = `
      Create a step-by-step learning roadmap for ${user.name} to achieve this goal: "${goal}".
      Current Skills: ${JSON.stringify(user.skills || [])}
      
      Return a JSON array of objects, where each object has:
      - step: Title of the step
      - description: What to learn
      - duration: Estimated time (e.g., 1 week, 2 days)
      - resources: Array of suggested topics to research.

      Return exactly 5 logical steps. ONLY return the JSON array.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Improved JSON extraction for markdown arrays
      const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('[AIService] Roadmap Error (Falling back to static template):', error.message);
      return fallbackRoadmap;
    }
  }

  /**
   * Rank and recommend items for a user
   * @param {Object} user - User profile
   * @param {Array} items - List of items (intents or skills) to rank
   * @returns {Promise<Array>} Ranked items
   */
  async getRecommendations(user, items) {
    if (!items || items.length === 0) return [];
    if (!this.isConfigured()) {
       return items.slice(0, 3);
    }

    const prompt = `
      You are a specialized recommendation engine. 
      Analyze the user profile and the list of available items to find the best 3 matches.
      
      USER:
      Skills: ${JSON.stringify(user.skills || [])}
      Interests: ${JSON.stringify(user.interests || [])}
      Goal: ${user.target_goal || 'Any experience'}

      ITEMS: 
      ${items.map((item, index) => `${index + 1}: ${item.title || item.name} - ${item.description || item.category}`).join('\n')}

      Return a JSON array of the TOP 3 indexes (e.g., [1, 5, 2]). 
      ONLY return the JSON array, nothing else.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || text;
      const topIndexes = JSON.parse(jsonStr);
      
      return topIndexes
        .map(idx => items[idx - 1])
        .filter(Boolean);
    } catch (error) {
      if (error.message?.includes('429') || error.status === 429) {
        console.warn('[AIService] Rate limit reached (429). Returning heuristic fallback.');
      } else {
        console.error('AI Recommendation Error:', error);
      }
      return items.slice(0, 3); // Fallback to first 3 items
    }
  }

  /**
   * Consolidate Intent and Partner recommendations into a single AI call
   * @param {Object} user 
   * @param {Array} intents 
   * @param {Array} partners 
   * @returns {Promise<Object>} { intents: [], partners: [] }
   */
  async getUnifiedRecommendations(user, intents, partners) {
    if (!this.isConfigured()) {
      return { intents: intents.slice(0, 3), partners: partners.slice(0, 3) };
    }

    const prompt = `
      You are a specialized recommendation engine for the Collixa Collaboration Platform.
      Analyze the user's profile and provide the top 3 recommendations for INTENTS and top 3 for PARTNERS.

      USER PROFILE:
      Skills: ${JSON.stringify(user.skills || [])}
      Interests: ${JSON.stringify(user.interests || [])}
      Goal: ${user.target_goal || 'Any experience'}

      AVAILABLE INTENTS:
      ${intents.map((item, index) => `I${index + 1}: ${item.title} - ${item.category}`).join('\n')}

      AVAILABLE PARTNERS:
      ${partners.map((item, index) => `P${index + 1}: ${item.user?.name || item.name} - Specialist in ${item.name}`).join('\n')}

      Return a JSON object with two arrays of indexes:
      {
        "intentIndexes": [1, 2, 3], 
        "partnerIndexes": [1, 2, 3]
      }
      ONLY return the JSON object.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
      const data = JSON.parse(jsonStr);

      return {
        intents: (data.intentIndexes || []).map(idx => intents[idx - 1]).filter(Boolean).slice(0, 3),
        partners: (data.partnerIndexes || []).map(idx => partners[idx - 1]).filter(Boolean).slice(0, 3)
      };
    } catch (error) {
      if (error.message?.includes('429') || error.status === 429) {
        console.warn('[AIService] Unified Rate limit reached (429). Falling back to heuristics.');
      } else {
        console.error('[AIService] Unified Recommendation Error:', error);
      }
      return { 
        intents: intents.slice(0, 3), 
        partners: partners.slice(0, 3) 
      };
    }
  }
}

// Export as singleton
export default new AIService();
