// ── Job Application Service ──
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import ApiError from '../utils/ApiError.js';

// Calculate skill match score between job requirements and user profile
const calculateMatchScore = (requiredSkills = [], profileSkills = []) => {
  const normalizedRequired = [
    ...new Set(
      requiredSkills
        .filter(Boolean)
        .map((skill) => String(skill).trim().toLowerCase())
    ),
  ];

  const profileSkillSet = new Set(
    profileSkills.filter(Boolean).map((skill) => String(skill).trim().toLowerCase())
  );

  if (normalizedRequired.length === 0) {
    return 0;
  }

  const matchedSkills = normalizedRequired.filter((skill) => profileSkillSet.has(skill));
  return Math.round((matchedSkills.length / normalizedRequired.length) * 100);
};

// Verify job owner to prevent unauthorized access
const ensureApplicationAccess = (job, currentUser) => {
  if (currentUser.role === 'admin') {
    return;
  }

  if (String(job.recruiterId) !== String(currentUser._id)) {
    throw new ApiError(403, 'You can only manage applications for your own jobs');
  }
};

// Submit a new application for a job
export const createApplication = async (jobId, applicantId) => {
  const job = await Job.findById(jobId);
  if (!job || !job.isActive) {
    throw new ApiError(404, 'Job not found');
  }

  const existingApplication = await Application.findOne({
    job: jobId,
    applicant: applicantId,
  });
  if (existingApplication) {
    throw new ApiError(409, 'You have already applied for this job');
  }

  const profile = await JobSeekerProfile.findOne({ user: applicantId });
  const matchScore = calculateMatchScore(job.requiredSkills, profile?.skills || []);

  const application = await Application.create({
    job: jobId,
    applicant: applicantId,
    matchScore,
  });

  await Job.findByIdAndUpdate(jobId, {
    $addToSet: {
      applicants: applicantId,
    },
  });

  return application.populate([
    { path: 'job', select: 'title companyName location requiredSkills recruiterId' },
    { path: 'applicant', select: 'name email role' },
  ]);
};

// Fetch applications submitted by current user
export const getMyApplications = async (userId, { page = 1, limit = 10, status }) => {
  const filter = { applicant: userId };
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('job', 'title companyName location requiredSkills minExperience jobType salary isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Fetch all applications for a specific job
export const getApplicationsForJob = async (
  jobId,
  currentUser,
  { page = 1, limit = 10, status }
) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  ensureApplicationAccess(job, currentUser);

  const filter = { job: jobId };
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('applicant', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Update application status (shortlist/reject)
export const updateApplicationStatus = async (applicationId, currentUser, status) => {
  const application = await Application.findById(applicationId).populate('job');
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  ensureApplicationAccess(application.job, currentUser);

  application.status = status;
  await application.save();

  return application.populate([
    { path: 'job', select: 'title companyName location recruiterId' },
    { path: 'applicant', select: 'name email role' },
  ]);
};
