// Implements business logic for job workflows.

import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import ApiError from '../utils/ApiError.js';
import normalizeSkills from '../utils/normalizeSkills.js';
import { rankJobsWithAI } from '../utils/jobRecommendations.js';
import { scoreApplication } from './ai/ai.service.js';
import { computeHybridScore } from './scoring.service.js';

const publicJobFields =
'_id title companyName location description requiredSkills minExperience jobType salary createdAt updatedAt';

// Build public job filter.
const buildPublicJobFilter = ({
  search,
  skill,
  location,
  locationType,
  jobType,
  minExperience
}) => {
  const filter = { isActive: true };

  if (search) {


    filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }];

  }

  if (skill) {
    filter.requiredSkills = { $in: normalizeSkills([skill]) };
  }

  if (locationType) {
    filter['location.type'] = locationType;
  }

  if (location) {
    filter.$and = [
    ...(filter.$and || []),
    {
      $or: [
      { 'location.city': { $regex: location, $options: 'i' } },
      { 'location.country': { $regex: location, $options: 'i' } }]

    }];

  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (minExperience !== undefined) {
    filter.minExperience = { $lte: minExperience };
  }

  return filter;
};

// Create job.
export const createJob = async (recruiterId, jobData) =>
Job.create({
  ...jobData,
  recruiterId
});

// Get recruiter jobs.
export const getRecruiterJobs = async (recruiterId) => {
  const jobs = await Job.find({ recruiterId, isActive: true }).
  select('_id title companyName location requiredSkills jobType applicants createdAt').
  sort({ createdAt: -1 }).
  lean();

  return jobs.map((job) => ({
    ...job,
    applicationsCount: Array.isArray(job.applicants) ? job.applicants.length : 0
  }));
};

// Get jobs.
export const getJobs = async (
{ page = 1, limit = 10, search, skill, location, locationType, jobType, minExperience }) =>
{
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = buildPublicJobFilter({
    search,
    skill,
    location,
    locationType,
    jobType,
    minExperience
  });

  const [jobs, total] = await Promise.all([
  Job.find(filter).
  select(publicJobFields).
  sort({ createdAt: -1 }).
  skip(skip).
  limit(parsedLimit).
  lean(),
  Job.countDocuments(filter)]
  );

  return {
    jobs,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    }
  };
};

// Get public job by ID.
export const getPublicJobById = async (jobId) => {
  const job = await Job.findOne({ _id: jobId, isActive: true }).
  select(publicJobFields).
  lean();

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};

// Build ats resume snapshot.
const buildAtsResumeSnapshot = (resume) => {
  const firstEducation =
  Array.isArray(resume.education) && resume.education.length > 0 ?
  resume.education[0] :
  {};

  return {
    name: resume.name || '',
    skills: normalizeSkills(resume.skills || []),
    experienceYears: resume.experienceYears || 0,
    education: {
      degree: firstEducation.degree || '',
      institution: firstEducation.institution || '',
      year: firstEducation.year ?? null
    }
  };
};

// Get ats score for job.
export const getAtsScoreForJob = async (userId, jobId) => {
  const [job, resume] = await Promise.all([
  Job.findOne({ _id: jobId, isActive: true }).select(publicJobFields).lean(),
  Resume.findOne({ user: userId }).select('name skills experienceYears education').lean()]
  );

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (!resume) {
    throw new ApiError(404, 'Upload or create your resume before checking ATS score', [], false);
  }

  const resumeSnapshot = buildAtsResumeSnapshot(resume);
  const aiResult = await scoreApplication(job, resumeSnapshot);
  const { hybridScore, breakdown } = computeHybridScore({
    jobSkills: job.requiredSkills || [],
    minExp: job.minExperience || 0,
    candidateSkills: resumeSnapshot.skills || [],
    candidateExp: resumeSnapshot.experienceYears || 0,
    aiScore: aiResult.matchScore
  });

  return {
    jobId: String(job._id),
    atsScore: hybridScore,
    aiScore: aiResult.matchScore,
    reason: aiResult.reason,
    breakdown: {
      skillScore: breakdown.skillScore,
      experienceScore: breakdown.expScore,
      aiScore: breakdown.aiScore,
      matchingSkills: breakdown.matchingSkills,
      missingSkills: breakdown.missingSkills
    }
  };
};

// Get recommended jobs.
export const getRecommendedJobs = async (userId) => {


  const [resume, profile] = await Promise.all([
  Resume.findOne({ user: userId }).select('skills').lean(),
  JobSeekerProfile.findOne({ user: userId }).select('skills').lean()]
  );

  const resumeSkills = normalizeSkills(resume?.skills || []);
  const profileSkills = normalizeSkills(profile?.skills || []);


  const mergedSkills = [...new Set([...resumeSkills, ...profileSkills])];

  if (mergedSkills.length === 0) {

    return [];
  }


  const jobs = await Job.find({
    isActive: true,
    requiredSkills: { $in: mergedSkills }
  }).
  select(publicJobFields).
  sort({ createdAt: -1 }).
  limit(20).
  lean();


  return rankJobsWithAI(mergedSkills, jobs);
};

// Update job.
export const updateJob = async (jobId, recruiterId, updateData) => {
  const job = await Job.findOneAndUpdate(
    { _id: jobId, recruiterId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};

// Delete job.
export const deleteJob = async (jobId, recruiterId) => {
  const job = await Job.findOneAndUpdate(
    { _id: jobId, recruiterId },
    { $set: { isActive: false } },
    { new: true }
  ).lean();

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};