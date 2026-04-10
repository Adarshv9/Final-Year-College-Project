// JWT authentication helpers plus role and recruiter-verification guards.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const authenticateJWT = asyncHandler(async (req, _res, next) => {
  // Check for token in cookies first, then Authorization header
  let token = req.cookies?.authToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.accessSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  req.user = user;
  req.auth = decoded;
  next();
});

export const optionalAuthenticateJWT = asyncHandler(async (req, _res, next) => {
  // This helper is for routes where auth is useful but not mandatory.
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Invalid authorization header format');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.accessSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  req.user = user;
  req.auth = decoded;
  next();
});

/**
 * Like authenticateJWT (cookie or Bearer) but never fails:
 * missing / invalid / expired token simply leaves req.user unset.
 * Used for GET /auth/me so clients can probe session without a 401 in DevTools.
 */
export const optionalSessionJWT = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.authToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.id);
    if (user?.isActive) {
      req.user = user;
      req.auth = decoded;
    }
  } catch {
    // Expired or bad token — treat as logged out
  }

  next();
});

export const authorizeRole = (...roles) => {
  return (req, _res, next) => {
    // Role checks assume an earlier auth middleware already attached req.user.
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};

export const checkRecruiterVerified = (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (req.user.role === 'recruiter' && !req.user.isVerified) {
    throw new ApiError(403, 'Recruiter account is pending admin verification.');
  }

  next();
};

// Backward-compatible aliases for existing imports.
export const verifyToken = authenticateJWT;
export const verifyRole = authorizeRole;
