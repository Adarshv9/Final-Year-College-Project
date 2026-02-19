import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Middleware: verifies the JWT access token from the Authorization header.
 * Attaches the decoded payload to `req.user`.
 */
export const verifyToken = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired access token');
  }
});

/**
 * Middleware factory: restricts access to users whose role is
 * included in the provided list.
 *
 * @param  {...string} roles - Allowed roles, e.g. 'admin', 'user'
 * @returns {Function} Express middleware
 */
export const verifyRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};
