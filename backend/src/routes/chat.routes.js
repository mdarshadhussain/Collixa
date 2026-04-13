import express from 'express';
import ChatController from '../controllers/ChatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/chat/send
 * Send a new message
 */
router.post('/send', authMiddleware, ChatController.sendMessage);

/**
 * GET /api/chat/unread-count
 * Get total unread messages count
 */
router.get('/unread-count', authMiddleware, ChatController.getUnreadCount);

/**
 * PATCH /api/chat/:conversationId/read
 * Mark all messages in conversation as read
 */
router.patch('/:conversationId/read', authMiddleware, ChatController.markAsRead);

export default router;
