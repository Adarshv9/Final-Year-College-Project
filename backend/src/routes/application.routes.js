// Express routes for job seeker applications and recruiter-side review actions.
import express from 'express';
import * as applicationController from '../controllers/application.controller.js';
import {
  authenticateJWT,
  authorizeRole,
  checkRecruiterVerified,
} from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import * as applicationValidation from '../validations/application.validation.js';

const router = express.Router();

router.post(
  '/:jobId',
  authenticateJWT,
  authorizeRole('job_seeker'),
  validate(applicationValidation.createApplication),
  applicationController.createApplication
);

router.get(
  '/my',
  authenticateJWT,
  authorizeRole('job_seeker'),
  validate(applicationValidation.myApplications),
  applicationController.getMyApplications
);

router.get(
  '/job/:jobId/recommended',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(applicationValidation.recommendedApplications),
  applicationController.getRecommendedApplications
);

router.get(
  '/job/:jobId',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(applicationValidation.jobApplications),
  applicationController.getApplicationsForJob
);

router.patch(
  '/:applicationId/status',
  authenticateJWT,
  authorizeRole('recruiter'),
  checkRecruiterVerified,
  validate(applicationValidation.updateApplicationStatus),
  applicationController.updateApplicationStatus
);

export default router;
