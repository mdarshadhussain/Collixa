import { body, validationResult } from 'express-validator';

/**
 * Validate request and return middleware to handle errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.array = () => errors.array();
    return next(error);
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for password change
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

/**
 * Validation rules for password reset
 */
export const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

/**
 * Validation rules for profile update
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
];

/**
 * Validation rules for account verification
 */
export const verifyAccountValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
];

/**
 * Validation rules for Google login
 */
export const googleLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email from Google profile is required'),
];

export default {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  verifyAccountValidation,
  googleLoginValidation,
};
