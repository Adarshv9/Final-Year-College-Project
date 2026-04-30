// Registers API routes for admin features.

import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import * as adminValidation from '../validations/admin.validation.js';

const router = express.Router();


router.use(authenticateJWT, authorizeRole('admin'));


router.get('/recruiters/pending', validate(adminValidation.pendingRecruiters), adminController.getPendingRecruiters);
router.patch('/recruiter/:id/verify', validate(adminValidation.recruiterAction), adminController.verifyRecruiter);
router.patch('/recruiter/:id/reject', validate(adminValidation.recruiterAction), adminController.rejectRecruiter);


router.patch('/users/:id/promote-admin', validate(adminValidation.promoteUser), adminController.promoteUserToAdmin);
router.get('/users', validate(adminValidation.users), adminController.getUsers);

export default router;