// Registers API routes for user features.

import express from 'express';
const router = express.Router();
import * as userController from '../controllers/user.controller.js';
import validate from '../middlewares/validate.js';
import * as userValidation from '../validations/user.validation.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';


router.use(authenticateJWT);


router.patch('/me', validate(userValidation.updateMe), userController.updateMe);
router.delete('/me', userController.deleteMe);


router.get('/', validate(userValidation.listUsers), userController.getUsers);
router.get('/:id', validate(userValidation.getUser), userController.getUser);


router.patch('/change-password', validate(userValidation.changePassword), userController.changePassword);


router.put('/:id', authorizeRole('admin'), validate(userValidation.updateUser), userController.updateUser);
router.delete('/:id', authorizeRole('admin'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;