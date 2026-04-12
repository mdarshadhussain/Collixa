import { verifyToken } from '../utils/jwt.js';
import UserModel from '../models/User.js';

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = verifyToken(token);
      
      // Fetch fresh user from database
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User does not exist or was deleted' });
      }

      // Exclude password_hash and attach to req.user
      const { password_hash, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      
      next();
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...string} allowedRoles - Allowed user roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is verified
 */
export const verifiedMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (req.user.role !== 'VERIFIED_USER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'User is not verified' });
  }

  next();
};

export default {
  authMiddleware,
  authorizeRoles,
  verifiedMiddleware,
};
