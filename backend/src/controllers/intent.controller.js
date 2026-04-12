import IntentService from '../services/IntentService.js';
import { validationResult } from 'express-validator';

export class IntentController {
  /**
   * Create a new intent
   * POST /api/intents
   */
  static async createIntent(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, category, location, timeline, budget, goal, attachment_name } = req.body;
      const userId = req.user.id; // From authMiddleware

      const intentData = {
        title,
        description,
        category,
        location,
        timeline,
        budget,
        goal,
      };

      if (attachment_name) {
        intentData.attachment_name = attachment_name;
      }

      const intent = await IntentService.createIntent(intentData, userId);

      return res.status(201).json({
        message: 'Intent created successfully',
        data: intent,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all intents
   * GET /api/intents
   * Query params: category, location
   */
  static async getAllIntents(req, res, next) {
    try {
      const { category, location } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (location) filters.location = location;

      const intents = await IntentService.getAllIntents(filters);

      return res.status(200).json({
        data: intents,
        total: intents.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get intent by ID
   * GET /api/intents/:id
   */
  static async getIntentById(req, res, next) {
    try {
      const { id } = req.params;

      const intent = await IntentService.getIntentById(id);

      return res.status(200).json({
        data: intent,
      });
    } catch (error) {
      if (error.message === 'Intent not found') {
        return res.status(404).json({ error: 'Intent not found' });
      }
      next(error);
    }
  }

  /**
   * Update intent
   * PATCH /api/intents/:id
   */
  static async updateIntent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, description, category, location, timeline, budget, goal } = req.body;

      const updates = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (category) updates.category = category;
      if (location) updates.location = location;
      if (timeline) updates.timeline = timeline;
      if (budget) updates.budget = budget;
      if (goal) updates.goal = goal;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const intent = await IntentService.updateIntent(id, updates, userId);

      return res.status(200).json({
        message: 'Intent updated successfully',
        data: intent,
      });
    } catch (error) {
      if (error.message === 'Intent not found') {
        return res.status(404).json({ error: 'Intent not found' });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Complete intent
   * PATCH /api/intents/:id/complete
   */
  static async completeIntent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const intent = await IntentService.completeIntent(id, userId);

      return res.status(200).json({
        message: 'Intent marked as completed',
        data: intent,
      });
    } catch (error) {
      if (error.message === 'Intent not found') {
        return res.status(404).json({ error: 'Intent not found' });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Delete intent
   * DELETE /api/intents/:id
   */
  static async deleteIntent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await IntentService.deleteIntent(id, userId);

      return res.status(200).json({
        message: 'Intent deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Intent not found') {
        return res.status(404).json({ error: 'Intent not found' });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Get user's intents
   * GET /api/intents/user/my-intents
   */
  static async getUserIntents(req, res, next) {
    try {
      const userId = req.user.id;

      const intents = await IntentService.getUserIntents(userId);

      return res.status(200).json({
        data: intents,
        total: intents.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send collaboration request
   * POST /api/intents/:id/request
   */
  static async sendCollaborationRequest(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const request = await IntentService.sendCollaborationRequest(id, userId);

      return res.status(201).json({
        message: 'Collaboration request sent successfully',
        data: request,
      });
    } catch (error) {
      if (error.message === 'Intent not found') {
        return res.status(404).json({ error: 'Intent not found' });
      }
      if (error.message.includes('Cannot request') || error.message.includes('already')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Get collaboration requests for an intent
   * GET /api/intents/:id/requests
   */
  static async getCollaborationRequests(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify intent exists and user is the creator
      const intent = await IntentService.getIntentById(id);
      if (intent.created_by !== userId) {
        return res.status(403).json({ error: 'Not authorized to view requests for this intent' });
      }

      const requests = await IntentService.getCollaborationRequests(id);

      return res.status(200).json({
        data: requests,
        total: requests.length,
      });
    } catch (error) {
      if (error.message === 'Intent not found') {
        return res.status(404).json({ error: 'Intent not found' });
      }
      next(error);
    }
  }

  /**
   * Accept collaboration request
   * PATCH /api/requests/:requestId/accept
   */
  static async acceptRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const request = await IntentService.acceptRequest(requestId, userId);

      return res.status(200).json({
        message: 'Collaboration request accepted',
        data: request,
      });
    } catch (error) {
      if (error.message === 'Request not found') {
        return res.status(404).json({ error: 'Request not found' });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('Cannot accept')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Reject collaboration request
   * PATCH /api/requests/:requestId/reject
   */
  static async rejectRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const request = await IntentService.rejectRequest(requestId, userId);

      return res.status(200).json({
        message: 'Collaboration request rejected',
        data: request,
      });
    } catch (error) {
      if (error.message === 'Request not found') {
        return res.status(404).json({ error: 'Request not found' });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('Cannot reject')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * Filter intents by category and/or location
   * GET /api/intents/filter
   * Query params: category, location
   */
  static async filterIntents(req, res, next) {
    try {
      const { category, location } = req.query;

      const intents = await IntentService.filterIntents(category, location);

      return res.status(200).json({
        data: intents,
        total: intents.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search intents by keyword
   * GET /api/intents/search/:keyword
   */
  static async searchIntents(req, res, next) {
    try {
      const { keyword } = req.params;

      if (!keyword || keyword.trim().length === 0) {
        return res.status(400).json({ error: 'Search keyword is required' });
      }

      const intents = await IntentService.searchIntents(keyword);

      return res.status(200).json({
        data: intents,
        total: intents.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default IntentController;
