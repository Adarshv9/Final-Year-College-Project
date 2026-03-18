// ── Job Application Validation Schemas ──
import Joi from 'joi';

// Reusable MongoDB ObjectId pattern validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');

// Create application validation
const createApplication = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.name': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }),
});

// Fetch user's applications validation
const myApplications = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('applied', 'shortlisted', 'rejected'),
  }),
});

// Fetch job applications validation
const jobApplications = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.name': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('applied', 'shortlisted', 'rejected'),
  }),
});

// Update application status validation
const updateApplicationStatus = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid application ID format',
      'any.required': 'Application ID is required',
    }),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid('applied', 'shortlisted', 'rejected')
      .required()
      .messages({
        'any.only': 'Status must be applied, shortlisted, or rejected',
        'any.required': 'Status is required',
      }),
  }),
});

export {
  createApplication,
  myApplications,
  jobApplications,
  updateApplicationStatus,
};
