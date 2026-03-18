// ── Authentication Routes ──
import express from 'express';
const router = express.Router();
import * as authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.js';
import * as authValidation from '../validations/auth.validation.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

// Apply stricter rate limiting to all auth endpoints
router.use(authLimiter);

// Public routes - No authentication required
router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-token', validate(authValidation.refreshToken), authController.refreshToken);

// Protected routes - Require authentication
router.post('/logout', authenticateJWT, authController.logout);
router.get('/me', authenticateJWT, authController.getMe);

export default router;
