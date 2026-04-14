import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import CreditController from '../controllers/CreditController.js';

const router = express.Router();

router.get('/', authMiddleware, CreditController.getMyTransactions);
router.post('/checkout', authMiddleware, CreditController.createCheckoutSession);
router.post('/simulate-success', authMiddleware, CreditController.simulateSuccess);

// Webhook must be public because Stripe calls it, but controller handles signature verification
// Note: This needs express.raw() in server.js to work correctly
router.post('/webhook', CreditController.handleWebhook);

export default router;
