// ── Resume Validation Schemas ──
import Joi from 'joi';

// Shared schemas for partial updates
const skillSchema = Joi.string().trim().min(1);
const experienceSchema = Joi.object({
  company: Joi.string().trim().allow(''),
  role: Joi.string().trim().allow(''),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
});
const educationSchema = Joi.object({
  degree: Joi.string().trim().allow(''),
  institution: Joi.string().trim().allow(''),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()),
});
const projectSchema = Joi.object({
  title: Joi.string().trim().allow(''),
  description: Joi.string().trim().allow(''),
});

const partialResumeBody = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().trim(),
  location: Joi.string().trim(),
  summary: Joi.string().trim(),
  skills: Joi.array().items(skillSchema).unique(),
  experiences: Joi.array().items(experienceSchema),
  education: Joi.array().items(educationSchema),
  projects: Joi.array().items(projectSchema),
  experienceYears: Joi.number().min(0),
}).min(1);

// Partial update for job seeker (PATCH /resume)
export const updateResume = Joi.object({
  body: partialResumeBody.required(),
});

// Manual creation / update (POST /resume/manual)
export const manualResume = Joi.object({
  body: partialResumeBody.keys({
    education: Joi.alternatives(
      Joi.array().items(educationSchema),
      educationSchema
    ),
  }).required(),
});

// Verify resume validation (for admin endpoints)
export const verifyResume = Joi.object({
  body: Joi.object({
    isVerified: Joi.boolean().required(),
  }).required(),
});

// Get all resumes query validation (for admin endpoints)
export const getAllResumes = Joi.object({
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
    search: Joi.string().trim().allow('').default(''),
  }).allow({}),
});
