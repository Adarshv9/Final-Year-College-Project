import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';

/**
 * POST /api/v1/auth/register
 */
export const register = catchAsync(async (req, res) => {
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
export const login = catchAsync(async (req, res) => {
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
export const refreshToken = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);

  const response = new ApiResponse(200, 'Token refreshed successfully', tokens);

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);

  const response = new ApiResponse(200, 'Logged out successfully');

  res.status(response.statusCode).json(response);
});

/**
 * GET /api/v1/auth/me
 */
export const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  const response = new ApiResponse(200, 'User profile fetched', user);

  res.status(response.statusCode).json(response);
});
