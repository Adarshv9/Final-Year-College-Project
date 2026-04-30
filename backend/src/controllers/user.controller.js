// Handles HTTP requests for user endpoints.

import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';





export const updateMe = asyncHandler(async (req, res) => {
  const allowed = (({ name, phone, location, email, role }) => ({ name, phone, location, email, role }))(req.body || {});

  Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);

  const user = await userService.updateUser(req.user.id, allowed, { self: true });
  const response = new ApiResponse(200, 'Account updated successfully', user);
  res.status(response.statusCode).json(response);
});





export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteSelf(req.user.id, req.user);
  const response = new ApiResponse(200, 'Account closed successfully');
  res.status(response.statusCode).json(response);
});





export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query);

  const response = new ApiResponse(200, 'Users fetched successfully', result);

  res.status(response.statusCode).json(response);
});




export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  const response = new ApiResponse(200, 'User fetched successfully', user);

  res.status(response.statusCode).json(response);
});




export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  const response = new ApiResponse(200, 'User updated successfully', user);

  res.status(response.statusCode).json(response);
});




export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user);

  const response = new ApiResponse(200, 'User deleted successfully');

  res.status(response.statusCode).json(response);
});




export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);

  const response = new ApiResponse(200, 'Password updated successfully');

  res.status(response.statusCode).json(response);
});