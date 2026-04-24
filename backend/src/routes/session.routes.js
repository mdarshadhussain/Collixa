import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import SessionController from '../controllers/SessionController.js';

const router = express.Router();

router.post('/', authMiddleware, SessionController.schedule);
router.get('/', authMiddleware, SessionController.getMySessions);
router.patch('/:id/complete', authMiddleware, SessionController.complete);
router.post('/recurring/complete', authMiddleware, SessionController.completeRecurring);

export default router;
