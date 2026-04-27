import SkillService from '../services/SkillService.js';
import { AchievementService } from '../services/AchievementService.js';

export class SkillController {
  /**
   * Add a new skill
   */
  static async addSkill(req, res, next) {
    try {
      const skill = await SkillService.addSkill(req.user.id, req.body);

      // Check for achievements (don't block response)
      AchievementService.checkAndAwardAchievements(req.user.id).catch(console.error);

      res.status(201).json({
        success: true,
        data: skill
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all skills
   */
  static async getSkills(req, res, next) {
    try {
      const currentUserId = req.user?.id || null;
      const skills = await SkillService.searchSkills(req.query, currentUserId);
      res.status(200).json({
        success: true,
        data: skills
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request skill exchange
   */
  static async requestExchange(req, res, next) {
    try {
      const exchange = await SkillService.requestExchange(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: exchange
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exchanges for current user
   */
  static async getMyExchanges(req, res, next) {
    try {
      const exchanges = await SkillService.getUserExchanges(req.user.id);
      res.status(200).json({
        success: true,
        data: exchanges
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update exchange status (Accept/Reject/Schedule)
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, scheduled_at } = req.body;
      const exchange = await SkillService.updateExchangeStatus(req.user.id, id, status, { scheduled_at });
      res.status(200).json({
        success: true,
        data: exchange
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a skill
   */
  static async updateSkill(req, res, next) {
    try {
      const { id } = req.params;
      const skill = await SkillService.updateSkill(req.user.id, id, req.body);
      res.status(200).json({
        success: true,
        data: skill
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a skill
   */
  static async deleteSkill(req, res, next) {
    try {
      const { id } = req.params;
      await SkillService.deleteSkill(req.user.id, id);
      res.status(200).json({
        success: true,
        message: 'Skill deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get skill detail
   */
  static async getSkillDetail(req, res, next) {
    try {
      const { id } = req.params;
      const skill = await SkillService.getSkillWithCollaborators(id);
      res.status(200).json({
        success: true,
        data: skill
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Post a notice to a tribe
   */
  static async createNotice(req, res, next) {
    try {
      const { id } = req.params;
      const { content, type } = req.body;
      const notice = await SkillService.createNotice(req.user.id, id, content, type);
      res.status(201).json({
        success: true,
        data: notice
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notice
   */
  static async deleteNotice(req, res, next) {
    try {
      const { noticeId } = req.params;
      await SkillService.deleteNotice(req.user.id, noticeId);
      res.status(200).json({
        success: true,
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all skills for a specific user (listed and enrolled)
   */
  static async getUserSkills(req, res, next) {
    try {
      const { userId } = req.params;
      const skills = await SkillService.getUserSkills(userId);
      res.status(200).json({
        success: true,
        data: skills
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SkillController;
