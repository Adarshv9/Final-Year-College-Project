// ── Application Service ──
import nodemailer from 'nodemailer';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import normalizeSkills from '../utils/normalizeSkills.js';
import { buildResumeDownloadUrl } from '../config/cloudinary.js';
import { scoreApplication } from './ai/ai.service.js';
import { computeHybridScore } from './scoring.service.js';

const DECISION_EMAIL_DELAY_MS = 15 * 1000;
const DECISION_EMAIL_POLL_MS = 5 * 1000;
let decisionEmailProcessor = null;
let isProcessingDecisionEmails = false;

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
    // Store only the fields needed for ranking so applications stay stable
    // even if the candidate edits their resume later.
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

const hasSnapshotEducation = (education = {}) =>
  Boolean(education?.degree || education?.institution || education?.year);

const buildApplicantDetails = (application) => {
  const resume =
    application.resumeId && typeof application.resumeId === 'object'
      ? application.resumeId
      : null;

  const snapshot = application.resumeSnapshot || {};
  const snapshotEducation = hasSnapshotEducation(snapshot.education)
    ? [snapshot.education]
    : [];

  const skills =
    Array.isArray(snapshot.skills) && snapshot.skills.length > 0
      ? snapshot.skills
      : Array.isArray(resume?.skills)
        ? resume.skills
        : [];

  const education =
    snapshotEducation.length > 0
      ? snapshotEducation
      : Array.isArray(resume?.education)
        ? resume.education
        : [];

  return {
    name: application.jobSeekerId?.name || snapshot.name || resume?.name || 'Applicant',
    email: application.jobSeekerId?.email || resume?.email || '',
    phone: resume?.phone || '',
    location: resume?.location || '',
    summary: resume?.summary || '',
    skills,
    education,
    experience: Array.isArray(resume?.experiences) ? resume.experiences : [],
    experienceYears: snapshot.experienceYears ?? resume?.experienceYears ?? 0,
    resumeUrl: resume?.fileUrl || '',
    resumeDownloadUrl: buildResumeDownloadUrl(
      resume?.filePublicId,
      application.jobSeekerId?.name || snapshot.name || resume?.name || 'Resume'
    ),
    resumeVerified: Boolean(resume?.isVerified),
  };
};

const buildJobSummary = (job) => {
  if (!job || typeof job !== 'object') return null;

  return {
    _id: String(job._id || ''),
    title: job.title || '',
    companyName: job.companyName || '',
    location: job.location || '',
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

const isCompleteApplication = async (application, jobSeekerId) => {
  if (!application?.resumeId) return false;

  const hasSnapshot =
    application.resumeSnapshot &&
    typeof application.resumeSnapshot === 'object' &&
    Array.isArray(application.resumeSnapshot.skills);

  if (!hasSnapshot) return false;

  const resumeExists = await Resume.exists({
    _id: application.resumeId,
    user: jobSeekerId,
  });

  return Boolean(resumeExists);
};

const buildDecisionEmailContent = ({ candidate, job, status }) => {
  if (status === 'accepted') {
    return {
      subject: `Congratulations! Selected for ${job.title} at ${job.companyName}`,
      html: `
        <h2>Congratulations!</h2>
        <p>Hi ${candidate.name},</p>
        <p>Your application for <strong>${job.title}</strong> at <strong>${job.companyName}</strong> has been accepted.</p>
        <p>Best regards,<br/>Job Portal Team</p>
      `,
    };
  }

  return {
    subject: `Update on Your Application for ${job.title} at ${job.companyName}`,
    html: `
      <h2>Application Update</h2>
      <p>Hi ${candidate.name},</p>
      <p>Thank you for applying to <strong>${job.title}</strong> at <strong>${job.companyName}</strong>.</p>
      <p>After review, your application was not selected for this role.</p>
      <p>Best regards,<br/>Job Portal Team</p>
    `,
  };
};

const buildDecisionEmailUpdate = (status) => ({
  'decisionEmail.type': status,
  'decisionEmail.status': 'scheduled',
  'decisionEmail.sendAt': new Date(Date.now() + DECISION_EMAIL_DELAY_MS),
  'decisionEmail.sentAt': null,
  'decisionEmail.lastError': '',
});

const buildCancelledDecisionEmailUpdate = () => ({
  'decisionEmail.type': null,
  'decisionEmail.status': 'cancelled',
  'decisionEmail.sendAt': null,
  'decisionEmail.sentAt': null,
  'decisionEmail.lastError': '',
});

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
  });
  if (existingApplication) {
    const hasCompleteApplication = await isCompleteApplication(existingApplication, jobSeeker._id);

    if (hasCompleteApplication) {
      throw new ApiError(409, 'You have already applied for this job', [], false);
    }

    // Recover from legacy/incomplete rows so candidates are not permanently
    // blocked after an earlier failed apply attempt.
    await Application.findByIdAndDelete(existingApplication._id);
    await Job.findByIdAndUpdate(jobId, { $pull: { applicants: jobSeeker._id } });
  }

  let application;
  try {
    application = await Application.create({
      jobId,
      jobSeekerId: jobSeeker._id,
      recruiterId: job.recruiterId,
      resumeId: resume._id,
      // Snapshot the resume at apply-time so later resume edits do not
      // retroactively change the submitted application.
      resumeSnapshot: buildResumeSnapshot(resume),
      message,
      status: 'pending',
      aiScore: null,
      aiReason: null,
      hybridScore: null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateFields = Object.keys(error.keyPattern || error.keyValue || {});
      const isApplicationDuplicate =
        duplicateFields.includes('jobId') && duplicateFields.includes('jobSeekerId');

      if (isApplicationDuplicate) {
        throw new ApiError(409, 'You have already applied for this job', [], false);
      }
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

export const getRecruiterApplications = async (recruiterId, options = {}) => {
  const {
    page = 1,
    limit = 100,
    status,
    jobId,
    sort = 'newest',
  } = options;

  if (jobId) {
    await getOwnedJob(jobId, recruiterId);
  }

  const skip = (page - 1) * limit;
  const query = { recruiterId };

  if (status) query.status = status;
  if (jobId) query.jobId = jobId;

  const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('jobId', 'title companyName location')
      .populate('jobSeekerId', 'name email')
      .populate(
        'resumeId',
        'name email phone location summary skills education experiences experienceYears fileUrl isVerified'
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(query),
  ]);

  return {
    data: applications.map((application) => {
      const applicant = buildApplicantDetails(application);

      return {
        _id: String(application._id),
        applicationId: String(application._id),
        applicant,
        candidateName: applicant.name,
        experienceYears: applicant.experienceYears,
        status: application.status,
        message: application.message || '',
        aiScore: application.aiScore,
        hybridScore: application.hybridScore,
        appliedAt: application.createdAt,
        job: buildJobSummary(application.jobId),
      };
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
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
    Application.find(query)
      .populate('jobSeekerId', 'name email')
      .populate(
        'resumeId',
        'name email phone location summary skills education experiences experienceYears fileUrl isVerified'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(query),
  ]);

  return {
    data: applications.map((application) => {
      const applicant = buildApplicantDetails(application);

      return {
        _id: String(application._id),
        applicationId: String(application._id),
        applicant,
        candidateName: applicant.name,
        experienceYears: applicant.experienceYears,
        status: application.status,
        message: application.message || '',
        aiScore: application.aiScore,
        hybridScore: application.hybridScore,
        appliedAt: application.createdAt,
      };
    }),
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
  const applications = await Application.find({ jobId })
    .populate('jobSeekerId', 'name email')
    .populate(
      'resumeId',
      'name email phone location summary skills education experiences experienceYears fileUrl isVerified'
    )
    .sort({ createdAt: -1 })
    .lean();

  const rankedApplications = [];

  for (const application of applications) {
    let aiScore = application.aiScore;
    let aiReason = application.aiReason;
    let hybridScore = application.hybridScore;

    if (aiScore === null || hybridScore === null) {
      // Older rows may not have scores yet, so compute them lazily here
      // instead of forcing a backfill migration.
      const scores = await hydrateApplicationScores(
        application._id,
        job,
        application.resumeSnapshot
      );
      aiScore = scores.aiScore;
      aiReason = scores.aiReason;
      hybridScore = scores.hybridScore;
    }

    const applicant = buildApplicantDetails(application);

    rankedApplications.push({
      _id: String(application._id),
      applicationId: String(application._id),
      applicant,
      candidateName: applicant.name,
      experienceYears: applicant.experienceYears,
      status: application.status,
      message: application.message || '',
      aiScore,
      hybridScore,
      reason: aiReason || '',
      appliedAt: application.createdAt,
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

  if (status === application.status) {
    return {
      status,
      candidateEmail: candidate.email,
      jobTitle: job.title,
      decisionEmailSendAt: null,
    };
  }

  if (status === 'pending') {
    await Application.findByIdAndUpdate(applicationId, {
      $set: {
        status,
        ...buildCancelledDecisionEmailUpdate(),
      },
    });

    logger.info(`Decision email cancelled for application ${applicationId}; status reverted to pending`);

    return {
      status,
      candidateEmail: candidate.email,
      jobTitle: job.title,
      decisionEmailSendAt: null,
    };
  }

  const decisionEmailSendAt = new Date(Date.now() + DECISION_EMAIL_DELAY_MS);
  await Application.findByIdAndUpdate(applicationId, {
    $set: {
      status,
      ...buildDecisionEmailUpdate(status),
    },
  });

  logger.info(
    `Decision email scheduled for application ${applicationId} (${status}) at ${decisionEmailSendAt.toISOString()}`
  );

  return {
    status,
    candidateEmail: candidate.email,
    jobTitle: job.title,
    decisionEmailSendAt,
  };
};

export const processScheduledDecisionEmails = async () => {
  if (isProcessingDecisionEmails) return;
  isProcessingDecisionEmails = true;

  try {
    const now = new Date();
    const dueApplications = await Application.find({
      'decisionEmail.status': 'scheduled',
      'decisionEmail.sendAt': { $lte: now },
    })
      .select('_id jobId jobSeekerId status decisionEmail')
      .limit(20)
      .lean();

    for (const dueApplication of dueApplications) {
      const claimedApplication = await Application.findOneAndUpdate(
        {
          _id: dueApplication._id,
          'decisionEmail.status': 'scheduled',
          'decisionEmail.sendAt': { $lte: now },
        },
        {
          $set: {
            'decisionEmail.status': 'processing',
          },
        },
        { new: true }
      ).lean();

      if (!claimedApplication) continue;

      const decisionType = claimedApplication.decisionEmail?.type;
      if (!decisionType || decisionType !== claimedApplication.status) {
        await Application.findByIdAndUpdate(claimedApplication._id, {
          $set: buildCancelledDecisionEmailUpdate(),
        });
        continue;
      }

      const [candidate, job] = await Promise.all([
        User.findById(claimedApplication.jobSeekerId).lean(),
        Job.findById(claimedApplication.jobId).lean(),
      ]);

      if (!candidate || !job) {
        await Application.findByIdAndUpdate(claimedApplication._id, {
          $set: {
            'decisionEmail.status': 'failed',
            'decisionEmail.lastError': 'Candidate or job not found while sending decision email',
          },
        });
        continue;
      }

      const { subject, html } = buildDecisionEmailContent({
        candidate,
        job,
        status: decisionType,
      });

      try {
        await sendApplicationEmail({
          to: candidate.email,
          subject,
          html,
        });

        await Application.findByIdAndUpdate(claimedApplication._id, {
          $set: {
            'decisionEmail.status': 'sent',
            'decisionEmail.sentAt': new Date(),
            'decisionEmail.sendAt': null,
            'decisionEmail.lastError': '',
          },
        });
      } catch (error) {
        logger.error(`Decision email send failed for application ${claimedApplication._id}: ${error.message}`);

        await Application.findByIdAndUpdate(claimedApplication._id, {
          $set: {
            'decisionEmail.status': 'failed',
            'decisionEmail.lastError': error.message,
          },
        });
      }
    }
  } finally {
    isProcessingDecisionEmails = false;
  }
};

export const startDecisionEmailProcessor = () => {
  if (decisionEmailProcessor) return decisionEmailProcessor;

  const runProcessor = async () => {
    try {
      await processScheduledDecisionEmails();
    } catch (error) {
      logger.error(`Decision email processor error: ${error.message}`);
    }
  };

  decisionEmailProcessor = setInterval(runProcessor, DECISION_EMAIL_POLL_MS);
  if (typeof decisionEmailProcessor.unref === 'function') {
    decisionEmailProcessor.unref();
  }

  void runProcessor();
  return decisionEmailProcessor;
};

export const stopDecisionEmailProcessor = () => {
  if (!decisionEmailProcessor) return;

  clearInterval(decisionEmailProcessor);
  decisionEmailProcessor = null;
};
