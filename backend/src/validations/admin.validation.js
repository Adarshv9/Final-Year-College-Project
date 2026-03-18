// ── Admin Validation Schemas ──
import Joi from 'joi';

// Reusable MongoDB ObjectId pattern validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');

// Get pending recruiters validation
const pendingRecruiters = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
  }),
});

// Recruiter action (verify/reject) validation
const recruiterAction = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid recruiter ID format',
      'any.required': 'Recruiter ID is required',
    }),
  }),
});

// Get all users validation
const users = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('job_seeker', 'recruiter', 'admin'),
    search: Joi.string().trim().max(100),
  }),
});

export { pendingRecruiters, recruiterAction, users };
