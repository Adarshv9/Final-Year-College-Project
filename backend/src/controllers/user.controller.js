// ── User Controller ──
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

// Fetch all users with pagination and filtering
/**
 * GET /api/v1/users
 */
export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query);

  const response = new ApiResponse(200, 'Users fetched successfully', result);

  res.status(response.statusCode).json(response);
});

/**
 * GET /api/v1/users/:id
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  const response = new ApiResponse(200, 'User fetched successfully', user);

  res.status(response.statusCode).json(response);
});

/**
 * PUT /api/v1/users/:id
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  const response = new ApiResponse(200, 'User updated successfully', user);

  res.status(response.statusCode).json(response);
});

/**
 * DELETE /api/v1/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  const response = new ApiResponse(200, 'User deleted successfully');

  res.status(response.statusCode).json(response);
});

/**
 * PATCH /api/v1/user/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);

  const response = new ApiResponse(200, 'Password updated successfully');

  res.status(response.statusCode).json(response);
});
