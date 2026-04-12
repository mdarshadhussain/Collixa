import AuthService from '../services/AuthService.js';

/**
 * Authentication Controller
 * Handles HTTP requests and responses
 */
export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      const result = await AuthService.register(email, password, name);

      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify account using OTP
   * POST /api/auth/verify-account
   */
  static async verifyAccount(req, res, next) {
    try {
      const { email, otp } = req.body;

      await AuthService.verifyAccount(email, otp);

      res.status(200).json({
        message: 'Account verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google login
   * POST /api/auth/google
   */
  static async googleLogin(req, res, next) {
    try {
      // Expecting { email, name, avatar_url, google_id } from frontend after Google verification
      const googleProfile = req.body;

      const result = await AuthService.googleLogin(googleProfile);

      res.status(200).json({
        message: 'Google login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await AuthService.getProfile(userId);

      res.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, bio, location, avatar_url } = req.body;

      const user = await AuthService.updateProfile(userId, {
        name,
        bio,
        location,
        avatar_url,
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset (send OTP)
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await AuthService.requestPasswordReset(email);

      res.status(200).json({
        message: 'OTP sent to email',
        // In development only, remove in production
        ...(process.env.NODE_ENV === 'development' && { otp: result.otp }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with OTP
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      await AuthService.resetPassword(email, otp, newPassword);

      res.status(200).json({
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token
   * GET /api/auth/verify
   */
  static async verifyToken(req, res, next) {
    try {
      const user = req.user;

      res.status(200).json({
        message: 'Token is valid',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout (client-side token deletion)
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      // JWT logout is stateless - just delete token on client
      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend OTP
   * POST /api/auth/resend-otp
   */
  static async resendOtp(req, res, next) {
    try {
      const { email } = req.body;

      const result = await AuthService.resendOtp(email);

      res.status(200).json({
        message: 'OTP resent to email',
        // In development only, remove in production
        ...(process.env.NODE_ENV === 'development' && { otp: result.otp }),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
