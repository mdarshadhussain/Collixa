import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import intentRoutes from './routes/intent.routes.js';
import skillRoutes from './routes/skill.routes.js';
import storageRoutes from './routes/storageRoutes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from './routes/chat.routes.js';
import sessionRoutes from './routes/session.routes.js';
import reviewRoutes from './routes/review.routes.js';
import creditRoutes from './routes/credit.routes.js';
import adminRoutes from './routes/admin.routes.js';
import initializeDatabase from './utils/initDatabase.js';

const app = express();

/**
 * Middleware
 */

// Security headers
app.use(helmet());

// CORS — allow multiple local origins in development
const allowedOrigins = [
  config.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/api/credits/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (config.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path} — Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

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
app.use('/api/skills', skillRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);

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
