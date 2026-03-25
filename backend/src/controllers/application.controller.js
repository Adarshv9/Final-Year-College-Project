// HTTP handlers for job applications and recruiter-side review flows.
import asyncHandler from '../utils/asyncHandler.js';
import * as applicationService from '../services/application.service.js';

export const createApplication = asyncHandler(async (req, res) => {
  await applicationService.createApplication(req.params.jobId, req.user, req.body.message);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Application submitted successfully',
  });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getMyApplications(req.user.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: applications,
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
      status: status || undefined,
    }
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.data,
    pagination: result.pagination,
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
    data: applications,
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const result = await applicationService.updateApplicationStatus(
    req.params.applicationId,
    req.user,
    req.body.status
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Application status updated successfully. Candidate email will be sent after 15 seconds.',
    data: result,
  });
});
