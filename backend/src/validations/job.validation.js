// ── Job Validation Schemas ──
import Joi from 'joi';

// Reusable MongoDB ObjectId pattern validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');

// Salary range validation
const salaryRange = Joi.object({
  min: Joi.number().min(0),
  max: Joi.number().min(0),
}).custom((value, helpers) => {
  if (
    value.min !== undefined &&
    value.max !== undefined &&
    value.max < value.min
  ) {
    return helpers.error('any.invalid');
  }

  return value;
}, 'salary validation').messages({
  'any.invalid': 'Salary max must be greater than or equal to salary min',
});

// Create job validation
const createJob = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    requiredSkills: Joi.array().items(Joi.string().trim()).default([]),
    location: Joi.string().trim().required(),
    experienceRequired: Joi.number().min(0).required(),
    salaryRange,
  }),
});

// Update job validation
const updateJob = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }),
  body: Joi.object({
    title: Joi.string().trim(),
    description: Joi.string().trim(),
    requiredSkills: Joi.array().items(Joi.string().trim()),
    location: Joi.string().trim(),
    experienceRequired: Joi.number().min(0),
    salaryRange,
    isActive: Joi.boolean(),
  }).min(1),
});

const getJob = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }),
});
// Get single job validation// Delete job validation
const deleteJob = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }),
});

// List jobs with filters validation
const listJobs = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
    location: Joi.string().trim().max(100),
    skill: Joi.string().trim().max(100),
  }),
});

export { createJob, updateJob, getJob, deleteJob, listJobs };
