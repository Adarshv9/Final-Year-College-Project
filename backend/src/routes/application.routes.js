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
  '/job/:jobId',
  authenticateJWT,
  authorizeRole('recruiter', 'admin'),
  checkRecruiterVerified,
  validate(applicationValidation.jobApplications),
  applicationController.getApplicationsForJob
);

router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRole('recruiter', 'admin'),
  checkRecruiterVerified,
  validate(applicationValidation.updateApplicationStatus),
  applicationController.updateApplicationStatus
);

export default router;
