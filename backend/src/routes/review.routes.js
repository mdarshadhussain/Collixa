import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import ReviewController from '../controllers/ReviewController.js';

const router = express.Router();

router.post('/', authMiddleware, ReviewController.create);

export default router;
