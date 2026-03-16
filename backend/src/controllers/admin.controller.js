import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as adminService from '../services/admin.service.js';

export const getPendingRecruiters = catchAsync(async (req, res) => {
  const result = await adminService.getPendingRecruiters(req.query);

  res
    .status(200)
    .json(new ApiResponse(200, 'Pending recruiters fetched successfully', result));
});

export const verifyRecruiter = catchAsync(async (req, res) => {
  const recruiter = await adminService.verifyRecruiter(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Recruiter verified successfully', recruiter));
});

export const rejectRecruiter = catchAsync(async (req, res) => {
  const recruiter = await adminService.rejectRecruiter(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Recruiter deactivated successfully', recruiter));
});

export const getUsers = catchAsync(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);

  res.status(200).json(new ApiResponse(200, 'Users fetched successfully', result));
});
