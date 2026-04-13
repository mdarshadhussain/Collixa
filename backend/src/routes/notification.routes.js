import express from 'express';
import NotificationController from '../controllers/NotificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get current user's notifications
 */
router.get('/', authMiddleware, NotificationController.getMyNotifications);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read (and delete)
 */
router.patch('/:id/read', authMiddleware, NotificationController.markAsRead);

/**
 * DELETE /api/notifications
 * Clear all notifications
 */
router.delete('/', authMiddleware, NotificationController.markAllRead);

export default router;
