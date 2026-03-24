import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as jobService from '../services/job.service.js';

export const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.user.id, req.body);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Job created successfully',
    data: {
      jobId: job._id,
    },
  });
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.getRecruiterJobs(req.user.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: jobs,
  });
});

export const getJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getJobs(req.query, req.user);

  res.status(200).json(new ApiResponse(200, 'Jobs fetched successfully', result));
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getPublicJobById(req.params.jobId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: job,
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  await jobService.updateJob(req.params.jobId, req.user.id, req.body);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Job updated successfully',
  });
});

export const deleteJob = asyncHandler(async (req, res) => {
  await jobService.deleteJob(req.params.jobId, req.user.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Job deleted successfully',
  });
});
