// Registers API routes for resume features.

import express from 'express';
import * as resumeController from '../controllers/resume.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import { uploadResume as uploadResumeMiddleware, validatePdfSignature } from '../middlewares/upload.js';
import validate from '../middlewares/validate.js';
import * as resumeValidation from '../validations/resume.validation.js';

const router = express.Router();



router.put(
  '/resume',
  authenticateJWT,
  uploadResumeMiddleware,
  validatePdfSignature,
  resumeController.uploadResume
);


router.post(
  '/resume/manual',
  authenticateJWT,
  validate(resumeValidation.manualResume),
  resumeController.manualResume
);


router.get('/resume', authenticateJWT, resumeController.getResume);


router.get('/resume/download', authenticateJWT, resumeController.downloadResume);


router.patch(
  '/resume',
  authenticateJWT,
  validate(resumeValidation.updateResume),
  resumeController.updateResume
);


router.delete('/resume', authenticateJWT, resumeController.deleteResume);



router.get(
  '/resumes',
  authenticateJWT,
  authorizeRole('admin'),
  validate(resumeValidation.getAllResumes),
  resumeController.getAllResumes
);


router.patch(
  '/resumes/:resumeId/verify',
  authenticateJWT,
  authorizeRole('admin'),
  validate(resumeValidation.verifyResume),
  resumeController.verifyResume
);

export default router;