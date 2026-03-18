// ── Authentication Controller ──
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';

/**
 * POST /api/v1/auth/register
 * Create a new user account
 */
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  const response = new ApiResponse(201, 'Registration successful', {
    user,
    accessToken,
    refreshToken,
  });

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  const response = new ApiResponse(200, 'Login successful', {
    user,
    accessToken,
    refreshToken,
  });

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);

  const response = new ApiResponse(200, 'Token refreshed successfully', tokens);

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);

  const response = new ApiResponse(200, 'Logged out successfully');

  res.status(response.statusCode).json(response);
});

/**
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  const response = new ApiResponse(200, 'User profile fetched', user);

  res.status(response.statusCode).json(response);
});
