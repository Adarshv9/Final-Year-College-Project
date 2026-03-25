// ── Application Service ──
import nodemailer from 'nodemailer';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import normalizeSkills from '../utils/normalizeSkills.js';
import { scoreApplication } from './ai/ai.service.js';
import { computeHybridScore } from './scoring.service.js';

// ── Email ─────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendApplicationEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
  } catch (error) {
    logger.error(`Application email send error: ${error.message}`);
    throw new ApiError(500, 'Failed to send application email');
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildResumeSnapshot = (resume) => {
  const firstEducation =
    Array.isArray(resume.education) && resume.education.length > 0
      ? resume.education[0]
      : {};

  return {
    name: resume.name || '',
    skills: normalizeSkills(resume.skills || []),
    experienceYears: resume.experienceYears || 0,
    education: {
      degree: firstEducation.degree || '',
      institution: firstEducation.institution || '',
      year: firstEducation.year ?? null,
    },
  };
};

const getOwnedJob = async (jobId, recruiterId) => {
  const job = await Job.findOne({ _id: jobId, recruiterId }).lean();
  if (!job) throw new ApiError(404, 'Job not found', [], false);
  return job;
};

const getApplicationWithOwnershipCheck = async (applicationId, recruiterId) => {
  const application = await Application.findById(applicationId).lean();
  if (!application) throw new ApiError(404, 'Application not found', [], false);
  const job = await getOwnedJob(application.jobId, recruiterId);
  return { application, job };
};

/**
 * Compute and persist AI + hybrid scores for an application.
 */
const hydrateApplicationScores = async (applicationId, job, resumeSnapshot) => {
  const aiResult = await scoreApplication(job, resumeSnapshot);

  const { hybridScore } = computeHybridScore({
    jobSkills: job.requiredSkills || [],
    minExp: job.minExperience || 0,
    candidateSkills: resumeSnapshot.skills || [],
    candidateExp: resumeSnapshot.experienceYears || 0,
    aiScore: aiResult.matchScore,
  });

  await Application.findByIdAndUpdate(applicationId, {
    $set: {
      aiScore: aiResult.matchScore,
      aiReason: aiResult.reason,
      hybridScore,
    },
  });

  return { aiScore: aiResult.matchScore, aiReason: aiResult.reason, hybridScore };
};

// ── Public API ────────────────────────────────────────────────────────────────

export const createApplication = async (jobId, jobSeeker, message = '') => {
  const job = await Job.findOne({ _id: jobId, isActive: true }).lean();
  if (!job) throw new ApiError(404, 'Job not found', [], false);

  const resume = await Resume.findOne({ user: jobSeeker._id }).lean();
  if (!resume) throw new ApiError(404, 'Resume not found', [], false);

  const existingApplication = await Application.findOne({
    jobId,
    jobSeekerId: jobSeeker._id,
  }).lean();
  if (existingApplication) {
    throw new ApiError(409, 'You have already applied for this job', [], false);
  }

  let application;
  try {
    application = await Application.create({
      jobId,
      jobSeekerId: jobSeeker._id,
      recruiterId: job.recruiterId,
      resumeId: resume._id,
      resumeSnapshot: buildResumeSnapshot(resume),
      message,
      status: 'pending',
      aiScore: null,
      aiReason: null,
      hybridScore: null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'You have already applied for this job', [], false);
    }
    throw error;
  }

  await Job.findByIdAndUpdate(jobId, { $addToSet: { applicants: jobSeeker._id } });

  try {
    await sendApplicationEmail({
      to: jobSeeker.email,
      subject: `Application Received - ${job.title} at ${job.companyName}`,
      html: `
        <h2>Application Submitted</h2>
        <p>Hi ${jobSeeker.name},</p>
        <p>Your application for <strong>${job.title}</strong> at <strong>${job.companyName}</strong> has been submitted successfully.</p>
        <p>Status: pending</p>
        <p>Best regards,<br/>Job Portal Team</p>
      `,
    });
  } catch (error) {
    await Application.findByIdAndDelete(application._id);
    await Job.findByIdAndUpdate(jobId, { $pull: { applicants: jobSeeker._id } });
    throw error;
  }
};

export const getMyApplications = async (jobSeekerId) => {
  const applications = await Application.find({ jobSeekerId })
    .populate('jobId', 'title companyName location')
    .sort({ createdAt: -1 })
    .lean();

  return applications.map((application) => ({
    applicationId: String(application._id),
    jobId: String(application.jobId?._id || application.jobId || ''),
    jobTitle: application.jobId?.title || '',
    companyName: application.jobId?.companyName || '',
    location: application.jobId?.location || null,
    status: application.status,
    appliedAt: application.createdAt,
    message: application.message || '',
  }));
};

/**
 * Get applications for a job — paginated and filterable by status.
 */
export const getApplicationsForJob = async (jobId, recruiterId, options = {}) => {
  await getOwnedJob(jobId, recruiterId);

  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const query = { jobId };
  if (status) query.status = status;

  const [applications, total] = await Promise.all([
    Application.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Application.countDocuments(query),
  ]);

  return {
    data: applications.map((application) => ({
      applicationId: String(application._id),
      candidateName: application.resumeSnapshot?.name || '',
      experienceYears: application.resumeSnapshot?.experienceYears || 0,
      status: application.status,
      aiScore: application.aiScore,
      hybridScore: application.hybridScore,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getRecommendedApplications = async (jobId, recruiterId) => {
  const job = await getOwnedJob(jobId, recruiterId);
  const applications = await Application.find({ jobId }).sort({ createdAt: -1 }).lean();

  const rankedApplications = [];

  for (const application of applications) {
    let aiScore = application.aiScore;
    let aiReason = application.aiReason;
    let hybridScore = application.hybridScore;

    if (aiScore === null || hybridScore === null) {
      const scores = await hydrateApplicationScores(
        application._id,
        job,
        application.resumeSnapshot
      );
      aiScore = scores.aiScore;
      aiReason = scores.aiReason;
      hybridScore = scores.hybridScore;
    }

    rankedApplications.push({
      applicationId: String(application._id),
      candidateName: application.resumeSnapshot?.name || '',
      aiScore,
      hybridScore,
      reason: aiReason || '',
    });
  }

  return rankedApplications.sort((a, b) => {
    if (b.hybridScore !== a.hybridScore) return b.hybridScore - a.hybridScore;
    return b.aiScore - a.aiScore;
  });
};

export const updateApplicationStatus = async (applicationId, recruiter, status) => {
  const { application, job } = await getApplicationWithOwnershipCheck(
    applicationId,
    recruiter._id
  );

  const candidate = await User.findById(application.jobSeekerId).lean();
  if (!candidate) throw new ApiError(404, 'Candidate not found', [], false);

  const previousStatus = application.status;
  await Application.findByIdAndUpdate(applicationId, { $set: { status } });

  const subject =
    status === 'accepted'
      ? `Congratulations! Selected for ${job.title} at ${job.companyName}`
      : `Update on Your Application for ${job.title} at ${job.companyName}`;

  const html =
    status === 'accepted'
      ? `
        <h2>Congratulations!</h2>
        <p>Hi ${candidate.name},</p>
        <p>Your application for <strong>${job.title}</strong> at <strong>${job.companyName}</strong> has been accepted.</p>
        <p>Best regards,<br/>Job Portal Team</p>
      `
      : `
        <h2>Application Update</h2>
        <p>Hi ${candidate.name},</p>
        <p>Thank you for applying to <strong>${job.title}</strong> at <strong>${job.companyName}</strong>.</p>
        <p>After review, your application was not selected for this role.</p>
        <p>Best regards,<br/>Job Portal Team</p>
      `;

  try {
    await sendApplicationEmail({ to: candidate.email, subject, html });
  } catch (error) {
    await Application.findByIdAndUpdate(applicationId, {
      $set: { status: previousStatus },
    });
    throw error;
  }
};
