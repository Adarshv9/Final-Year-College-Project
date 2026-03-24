// ── Resume Service ──
import Resume from '../models/Resume.js';
import ApiError from '../utils/ApiError.js';

/**
 * Upsert resume (create if doesn't exist, update if exists)
 */
export const upsertResume = async (userId, resumeData) => {
  const { skills, experiences, experienceYears, ...otherData } = resumeData;

  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        user: userId,
        name: otherData.name || '',
        email: otherData.email || '',
        phone: otherData.phone || '',
        location: otherData.location || '',
        summary: otherData.summary || '',
        skills: skills || [],
        experiences: experiences || [],
        education: otherData.education || [],
        projects: otherData.projects || [],
        experienceYears: experienceYears || 0,
        fileUrl: otherData.fileUrl || '',
        rawText: otherData.rawText || '',
        parsedData: otherData.parsedData || {},
      },
    },
    {
      new: true, // Return updated document
      upsert: true, // Create if doesn't exist
    }
  );

  return resume;
};

/**
 * Update resume fields for the current job seeker
 */
export const updateResumeFields = async (userId, updates) => {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'location',
    'summary',
    'skills',
    'experiences',
    'education',
    'projects',
    'experienceYears',
  ];

  const updatePayload = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      updatePayload[field] = updates[field];
    }
  });

  // console.log(updates);

  // console.log('Update payload:', updatePayload);

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, 'No fields provided for update');
  }

  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    { $set: updatePayload },
    { new: true }
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  return resume;
};

/**
 * Get resume by user ID
 */
export const getResumeByUserId = async (userId) => {
  const resume = await Resume.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  return resume;
};

export const findResumeByUserId = async (userId) => Resume.findOne({ user: userId });

/**
 * Get all resumes (admin only)
 */
export const getAllResumes = async (options = {}) => {
  const { limit = 10, page = 1, search = '' } = options;
  const skip = (page - 1) * limit;

  const query = search ? { name: { $regex: search, $options: 'i' } } : {};

  const resumes = await Resume.find(query)
    .populate('user', 'name email role')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Resume.countDocuments(query);

  return {
    data: resumes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update resume verification status (admin only)
 */
export const updateResumeVerification = async (resumeId, isVerified) => {
  const resume = await Resume.findByIdAndUpdate(
    resumeId,
    { $set: { isVerified } },
    { new: true }
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  return resume;
};

/**
 * Delete resume by user ID
 */
export const deleteResume = async (userId) => {
  const resume = await Resume.findOneAndDelete({ user: userId });

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  return resume;
};
