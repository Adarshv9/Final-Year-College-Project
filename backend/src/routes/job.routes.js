// Express routes for public job discovery and recruiter job management.
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

router.get('/', optionalAuthenticateJWT, validate(jobValidation.listJobs), jobController.getJobs);

router.get(
  '/recommended',
  authenticateJWT,
  authorizeRole('job_seeker'),
  validate(jobValidation.recommendedJobs),
  jobController.getRecommendedJobs
);

router.get(
  '/my',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(jobValidation.getMyJobs),
  jobController.getMyJobs
);

router.get('/:jobId', validate(jobValidation.getJob), jobController.getJob);

router.post(
  '/',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(jobValidation.createJob),
  jobController.createJob
);

router.patch(
  '/:jobId',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(jobValidation.updateJob),
  jobController.updateJob
);

router.delete(
  '/:jobId',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(jobValidation.deleteJob),
  jobController.deleteJob
);

export default router;
