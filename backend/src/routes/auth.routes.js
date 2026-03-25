// ── Authentication Routes ──
import express from 'express';
const router = express.Router();
import * as authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.js';
import * as authValidation from '../validations/auth.validation.js';
import { authenticateJWT, optionalSessionJWT } from '../middlewares/auth.js';
import { authLimiter, loginLimiter } from '../middlewares/rateLimiter.js';

// Public routes - No authentication required
router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/verify-otp', authLimiter, validate(authValidation.verifyOTP), authController.verifyOTP);
router.post('/resend-otp', authLimiter, validate(authValidation.resendOTP), authController.resendOTP);
router.post('/login', loginLimiter, validate(authValidation.login), authController.login);
router.post('/refresh-token', authLimiter, validate(authValidation.refreshToken), authController.refreshToken);

// Protected routes - Require authentication
router.post('/logout', authenticateJWT, authController.logout);
router.get('/me', optionalSessionJWT, authController.getMe);
router.get('/profile', authenticateJWT, authController.profile);

export default router;
