// Handles HTTP requests for admin endpoints.

import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as adminService from '../services/admin.service.js';


export const getPendingRecruiters = asyncHandler(async (req, res) => {
  const result = await adminService.getPendingRecruiters(req.query);

  res.
  status(200).
  json(new ApiResponse(200, 'Pending recruiters fetched successfully', result));
});


export const verifyRecruiter = asyncHandler(async (req, res) => {
  const recruiter = await adminService.verifyRecruiter(req.params.id);

  res.
  status(200).
  json(new ApiResponse(200, 'Recruiter verified successfully', recruiter));
});


export const rejectRecruiter = asyncHandler(async (req, res) => {
  const recruiter = await adminService.rejectRecruiter(req.params.id);

  res.
  status(200).
  json(new ApiResponse(200, 'Recruiter deactivated successfully', recruiter));
});


export const promoteUserToAdmin = asyncHandler(async (req, res) => {
  if (req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(403, 'Only the Super Admin can promote users to admin');
  }

  const user = await adminService.promoteUserToAdmin(req.params.id);

  res.
  status(200).
  json(new ApiResponse(200, 'User promoted to admin successfully', user));
});


export const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);

  res.status(200).json(new ApiResponse(200, 'Users fetched successfully', result));
});