import express from 'express';
import AIController from '../controllers/AIController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * AI Routes
 * All routes are protected by authMiddleware
 */

// Get personalized recommendations
router.get('/recommendations', authMiddleware, AIController.getRecommendations);

// Match current user with a specific intent
router.get('/match/intent/:intentId', authMiddleware, AIController.matchWithIntent);

// Unified match for both intents and skills
router.post('/match', authMiddleware, AIController.match);

// Generate AI-powered learning path
router.post('/learning-path', authMiddleware, AIController.generateLearningPath);

export default router;
