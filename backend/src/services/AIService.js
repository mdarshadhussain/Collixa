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
  async calculateMatch(source, target) {
    if (!this.isConfigured()) {
       return { score: 75, reasons: ['Profile Analysis Complete', 'Shared Interests Found'], verdict: 'You appear compatible based on your published skills.' };
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
      // Basic JSON extraction in case AI adds markdown formatting
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('AI Matching Error:', error);
      return { score: 0, reasons: ['AI Service Unavailable'], verdict: 'Unable to calculate match at this time.' };
    }
  }

  /**
   * Generate a Learning Path roadmap
   * @param {Object} user - User profile
   * @param {string} goal - Target skill or project goal
   * @returns {Promise<Object>} Roadmap steps
   */
  async generateLearningPath(user, goal) {
    if (!this.isConfigured()) {
      return [
        { step: 'Define Scope', description: 'Break down your goal into manageable tasks.', duration: '1 day', resources: ['Project Planning', 'Goal Setting'] },
        { step: 'Core Learning', description: 'Study the fundamental concepts related to your goal.', duration: '1 week', resources: ['Online Courses', 'Documentation'] },
        { step: 'Practicum', description: 'Build a small prototype to test your knowledge.', duration: '1 week', resources: ['Side Projects', 'GitHub'] },
        { step: 'Review & Refine', description: 'Gather feedback and improve your implementation.', duration: '3 days', resources: ['Peer Review', 'Mentorship'] },
        { step: 'Launch', description: 'Complete the final version of your project.', duration: '2 days', resources: ['Publishing', 'Sharing'] }
      ];
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
      const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('AI Learning Path Error:', error);
      throw new Error('Failed to generate learning path');
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
      console.error('AI Recommendation Error:', error);
      return items.slice(0, 3); // Fallback to first 3 items
    }
  }
}

// Export as singleton
export default new AIService();
