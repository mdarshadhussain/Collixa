import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  verifyAccountValidation,
  googleLoginValidation,
  validate,
} from '../middlewares/validation.js';

const router = express.Router();

/**
 * Public routes
 */

// Register new user
router.post('/register', registerValidation, validate, AuthController.register);

// Login user
router.post('/login', loginValidation, validate, AuthController.login);

// Check if user exists
router.post('/check-email', AuthController.checkEmail);

// Request password reset (OTP)
router.post('/forgot-password', AuthController.forgotPassword);

// Reset password with OTP
router.post('/reset-password', resetPasswordValidation, validate, AuthController.resetPassword);

// Verify account with OTP
router.post('/verify-account', verifyAccountValidation, validate, AuthController.verifyAccount);

// Resend OTP
router.post('/resend-otp', AuthController.resendOtp);

// Google login
router.post('/google', googleLoginValidation, validate, AuthController.googleLogin);

/**
 * Protected routes (require authentication)
 */

// Verify token
router.get('/verify', authMiddleware, AuthController.verifyToken);

// Get user profile
router.get('/profile', authMiddleware, AuthController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, updateProfileValidation, validate, AuthController.updateProfile);

// Change password
router.post('/change-password', authMiddleware, changePasswordValidation, validate, AuthController.changePassword);

// Logout
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
