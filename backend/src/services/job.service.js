// Business logic for job search, recruiter CRUD, and recommendations.
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import ApiError from '../utils/ApiError.js';
import normalizeSkills from '../utils/normalizeSkills.js';
import { rankJobsWithAI } from '../utils/jobRecommendations.js';

const publicJobFields =
  '_id title companyName location description requiredSkills minExperience jobType salary createdAt updatedAt';

const buildPublicJobFilter = ({
  search,
  skill,
  location,
  locationType,
  jobType,
  minExperience,
}) => {
  const filter = { isActive: true };

  if (search) {
    // Search is intentionally broad so public job discovery works from a
    // single text box without separate title/description filters.
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
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
          { 'location.country': { $regex: location, $options: 'i' } },
        ],
      },
    ];
  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (minExperience !== undefined) {
    filter.minExperience = { $lte: minExperience };
  }

  return filter;
};

export const createJob = async (recruiterId, jobData) =>
  Job.create({
    ...jobData,
    recruiterId,
  });

export const getRecruiterJobs = async (recruiterId) => {
  const jobs = await Job.find({ recruiterId, isActive: true })
    .select('_id title companyName location requiredSkills jobType applicants createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return jobs.map((job) => ({
    ...job,
    applicationsCount: Array.isArray(job.applicants) ? job.applicants.length : 0,
  }));
};

export const getJobs = async (
  { page = 1, limit = 10, search, skill, location, locationType, jobType, minExperience }
) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = buildPublicJobFilter({
    search,
    skill,
    location,
    locationType,
    jobType,
    minExperience,
  });

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .select(publicJobFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const getPublicJobById = async (jobId) => {
  const job = await Job.findOne({ _id: jobId, isActive: true })
    .select(publicJobFields)
    .lean();

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};

export const getRecommendedJobs = async (userId) => {
  const resume = await Resume.findOne({ user: userId }).select('skills').lean();

  if (!resume) {
    return [];
  }

  const resumeSkills = normalizeSkills(resume.skills || []);

  if (resumeSkills.length === 0) {
    return [];
  }

  const jobs = await Job.find({
    isActive: true,
    requiredSkills: { $in: resumeSkills },
  })
    .select(publicJobFields)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Keep the candidate set small before sending it to AI so recommendations
  // stay fast and grounded in obvious skill overlap.
  return rankJobsWithAI({
    resumeSkills,
    jobs,
  });
};

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
