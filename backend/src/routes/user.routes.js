// ── User Routes ──
import express from 'express';
const router = express.Router();
import * as userController from '../controllers/user.controller.js';
import validate from '../middlewares/validate.js';
import * as userValidation from '../validations/user.validation.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';

// All user routes require authentication
router.use(authenticateJWT);

// Self-service account endpoints
router.patch('/me', validate(userValidation.updateMe), userController.updateMe);
router.delete('/me', userController.deleteMe);

// Public endpoints - any authenticated user can view users
router.get('/', validate(userValidation.listUsers), userController.getUsers);
router.get('/:id', validate(userValidation.getUser), userController.getUser);

// Protected endpoints - user specific
router.patch('/change-password', validate(userValidation.changePassword), userController.changePassword);

// Protected endpoints - admin only
router.put('/:id', authorizeRole('admin'), validate(userValidation.updateUser), userController.updateUser);
router.delete('/:id', authorizeRole('admin'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
