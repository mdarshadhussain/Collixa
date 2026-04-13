import express from 'express';
import { body, param, query } from 'express-validator';
import SkillController from '../controllers/SkillController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/skills
 * List all available skills with filters
 */
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('search').optional().isString(),
  ],
  SkillController.getSkills
);

/**
 * POST /api/skills
 * Add a new skill (protected)
 */
router.post(
  '/',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('Skill name is required'),
    body('level').optional().isString(),
    body('category').optional().isString(),
    body('description').optional().isString(),
  ],
  SkillController.addSkill
);

/**
 * POST /api/skills/request
 * Request a skill exchange (protected)
 */
router.post(
  '/request',
  authMiddleware,
  [
    body('skillId').isUUID().withMessage('Valid Skill ID is required'),
    body('message').optional().isString(),
  ],
  SkillController.requestExchange
);

/**
 * GET /api/skills/exchanges/me
 * Get current user's exchange requests (incoming/outgoing)
 */
router.get(
  '/exchanges/me',
  authMiddleware,
  SkillController.getMyExchanges
);

/**
 * PATCH /api/skills/exchanges/:id
 * Update status (Accept/Reject/Schedule)
 */
router.patch(
  '/exchanges/:id',
  authMiddleware,
  [
    param('id').isUUID().withMessage('Invalid exchange ID'),
    body('status').isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'SCHEDULED']).withMessage('Invalid status'),
    body('scheduled_at').optional().isISO8601().withMessage('Invalid date format'),
  ],
  SkillController.updateStatus
);

export default router;
