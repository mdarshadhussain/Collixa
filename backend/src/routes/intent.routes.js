import express from 'express';
import { body, param, query } from 'express-validator';
import IntentController from '../controllers/intent.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Validation Rules
 */
const createIntentValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('timeline')
    .notEmpty()
    .withMessage('Timeline is required')
    .isISO8601()
    .withMessage('Timeline must be a valid ISO8601 date'),
  body('attachment_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Attachment name must not exceed 255 characters'),
];

const updateIntentValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .trim(),
  body('location')
    .optional()
    .trim(),
  body('timeline')
    .optional()
    .isISO8601()
    .withMessage('Timeline must be a valid ISO8601 date'),
];

/**
 * Public Routes (Require Authentication)
 */

/**
 * POST /api/intents
 * Create new intent
 */
router.post(
  '/',
  authMiddleware,
  ...createIntentValidation,
  IntentController.createIntent
);

/**
 * GET /api/intents
 * Get all intents with optional filters
 * Query params: category, location
 */
router.get(
  '/',
  IntentController.getAllIntents
);

/**
 * GET /api/intents/search/:keyword
 * Search intents by keyword
 */
router.get(
  '/search/:keyword',
  param('keyword')
    .trim()
    .notEmpty()
    .withMessage('Search keyword is required'),
  IntentController.searchIntents
);

/**
 * GET /api/intents/filter
 * Filter intents by category and/or location
 * Query params: category, location
 */
router.get(
  '/filter',
  query('category').optional().trim(),
  query('location').optional().trim(),
  IntentController.filterIntents
);

/**
 * GET /api/intents/user/my-intents
 * Get current user's intents
 */
router.get(
  '/user/my-intents',
  authMiddleware,
  IntentController.getUserIntents
);

/**
 * GET /api/intents/:id
 * Get specific intent by ID
 */
router.get(
  '/:id',
  param('id')
    .notEmpty()
    .withMessage('Invalid intent ID'),
  IntentController.getIntentById
);

/**
 * PATCH /api/intents/:id
 * Update intent (requires authentication)
 */
router.patch(
  '/:id',
  authMiddleware,
  param('id')
    .notEmpty()
    .withMessage('Invalid intent ID'),
  ...updateIntentValidation,
  IntentController.updateIntent
);

/**
 * PATCH /api/intents/:id/complete
 * Mark intent as completed (requires authentication)
 */
router.patch(
  '/:id/complete',
  authMiddleware,
  param('id')
    .notEmpty()
    .withMessage('Invalid intent ID'),
  IntentController.completeIntent
);

/**
 * DELETE /api/intents/:id
 * Delete intent (requires authentication)
 */
router.delete(
  '/:id',
  authMiddleware,
  param('id')
    .notEmpty()
    .withMessage('Invalid intent ID'),
  IntentController.deleteIntent
);

/**
 * Collaboration Request Routes
 */

/**
 * POST /api/intents/:id/request
 * Send collaboration request (requires authentication)
 */
router.post(
  '/:id/request',
  authMiddleware,
  param('id')
    .notEmpty()
    .withMessage('Invalid intent ID'),
  IntentController.sendCollaborationRequest
);

/**
 * GET /api/intents/:id/requests
 * Get collaboration requests for intent (requires authentication)
 */
router.get(
  '/:id/requests',
  authMiddleware,
  param('id')
    .notEmpty()
    .withMessage('Invalid intent ID'),
  IntentController.getCollaborationRequests
);

/**
 * PATCH /api/requests/:requestId/accept
 * Accept collaboration request (requires authentication)
 */
router.patch(
  '/requests/:requestId/accept',
  authMiddleware,
  param('requestId')
    .notEmpty()
    .withMessage('Invalid request ID'),
  IntentController.acceptRequest
);

/**
 * PATCH /api/requests/:requestId/reject
 * Reject collaboration request (requires authentication)
 */
router.patch(
  '/requests/:requestId/reject',
  authMiddleware,
  param('requestId')
    .notEmpty()
    .withMessage('Invalid request ID'),
  IntentController.rejectRequest
);

export default router;
