import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');

const pendingRecruiters = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
  }),
});

const recruiterAction = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid recruiter ID format',
      'any.required': 'Recruiter ID is required',
    }),
  }),
});

const users = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('job_seeker', 'recruiter', 'admin'),
    search: Joi.string().trim().max(100),
  }),
});

export { pendingRecruiters, recruiterAction, users };
