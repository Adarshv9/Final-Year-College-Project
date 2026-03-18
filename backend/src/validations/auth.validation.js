// ── Authentication Validation Schemas ──
import Joi from 'joi';

// Registration validation schema
const register = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 50 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('job_seeker', 'recruiter').default('job_seeker').messages({
      'any.only': 'Role must be either job_seeker or recruiter',
    }),
  }),
});

// Login validation schema
const login = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
});

// Refresh token validation schema
const refreshToken = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),
});

export { register, login, refreshToken };
