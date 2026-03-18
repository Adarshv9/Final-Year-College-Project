// ── Authentication Service ──
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import * as tokenService from './token.service.js';

/**
 * Register a new user.
 * @param {Object} data - { name, email, password, role }
 * @returns {Promise<Object>} { user, accessToken, refreshToken }
 */
export const register = async ({ name, email, password, role = 'job_seeker' }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  const user = await User.create({ name, email, password, role });

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};

/**
 * Authenticate a user with email and password.
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} { user, accessToken, refreshToken }
 */
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact support.');
  }

  if (user.role === 'recruiter' && !user.isVerified) {
    throw new ApiError(403, 'Recruiter account is pending admin verification.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};

/**
 * Refresh the access token using a valid refresh token.
 * @param {string} refreshTokenStr - The refresh token
 * @returns {Promise<Object>} { accessToken, refreshToken }
 */
export const refreshAccessToken = async (refreshTokenStr) => {
  const decoded = await tokenService.verifyRefreshToken(refreshTokenStr);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  if (user.role === 'recruiter' && !user.isVerified) {
    throw new ApiError(403, 'Recruiter account is pending admin verification.');
  }

  // Rotate refresh token: remove old, issue new
  await tokenService.removeRefreshToken(refreshTokenStr);

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return { accessToken, refreshToken };
};

/**
 * Logout: invalidate the provided refresh token.
 * @param {string} refreshTokenStr - The refresh token
 */
export const logout = async (refreshTokenStr) => {
  await tokenService.removeRefreshToken(refreshTokenStr);
};
