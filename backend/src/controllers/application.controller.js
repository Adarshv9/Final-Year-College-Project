import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as applicationService from '../services/application.service.js';

export const createApplication = catchAsync(async (req, res) => {
  const application = await applicationService.createApplication(
    req.params.jobId,
    req.user.id
  );

  res
    .status(201)
    .json(new ApiResponse(201, 'Application submitted successfully', application));
});

export const getMyApplications = catchAsync(async (req, res) => {
  const result = await applicationService.getMyApplications(req.user.id, req.query);

  res
    .status(200)
    .json(new ApiResponse(200, 'Applications fetched successfully', result));
});

export const getApplicationsForJob = catchAsync(async (req, res) => {
  const result = await applicationService.getApplicationsForJob(
    req.params.jobId,
    req.user,
    req.query
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Job applications fetched successfully', result));
});

export const updateApplicationStatus = catchAsync(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    req.user,
    req.body.status
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Application status updated successfully', application));
});
