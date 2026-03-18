// ── Recruiter Routes ──
import express from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import * as profileValidation from '../validations/profile.validation.js';

const router = express.Router();

// All recruiter routes require recruiter role
router.use(authenticateJWT, authorizeRole('recruiter'));

// Profile management
router.post('/profile', validate(profileValidation.createRecruiterProfile), profileController.createRecruiterProfile);
router.get('/profile', profileController.getRecruiterProfile);
router.put('/profile', validate(profileValidation.updateRecruiterProfile), profileController.updateRecruiterProfile);

export default router;
