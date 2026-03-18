// ── Job Application Controller ──
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as applicationService from '../services/application.service.js';

// Submit a job application
export const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(
    req.params.jobId,
    req.user.id
  );

  res
    .status(201)
    .json(new ApiResponse(201, 'Application submitted successfully', application));
});

// Fetch current user's applications
export const getMyApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getMyApplications(req.user.id, req.query);

  res
    .status(200)
    .json(new ApiResponse(200, 'Applications fetched successfully', result));
});

// Fetch all applications for a specific job (recruiter/admin)
export const getApplicationsForJob = asyncHandler(async (req, res) => {
  const result = await applicationService.getApplicationsForJob(
    req.params.jobId,
    req.user,
    req.query
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Job applications fetched successfully', result));
});

// Update application status (shortlist/reject)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    req.user,
    req.body.status
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Application status updated successfully', application));
});
