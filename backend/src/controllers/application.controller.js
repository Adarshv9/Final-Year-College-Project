// Handles HTTP requests for application endpoints.

import asyncHandler from '../utils/asyncHandler.js';
import * as applicationService from '../services/application.service.js';

export const createApplication = asyncHandler(async (req, res) => {
  await applicationService.createApplication(req.params.jobId, req.user, req.body.message);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Application submitted successfully'
  });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getMyApplications(req.user.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: applications
  });
});

export const getRecruiterApplications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    status,
    jobId,
    sort = 'newest'
  } = req.query;

  const result = await applicationService.getRecruiterApplications(
    req.user.id,
    {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status: status || undefined,
      jobId: jobId || undefined,
      sort
    }
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.data,
    pagination: result.pagination
  });
});

export const getApplicationsForJob = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const result = await applicationService.getApplicationsForJob(
    req.params.jobId,
    req.user.id,
    {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status: status || undefined
    }
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.data,
    pagination: result.pagination
  });
});

export const getRecommendedApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getRecommendedApplications(
    req.params.jobId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: applications
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const result = await applicationService.updateApplicationStatus(
    req.params.applicationId,
    req.user,
    req.body.status
  );

  const message =
  req.body.status === 'pending' ?
  'Application moved back to pending. Any scheduled decision email was cancelled.' :
  'Application status updated successfully. Candidate email will be sent after 15 seconds.';

  res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    data: result
  });
});