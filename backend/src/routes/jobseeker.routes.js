// Registers API routes for jobseeker features.

import express from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import { uploadResume } from '../middlewares/upload.js';
import validate from '../middlewares/validate.js';
import * as profileValidation from '../validations/profile.validation.js';

const router = express.Router();


router.use(authenticateJWT, authorizeRole('job_seeker'));


router.post('/profile', validate(profileValidation.createJobSeekerProfile), profileController.createJobSeekerProfile);
router.get('/profile', profileController.getJobSeekerProfile);
router.put('/profile', validate(profileValidation.updateJobSeekerProfile), profileController.updateJobSeekerProfile);


router.post('/upload-resume', uploadResume, profileController.uploadResume);

export default router;