import express from 'express';
const router = express.Router();

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

/**
 * API v1 route aggregator.
 * Mount all resource routers here.
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
