import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as jobService from '../services/job.service.js';

export const createJob = catchAsync(async (req, res) => {
  const job = await jobService.createJob(req.user.id, req.body);

  res.status(201).json(new ApiResponse(201, 'Job created successfully', job));
});

export const getJobs = catchAsync(async (req, res) => {
  const result = await jobService.getJobs(req.query, req.user);

  res.status(200).json(new ApiResponse(200, 'Jobs fetched successfully', result));
});

export const getJob = catchAsync(async (req, res) => {
  const job = await jobService.getJobById(req.params.id, req.user);

  res.status(200).json(new ApiResponse(200, 'Job fetched successfully', job));
});

export const updateJob = catchAsync(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.user, req.body);

  res.status(200).json(new ApiResponse(200, 'Job updated successfully', job));
});

export const deleteJob = catchAsync(async (req, res) => {
  await jobService.deleteJob(req.params.id, req.user);

  res.status(200).json(new ApiResponse(200, 'Job deleted successfully'));
});
