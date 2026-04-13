import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import CreditController from '../controllers/CreditController.js';

const router = express.Router();

router.get('/', authMiddleware, CreditController.getMyTransactions);

export default router;
