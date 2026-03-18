// ── Job Seeker Routes ──
import express from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import { uploadResume } from '../middlewares/upload.js';
import validate from '../middlewares/validate.js';
import * as profileValidation from '../validations/profile.validation.js';

const router = express.Router();

// All job seeker routes require job_seeker role
router.use(authenticateJWT, authorizeRole('job_seeker'));

// Profile management
router.post('/profile', validate(profileValidation.createJobSeekerProfile), profileController.createJobSeekerProfile);
router.get('/profile', profileController.getJobSeekerProfile);
router.put('/profile', validate(profileValidation.updateJobSeekerProfile), profileController.updateJobSeekerProfile);

// Resume upload
router.post('/upload-resume', uploadResume, profileController.uploadResume);

export default router;
