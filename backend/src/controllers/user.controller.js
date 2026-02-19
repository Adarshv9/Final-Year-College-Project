import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

/**
 * GET /api/v1/users
 */
export const getUsers = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query);

  const response = new ApiResponse(200, 'Users fetched successfully', result);

  res.status(response.statusCode).json(response);
});

/**
 * GET /api/v1/users/:id
 */
export const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  const response = new ApiResponse(200, 'User fetched successfully', user);

  res.status(response.statusCode).json(response);
});

/**
 * PUT /api/v1/users/:id
 */
export const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  const response = new ApiResponse(200, 'User updated successfully', user);

  res.status(response.statusCode).json(response);
});

/**
 * DELETE /api/v1/users/:id
 */
export const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);

  const response = new ApiResponse(200, 'User deleted successfully');

  res.status(response.statusCode).json(response);
});
