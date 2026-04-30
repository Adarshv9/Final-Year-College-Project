// Defines Joi validation rules for job requests.

import Joi from 'joi';

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const locationSchema = Joi.object({
  type: Joi.string().valid('remote', 'onsite', 'hybrid').required(),
  city: Joi.string().trim().allow(null, ''),
  country: Joi.string().trim().allow(null, '')
}).required();

const createJobBody = Joi.object({
  title: Joi.string().trim().required(),
  companyName: Joi.string().trim().required(),
  location: locationSchema,
  description: Joi.string().trim().required(),
  requiredSkills: Joi.array().items(Joi.string().trim()).default([]),
  minExperience: Joi.number().integer().min(0).required(),
  jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract').required(),
  salary: Joi.string().trim().allow('').required()
});

const updateJobBody = Joi.object({
  title: Joi.string().trim(),
  companyName: Joi.string().trim(),
  location: locationSchema,
  description: Joi.string().trim(),
  requiredSkills: Joi.array().items(Joi.string().trim()),
  minExperience: Joi.number().integer().min(0),
  jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract'),
  salary: Joi.string().trim().allow('')
}).min(1);

export const createJob = Joi.object({
  body: createJobBody.required()
});

export const getMyJobs = Joi.object({});

export const recommendedJobs = Joi.object({});

export const getJob = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required'
    })
  }).required()
});

export const atsScore = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required'
    })
  }).required()
});

export const updateJob = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required'
    })
  }).required(),
  body: updateJobBody.required()
});

export const deleteJob = Joi.object({
  params: Joi.object({
    jobId: objectId.required().messages({
      'string.pattern.base': 'Invalid job ID format',
      'any.required': 'Job ID is required'
    })
  }).required()
});

export const listJobs = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).allow(''),
    skill: Joi.string().trim().max(100).allow(''),
    location: Joi.string().trim().max(100).allow(''),

    locationType: Joi.string().valid('remote', 'onsite', 'hybrid').empty('').optional(),
    jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract').empty('').optional(),
    minExperience: Joi.number().integer().min(0)
  }).allow({})
});