import express from 'express';
import ChatController from '../controllers/ChatController.js';
import MeetingController from '../controllers/MeetingController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/chat/meetings/schedule
 * Schedule a new meeting
 */
router.post('/meetings/schedule', authMiddleware, MeetingController.scheduleMeeting);

/**
 * GET /api/chat/:conversationId/meetings
 * Get all meetings for a conversation
 */
router.get('/:conversationId/meetings', authMiddleware, MeetingController.getMeetings);

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

/**
 * DELETE /api/chat/:conversationId/clear
 * Clear personal chat history
 */
router.delete('/:conversationId/clear', authMiddleware, ChatController.clearChat);

/**
 * PATCH /api/chat/:conversationId/participants/role
 * Update participant role
 */
router.patch('/:conversationId/participants/role', authMiddleware, ChatController.updateParticipantRole);

/**
 * DELETE /api/chat/:conversationId/participants/:userId
 * Remove participant from conversation
 */
router.delete('/:conversationId/participants/:userId', authMiddleware, ChatController.removeParticipant);

export default router;
