import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import AchievementController from '../controllers/AchievementController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', AchievementController.getAllAchievements);
router.get('/my', AchievementController.getMyAchievements);
router.get('/stats', AchievementController.getUserStats);
router.post('/check', AchievementController.checkAchievements);

export default router;
