// ── Job Routes ──
import express from 'express';
import * as jobController from '../controllers/job.controller.js';
import {
  authenticateJWT,
  authorizeRole,
  checkRecruiterVerified,
  optionalAuthenticateJWT,
} from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import * as jobValidation from '../validations/job.validation.js';

const router = express.Router();

// Public endpoints - No authentication required
router.get('/', optionalAuthenticateJWT, validate(jobValidation.listJobs), jobController.getJobs);
router.get('/:id', optionalAuthenticateJWT, validate(jobValidation.getJob), jobController.getJob);

// Protected endpoints - Recruiter/Admin only

router.post(
  '/',
  authenticateJWT,
  authorizeRole('recruiter', 'admin'),
  checkRecruiterVerified,
  validate(jobValidation.createJob),
  jobController.createJob
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRole('recruiter', 'admin'),
  checkRecruiterVerified,
  validate(jobValidation.updateJob),
  jobController.updateJob
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRole('recruiter', 'admin'),
  checkRecruiterVerified,
  validate(jobValidation.deleteJob),
  jobController.deleteJob
);

export default router;
