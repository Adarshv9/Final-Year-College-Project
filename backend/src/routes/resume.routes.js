// ── Resume Routes ──
import express from 'express';
import * as resumeController from '../controllers/resume.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import { uploadResume as uploadResumeMiddleware } from '../middlewares/upload.js';
import validate from '../middlewares/validate.js';
import * as resumeValidation from '../validations/resume.validation.js';

const router = express.Router();

// ── Job Seeker Routes ──
// PUT /resume — Upload and parse resume (job seekers only)
router.put(
  '/resume',
  authenticateJWT,
  uploadResumeMiddleware,
  resumeController.uploadResume
);

// POST /resume/manual — Manual create/update (job seekers only)
router.post(
  '/resume/manual',
  authenticateJWT,
  validate(resumeValidation.manualResume),
  resumeController.manualResume
);

// GET /resume — Get current user's resume (job seekers only)
router.get('/resume', authenticateJWT, resumeController.getResume);

// PATCH /resume — Partial update for current user's resume (job seekers only)
router.patch(
  '/resume',
  authenticateJWT,
  validate(resumeValidation.updateResume),
  resumeController.updateResume
);

// DELETE /resume — Delete current user's resume (job seekers only)
router.delete('/resume', authenticateJWT, resumeController.deleteResume);

// ── Admin Routes ──
// GET /resumes — Get all resumes (admin only)
router.get(
  '/resumes',
  authenticateJWT,
  authorizeRole('admin'),
  validate(resumeValidation.getAllResumes),
  resumeController.getAllResumes
);

// PATCH /resumes/:resumeId/verify — Verify resume (admin only)
router.patch(
  '/resumes/:resumeId/verify',
  authenticateJWT,
  authorizeRole('admin'),
  validate(resumeValidation.verifyResume),
  resumeController.verifyResume
);

export default router;
