// Joi schemas for applying to jobs and recruiter application review endpoints.
import Joi from 'joi';

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

export const createApplication = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }).required(),
  body: Joi.object({
    message: Joi.string().trim().allow('').default(''),
  }).required(),
});

export const myApplications = Joi.object({});

export const jobApplications = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }).required(),
});

export const recommendedApplications = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required',
    }),
  }).required(),
});

export const updateApplicationStatus = Joi.object({
  params: Joi.object({
    applicationId: objectId.required().messages({
      'string.pattern.base': 'Invalid application ID format',
      'any.required': 'Application ID is required',
    }),
  }).required(),
  body: Joi.object({
    status: Joi.string().valid('accepted', 'rejected').required().messages({
      'any.only': 'Status must be accepted or rejected',
      'any.required': 'Status is required',
    }),
  }).required(),
});
