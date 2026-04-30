// Defines Joi validation rules for user requests.

import Joi from 'joi';


const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');


const getUser = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
  })
});


const updateUser = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 50 characters'
    }),
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email address'
    }),
    role: Joi.string().valid('job_seeker', 'recruiter', 'admin').messages({
      'any.only': 'Role must be one of job_seeker, recruiter, or admin'
    }),
    isVerified: Joi.boolean(),
    isActive: Joi.boolean()
  }).min(1)
});


const updateMe = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50),
    email: Joi.string().email(),
    phone: Joi.string().trim().max(30).allow(''),
    location: Joi.string().trim().max(80).allow(''),
    role: Joi.string().valid('job_seeker', 'recruiter')
  }).min(1)
});


const deleteUser = Joi.object({
  params: Joi.object({
    id: objectId.required().messages({
      'string.pattern.name': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
  })
});


const listUsers = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('job_seeker', 'recruiter', 'admin'),
    search: Joi.string().trim().max(100)
  })
});


const changePassword = Joi.object({
  body: Joi.object({
    oldPassword: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).max(128).required().messages({
      'string.min': 'New password must be at least 6 characters',
      'string.max': 'New password must be at most 128 characters',
      'any.required': 'New password is required'
    })
  })
});

export { getUser, updateUser, updateMe, deleteUser, listUsers, changePassword };