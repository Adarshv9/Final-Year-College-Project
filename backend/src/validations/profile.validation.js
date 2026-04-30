// Defines Joi validation rules for profile requests.

import Joi from 'joi';


const experienceItem = Joi.object({
  company: Joi.string().trim().required(),
  role: Joi.string().trim().required(),
  years: Joi.number().min(0).required()
});


const educationItem = Joi.object({
  degree: Joi.string().trim().required(),
  institution: Joi.string().trim().required(),
  year: Joi.number().integer().min(1900).required()
});


const createJobSeekerProfile = Joi.object({
  body: Joi.object({
    headline: Joi.string().trim().max(150),
    skills: Joi.array().items(Joi.string().trim()).default([]),
    experience: Joi.array().items(experienceItem).default([]),
    education: Joi.array().items(educationItem).default([]),
    resumeUrl: Joi.string().uri(),
    parsedData: Joi.object()
  }).min(1)
});


const updateJobSeekerProfile = Joi.object({
  body: Joi.object({
    headline: Joi.string().trim().max(150),
    skills: Joi.array().items(Joi.string().trim()),
    experience: Joi.array().items(experienceItem),
    education: Joi.array().items(educationItem),
    resumeUrl: Joi.string().uri(),
    parsedData: Joi.object()
  }).min(1)
});


const createRecruiterProfile = Joi.object({
  body: Joi.object({
    companyName: Joi.string().trim().required(),
    companyWebsite: Joi.string().uri().allow(''),
    companySize: Joi.string().trim().allow(''),
    companyDescription: Joi.string().trim().allow('')
  })
});


const updateRecruiterProfile = Joi.object({
  body: Joi.object({
    companyName: Joi.string().trim(),
    companyWebsite: Joi.string().uri().allow(''),
    companySize: Joi.string().trim().allow(''),
    companyDescription: Joi.string().trim().allow('')
  }).min(1)
});

export {
  createJobSeekerProfile,
  updateJobSeekerProfile,
  createRecruiterProfile,
  updateRecruiterProfile };