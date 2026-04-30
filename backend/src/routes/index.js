// Mounts the main API route modules.

import express from 'express';

import adminRoutes from './admin.routes.js';
import applicationRoutes from './application.routes.js';
import authRoutes from './auth.routes.js';
import jobRoutes from './job.routes.js';
import jobSeekerRoutes from './jobseeker.routes.js';
import recruiterRoutes from './recruiter.routes.js';
import resumeRoutes from './resume.routes.js';
import userRoutes from './user.routes.js';

const router = express.Router();


router.use('/auth', authRoutes);
router.use('/jobseeker', jobSeekerRoutes);
router.use('/recruiter', recruiterRoutes);
router.use('/admin', adminRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/resumes', resumeRoutes);
router.use('/users', userRoutes);

export default router;