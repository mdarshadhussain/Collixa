import { supabase } from '../config/database.js';
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
      // Use Supabase to verify the token and get user auth data
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        return res.status(401).json({ error: authError?.message || 'Invalid session' });
      }
      
      // Fetch fresh user profile from public.users
      const profile = await UserModel.findById(authUser.id);
      if (!profile) {
        return res.status(401).json({ error: 'User profile does not exist' });
      }

      // Attach to req.user
      req.user = profile;
      
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
