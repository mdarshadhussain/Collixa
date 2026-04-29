import UserModel from '../models/User.js';

// Admin emails configuration
const ADMIN_EMAILS = ['admin@collixa.space'];

/**
 * Middleware to check if user is admin (by email)
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user email is in admin list or has admin role
    const userEmail = req.user.email?.toLowerCase();
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail) || req.user.role === 'ADMIN';

    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    // Add admin flag to request
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default adminMiddleware;
