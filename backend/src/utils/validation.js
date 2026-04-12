import Joi from 'joi';

/**
 * Validate intent data
 * @param {Object} data - Intent data to validate
 * @returns {Object} { error, value }
 */
export const validateIntentData = (data) => {
  const schema = Joi.object({
    title: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title must not exceed 100 characters',
      }),
    description: Joi.string()
      .trim()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description must not exceed 1000 characters',
      }),
    category: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Category is required',
      }),
    location: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Location is required',
      }),
    timeline: Joi.string()
      .isoDate()
      .required()
      .messages({
        'string.empty': 'Timeline is required',
        'string.isoDate': 'Timeline must be a valid ISO8601 date',
      }),
    attachment_name: Joi.string()
      .trim()
      .max(255)
      .optional()
      .messages({
        'string.max': 'Attachment name must not exceed 255 characters',
      }),
    status: Joi.string()
      .valid('looking', 'completed')
      .optional(),
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate user data
 * @param {Object} data - User data to validate
 * @returns {Object} { error, value }
 */
export const validateUserData = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Invalid email address',
        'string.empty': 'Email is required',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.empty': 'Password is required',
      }),
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 100 characters',
        'string.empty': 'Name is required',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate collaboration request
 * @param {Object} data - Request data
 * @returns {Object} { error, value }
 */
export const validateCollaborationRequest = (data) => {
  const schema = Joi.object({
    intent_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Invalid intent ID',
        'string.empty': 'Intent ID is required',
      }),
    user_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Invalid user ID',
        'string.empty': 'User ID is required',
      }),
    message: Joi.string()
      .trim()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Message must not exceed 500 characters',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validateIntentData,
  validateUserData,
  validateCollaborationRequest,
};
