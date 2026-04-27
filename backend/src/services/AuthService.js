import UserModel from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import EmailService from './EmailService.js';
import crypto from 'crypto';

export class AuthService {
  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name
   * @returns {Promise<Object>} User and JWT token
   */
  static async register(email, password, name) {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user with random avatar preset
    const AVATAR_PRESETS = [
      'Abby', 'Angel', 'Bailey', 'Caleb', 'Daisy', 
      'Ethan', 'Faith', 'Gabe', 'Hazel', 'Issac'
    ].map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
    
    const randomPreset = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];

    const userData = {
      id: crypto.randomUUID(),
      email,
      password_hash: hashedPassword,
      name,
      avatar_url: randomPreset,
      role: 'USER',
      reset_otp: otp,
      reset_otp_expiry: otpExpiry.toISOString(),
    };

    const user = await UserModel.create(userData);
    
    // Award 100 welcome credits
    try {
      const CreditService = (await import('./CreditService.js')).default;
      await CreditService.addCredits(user.id, 100, 'BONUS');
      
      // Trigger achievement check for welcome credits
      const AchievementService = (await import('./AchievementService.js')).default;
      AchievementService.checkAndAwardAchievements(user.id).catch(err => console.error('Achievement check failed:', err));
    } catch (creditErr) {
      console.warn('⚠️  Welcome credits failed:', creditErr.message);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Send OTP verification email (non-blocking — don't fail registration if email fails)
    try {
      await EmailService.sendOtpEmail(email, otp, name);
    } catch (emailErr) {
      console.warn('⚠️  OTP email failed (registration still succeeded):', emailErr.message);
    }

    // Return user (without password) and token
    const { password_hash, reset_otp, reset_otp_expiry, ...userWithoutSensitive } = user;
    return { 
      user: userWithoutSensitive, 
      token,
      // In development, always return OTP so testing works without email
      ...(process.env.NODE_ENV === 'development' && { otp: otp })
    };
  }


  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and JWT token
   */
  static async login(email, password) {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user (without password and OTP fields) and token
    const { password_hash, reset_otp, reset_otp_expiry, ...userWithoutSensitive } = user;
    
    // AWARD DAILY XP (Pulse)
    try {
      const { default: LevelService } = await import('./LevelService.js');
      LevelService.awardDailyXP(user.id).catch(err => console.error('Daily XP award failure:', err));
    } catch (err) {
      console.warn('Daily XP award skipped during login');
    }

    return { user: userWithoutSensitive, token };
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const { password_hash, ...userWithoutPassword } = user;
    
    // AWARD DAILY XP (Pulse)
    try {
      const { default: LevelService } = await import('./LevelService.js');
      LevelService.awardDailyXP(userId).catch(err => console.error('Daily XP award failure:', err));
    } catch (err) {
      console.warn('Daily XP award skipped during profile fetch');
    }

    return userWithoutPassword;
  }

  /**
   * Get public user profile (limited fields)
   * @param {string} userId - Target user ID
   * @returns {Promise<Object>} Public user data
   */
  static async getPublicProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // --- FETCH COLLABORATION STATS ---
    const client = UserModel.getClient();
    
    // 1. Total Groups (Conversations of type GROUP where user is a participant)
    const { count: groupsCount } = await client
      .from('conversation_participants')
      .select('conversation_id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 2. Total Tribes (Skills created or joined)
    const { count: tribesCreatedCount } = await client
      .from('skills')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const { count: tribesJoinedCount } = await client
      .from('skill_exchanges')
      .select('id', { count: 'exact', head: true })
      .eq('requester_id', userId)
      .eq('status', 'ACCEPTED');

    // 3. Total Intents (Intents created or joined)
    const { count: intentsCreatedCount } = await client
      .from('intents')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId);
    
    const { count: intentsJoinedCount } = await client
      .from('collaboration_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'ACCEPTED');

    // Exclude sensitive fields like email and password hash
    const { password_hash, email, reset_otp, reset_otp_expiry, ...publicData } = user;
    
    return {
      ...publicData,
      collaboration_stats: {
        total_groups: groupsCount || 0,
        total_tribes: (tribesCreatedCount || 0) + (tribesJoinedCount || 0),
        total_intents: (intentsCreatedCount || 0) + (intentsJoinedCount || 0)
      }
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update (name, avatar, bio, etc.)
   * @returns {Promise<Object>} Updated user
   */
  static async updateProfile(userId, updates) {
    console.log(`[AuthService] Updating profile for user ${userId}:`, updates);
    // Don't allow updating sensitive fields
    const allowedFields = ['name', 'avatar_url', 'bio', 'location', 'age', 'gender', 'interests', 'target_goal', 'cached_recommendations', 'recommendations_updated_at', 'cached_roadmap', 'roadmap_updated_at', 'cached_matches', 'matches_updated_at'];
    const safeUpdates = {};

    allowedFields.forEach((field) => {
      if (field in updates && updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    });

    console.log(`[AuthService] Safe updates to be applied:`, safeUpdates);
    safeUpdates.updated_at = new Date().toISOString();

    const user = await UserModel.update(userId, safeUpdates);

    // --- IDENTITY GENESIS CHECK ---
    // Award 50 Credits + 1000 XP if profile is completed for the first time
    if (!user.is_genesis_completed) {
      const bioValid = user.bio && user.bio.trim().length >= 20;
      const avatarValid = user.avatar_url && !user.avatar_url.includes('dicebear.com/7.x/avataaars'); // User replaced default
      const interestsValid = Array.isArray(user.interests) && user.interests.length >= 3;
      const coreFieldsValid = user.name && user.location && user.target_goal;

      if (bioValid && avatarValid && interestsValid && coreFieldsValid) {
        console.log(`[AuthService] User ${userId} completed Identity Genesis! Awarding rewards.`);
        
        // Award Credits
        const CreditService = (await import('./CreditService.js')).default;
        await CreditService.addCredits(userId, 50, 'ACHIEVEMENT');

        // Award XP (Hitting Level 2 instantly)
        const LevelService = (await import('./LevelService.js')).default;
        await LevelService.awardXP(userId, 1000, 'Identity Genesis');

        // Mark as completed
        await UserModel.update(userId, { is_genesis_completed: true });
        
        // Refresh user object for return
        const updatedUser = await UserModel.findById(userId);
        const { password_hash, ...userFinal } = updatedUser;
        return userFinal;
      }
    }
    
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if successful
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      throw error;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    await UserModel.update(userId, {
      password_hash: hashedPassword,
      updated_at: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Request password reset (creates OTP)
   * @param {string} email - User email
   * @returns {Promise<Object>} OTP (in development only)
   */
  static async requestPasswordReset(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await UserModel.update(user.id, {
      reset_otp: otp,
      reset_otp_expiry: otpExpiry.toISOString(),
    });

    // Send password reset email
    await EmailService.sendPasswordResetEmail(email, otp, user.name);

    // In production, return confirmation only. In development, also return OTP for testing.
    return { 
      message: 'OTP sent to email',
      ...(process.env.NODE_ENV === 'development' && { otp })
    };
  }

  /**
   * Verify OTP and reset password
   * @param {string} email - User email
   * @param {string} otp - OTP from email
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if successful
   */
  static async resetPassword(email, otp, newPassword) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify OTP
    if (user.reset_otp !== otp) {
      const error = new Error('Invalid OTP');
      error.statusCode = 400;
      throw error;
    }

    const expiryStr = user.reset_otp_expiry.endsWith('Z') ? user.reset_otp_expiry : user.reset_otp_expiry + 'Z';
    if (new Date() > new Date(expiryStr)) {
      const error = new Error('OTP expired');
      error.statusCode = 400;
      throw error;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear OTP
    await UserModel.update(user.id, {
      password_hash: hashedPassword,
      reset_otp: null,
      reset_otp_expiry: null,
      updated_at: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Verify account using OTP
   * @param {string} email - User email
   * @param {string} otp - OTP from email
   * @returns {Promise<boolean>} True if successful
   */
  static async verifyAccount(email, otp) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'VERIFIED_USER' || user.role === 'ADMIN') {
      const error = new Error('User is already verified');
      error.statusCode = 400;
      throw error;
    }

    // Verify OTP
    if (!user.reset_otp || user.reset_otp !== otp) {
      const error = new Error('Invalid OTP');
      error.statusCode = 400;
      throw error;
    }

    const expiryStr = user.reset_otp_expiry.endsWith('Z') ? user.reset_otp_expiry : user.reset_otp_expiry + 'Z';
    if (new Date() > new Date(expiryStr)) {
      const error = new Error('OTP expired');
      error.statusCode = 400;
      throw error;
    }

    // Update user role to VERIFIED_USER and clear OTP
    await UserModel.update(user.id, {
      role: 'VERIFIED_USER',
      reset_otp: null,
      reset_otp_expiry: null,
      updated_at: new Date().toISOString(),
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(email, user.name);

    return true;
  }

  /**
   * Google login (placeholder implementation)
   * @param {Object} googleProfile - Structured google profile { email, name, avatar_url }
   * @returns {Promise<Object>} User and JWT token
   */
  static async googleLogin(googleProfile) {
    const { email, name, avatar_url } = googleProfile;
    
    if (!email) {
      const error = new Error('Email is required from Google profile');
      error.statusCode = 400;
      throw error;
    }

    let user = await UserModel.findByEmail(email);

    if (!user) {
      // Create new user directly as verified
      const rawPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(rawPassword);
      
      const userData = {
        id: crypto.randomUUID(),
        email,
        name: name || email.split('@')[0],
        avatar_url: avatar_url || null,
        password_hash: hashedPassword,
        role: 'VERIFIED_USER',
      };
      user = await UserModel.create(userData);
      
      // Award 100 welcome credits
      try {
        const CreditService = (await import('./CreditService.js')).default;
        await CreditService.addCredits(user.id, 100, 'BONUS');
        
        // Trigger achievement check for welcome credits
        const AchievementService = (await import('./AchievementService.js')).default;
        AchievementService.checkAndAwardAchievements(user.id).catch(err => console.error('Achievement check failed:', err));
      } catch (creditErr) {
        console.warn('⚠️  Welcome credits failed:', creditErr.message);
      }
    } else if (user.role === 'USER') {
      // Since Google verified the email, bump them to verified
      user = await UserModel.update(user.id, {
         role: 'VERIFIED_USER',
         updated_at: new Date().toISOString(),
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  /**
   * Resend OTP to user email
   * @param {string} email - User email
   * @returns {Promise<Object>} OTP (in development only)
   */
  static async resendOtp(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'USER') {
      const error = new Error('User is already verified or account is inactive');
      error.statusCode = 400;
      throw error;
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await UserModel.update(user.id, {
      reset_otp: otp,
      reset_otp_expiry: otpExpiry.toISOString(),
    });

    // Send OTP email
    await EmailService.sendOtpEmail(email, otp, user.name);

    // In production, return confirmation only. In development, also return OTP for testing.
    return { 
      message: 'OTP resent to email',
      ...(process.env.NODE_ENV === 'development' && { otp })
    };
  }
  /**
   * Check if user exists by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object or null
   */
  static async checkEmail(email) {
    return await UserModel.findByEmail(email);
  }
}

export default AuthService;
