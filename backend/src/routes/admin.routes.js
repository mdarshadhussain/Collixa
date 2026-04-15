import express from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authMiddleware, adminMiddleware);

// Dashboard stats
router.get('/stats', AdminController.getStats);
router.get('/stats/achievements', AdminController.getAchievementStats);

// User management
router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);
router.patch('/users/:id/ban', AdminController.banUser);
router.patch('/users/:id/unban', AdminController.unbanUser);

// Intent management
router.get('/intents', AdminController.getAllIntents);
router.get('/intents/:id', AdminController.getIntentById);
router.patch('/intents/:id', AdminController.updateIntent);
router.delete('/intents/:id', AdminController.deleteIntent);

// Skill/Tribe management
router.get('/tribes', AdminController.getAllTribes);
router.patch('/tribes/:id', AdminController.updateTribe);
router.delete('/tribes/:id', AdminController.deleteTribe);

// Session management
router.get('/sessions', AdminController.getAllSessions);
router.patch('/sessions/:id/complete', AdminController.completeSession);
router.patch('/sessions/:id/cancel', AdminController.cancelSession);

// Credit management
router.get('/credits', AdminController.getCreditTransactions);
router.post('/credits/add', AdminController.addCredits);
router.post('/credits/deduct', AdminController.deductCredits);

// Reports
router.get('/reports', AdminController.getReports);

export default router;
