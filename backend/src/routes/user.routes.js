import express from 'express';
const router = express.Router();
import * as userController from '../controllers/user.controller.js';
import validate from '../middlewares/validate.js';
import * as userValidation from '../validations/user.validation.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';

// All user routes require authentication
router.use(authenticateJWT);

router.get('/', validate(userValidation.listUsers), userController.getUsers);
router.get('/:id', validate(userValidation.getUser), userController.getUser);

// Only admins can update or delete users
router.put('/:id', authorizeRole('admin'), validate(userValidation.updateUser), userController.updateUser);
router.delete('/:id', authorizeRole('admin'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
