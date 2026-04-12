import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn = config.JWT_EXPIRY) => {
  try {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
  } catch (error) {
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
};
