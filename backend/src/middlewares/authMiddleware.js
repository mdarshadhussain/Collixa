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

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // Validate JWT structure
    const segments = token.split('.');
    if (segments.length !== 3) {
      return res.status(401).json({ error: 'Invalid JWT format' });
    }

    try {
      // Use Supabase to verify the token and get user auth data
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('[AuthMiddleware] Supabase token verification failed:', authError?.message);
        return res.status(401).json({ error: authError?.message || 'Invalid session' });
      }
      
      console.log(`[AuthMiddleware] Supabase authenticated user: ${authUser.email} (${authUser.id})`);
      
      // Fetch fresh user profile from public.users
      const profile = await UserModel.findById(authUser.id);
      if (!profile) {
        console.warn(`[AuthMiddleware] User profile for ID ${authUser.id} not found in database.`);
        return res.status(401).json({ error: 'User profile does not exist' });
      }

      console.log(`[AuthMiddleware] Loaded profile for: ${profile.email}`);

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

/**
 * Optional auth middleware — extracts user if token is present, but does NOT block if missing.
 * Use this on public routes where knowing the current user is helpful but not required.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    if (!token || token === 'null' || token === 'undefined') {
      req.user = null;
      return next();
    }

    // Validate JWT structure
    const segments = token.split('.');
    if (segments.length !== 3) {
      req.user = null;
      return next();
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      req.user = null;
      return next();
    }

    const profile = await UserModel.findById(authUser.id);
    req.user = profile || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};
