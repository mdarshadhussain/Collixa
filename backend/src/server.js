import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import intentRoutes from './routes/intent.routes.js';
import initializeDatabase from './utils/initDatabase.js';

const app = express();

/**
 * Middleware
 */

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/intents', intentRoutes);

/**
 * Error handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start server
 */
const PORT = config.PORT;

// Initialize database on startup
initializeDatabase();

app.listen(PORT, () => {
  console.log(`\n✨ Server running on http://localhost:${PORT}`);
  console.log(`📝 Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`🔐 JWT Secret: ${config.JWT_SECRET.substring(0, 10)}...`);
  console.log('\n[AUTH ROUTES]');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/verify (protected)');
  console.log('  GET    /api/auth/profile (protected)');
  console.log('  PUT    /api/auth/profile (protected)');
  console.log('  POST   /api/auth/change-password (protected)');
  console.log('  POST   /api/auth/forgot-password');
  console.log('  POST   /api/auth/reset-password');
  console.log('  POST   /api/auth/logout (protected)');
  console.log('\n[INTENT ROUTES]');
  console.log('  POST   /api/intents (protected)');
  console.log('  GET    /api/intents');
  console.log('  GET    /api/intents/:id');
  console.log('  GET    /api/intents/search/:keyword');
  console.log('  GET    /api/intents/filter');
  console.log('  GET    /api/intents/user/my-intents (protected)');
  console.log('  PATCH  /api/intents/:id (protected)');
  console.log('  PATCH  /api/intents/:id/complete (protected)');
  console.log('  DELETE /api/intents/:id (protected)');
  console.log('  POST   /api/intents/:id/request (protected)');
  console.log('  GET    /api/intents/:id/requests (protected)');
  console.log('  PATCH  /api/requests/:requestId/accept (protected)');
  console.log('  PATCH  /api/requests/:requestId/reject (protected)\n');
});

export default app;
