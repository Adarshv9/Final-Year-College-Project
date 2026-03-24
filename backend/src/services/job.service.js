import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import ApiError from '../utils/ApiError.js';
import normalizeSkills from '../utils/normalizeSkills.js';

const publicJobFields =
  '_id title companyName location description requiredSkills minExperience jobType salary createdAt updatedAt';

const buildPublicJobFilter = ({
  search,
  skill,
  locationType,
  city,
  country,
  jobType,
  minExperience,
}) => {
  const filter = { isActive: true };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.city': { $regex: search, $options: 'i' } },
      { 'location.country': { $regex: search, $options: 'i' } },
    ];
  }

  if (skill) {
    filter.requiredSkills = { $in: normalizeSkills([skill]) };
  }

  if (locationType) {
    filter['location.type'] = locationType;
  }

  if (city) {
    filter['location.city'] = { $regex: city, $options: 'i' };
  }

  if (country) {
    filter['location.country'] = { $regex: country, $options: 'i' };
  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (minExperience !== undefined) {
    filter.minExperience = { $gte: minExperience };
  }

  return filter;
};

const calculateSkillMatch = (requiredSkills = [], candidateSkills = []) => {
  const normalizedRequiredSkills = normalizeSkills(requiredSkills);
  const normalizedCandidateSkills = new Set(normalizeSkills(candidateSkills));

  if (normalizedRequiredSkills.length === 0) {
    return 0;
  }

  const matchedSkills = normalizedRequiredSkills.filter((skill) =>
    normalizedCandidateSkills.has(skill)
  );

  return Math.round((matchedSkills.length / normalizedRequiredSkills.length) * 100);
};

const attachResumeMatchScore = async (jobs, currentUser) => {
  if (currentUser?.role !== 'job_seeker') {
    return jobs;
  }

  const resume = await Resume.findOne({ user: currentUser._id }).select('skills').lean();
  const resumeSkills = resume?.skills || [];

  return jobs
    .map((job) => ({
      ...job,
      matchScore: calculateSkillMatch(job.requiredSkills, resumeSkills),
    }))
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
};

export const createJob = async (recruiterId, jobData) =>
  Job.create({
    ...jobData,
    recruiterId,
  });

export const getRecruiterJobs = async (recruiterId) =>
  Job.find({ recruiterId })
    .select('_id title jobType isActive createdAt')
    .sort({ createdAt: -1 })
    .lean();

export const getJobs = async (
  { page = 1, limit = 10, search, skill, locationType, city, country, jobType, minExperience },
  currentUser
) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = buildPublicJobFilter({
    search,
    skill,
    locationType,
    city,
    country,
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

  const data = await attachResumeMatchScore(jobs, currentUser);

  return {
    jobs: data,
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
