// ── Job Controller ──
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as jobService from '../services/job.service.js';

// Create a new job listing
export const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.user.id, req.body);

  res.status(201).json(new ApiResponse(201, 'Job created successfully', job));
});

// Fetch all jobs with optional filters (search, location, skill matching)
export const getJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getJobs(req.query, req.user);

  res.status(200).json(new ApiResponse(200, 'Jobs fetched successfully', result));
});

// Fetch a single job by ID
export const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id, req.user);

  res.status(200).json(new ApiResponse(200, 'Job fetched successfully', job));
});

// Update job details (recruiter/admin only)
export const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.user, req.body);

  res.status(200).json(new ApiResponse(200, 'Job updated successfully', job));
});

// Delete a job listing
export const deleteJob = asyncHandler(async (req, res) => {
  await jobService.deleteJob(req.params.id, req.user);

  res.status(200).json(new ApiResponse(200, 'Job deleted successfully'));
});
