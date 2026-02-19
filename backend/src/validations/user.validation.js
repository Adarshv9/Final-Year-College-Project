import Joi from 'joi';

// Reusable ObjectId pattern
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');

const getUser = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
  }),
});

const updateUser = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 50 characters',
    }),
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email address',
    }),
    role: Joi.string().valid('user', 'admin').messages({
      'any.only': 'Role must be either user or admin',
    }),
    isActive: Joi.boolean(),
  }).min(1), // at least one field must be provided
});

const deleteUser = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
  }),
});

const listUsers = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('user', 'admin'),
    search: Joi.string().trim().max(100),
  }),
});

export { getUser, updateUser, deleteUser, listUsers };
