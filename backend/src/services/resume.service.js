// Implements business logic for resume workflows.

import Resume from '../models/Resume.js';
import ApiError from '../utils/ApiError.js';
import {
  extractTextFromPdf,
  cleanResumeText,
  transformResumeData } from
'../utils/resumeExtraction.js';
import { parseResumeText } from './ai/ai.service.js';
import { deleteResumeAsset, uploadResumeBuffer } from '../config/cloudinary.js';
import logger from '../utils/logger.js';










// Process resume file.
export const processResumeFile = async (userId, pdfBuffer, options = {}) => {
  const { assertClientConnected = () => {} } = options;
  const start = Date.now();
  const existingResume = await findResumeByUserId(userId);
  let upload = null;
  let resume = null;

  try {
    assertClientConnected();

    const rawText = await extractTextFromPdf(pdfBuffer);
    if (!rawText || rawText.trim().length === 0) {
      throw new ApiError(400, 'Could not extract text from PDF');
    }

    assertClientConnected();
    const cleanedText = cleanResumeText(rawText);

    logger.info(`[Pipeline] Sending resume to AI for user ${userId}`);
    const aiData = await parseResumeText(cleanedText);
    assertClientConnected();

    logger.info(`[Pipeline] Transforming (dates, experience years, normalize skills) for user ${userId}`);
    const transformedData = transformResumeData(aiData);
    assertClientConnected();

    logger.info(`[Pipeline] Uploading PDF to Cloudinary for user ${userId}`);
    upload = await uploadResumeBuffer(pdfBuffer, {

      public_id: `resume-${userId}-${Date.now()}.pdf`
    });

    assertClientConnected();
    logger.info(`[Pipeline] Saving resume to database for user ${userId}`);
    const resumeData = {
      ...transformedData,
      fileUrl: upload.secure_url,
      filePublicId: upload.public_id,
      rawText: rawText.substring(0, 10000),
      parsedData: aiData
    };

    resume = await upsertResume(userId, resumeData);

    if (existingResume?.filePublicId && existingResume.filePublicId !== upload.public_id) {
      await deleteResumeAsset(existingResume.filePublicId);
    }

    logger.info(`[METRIC] Full resume pipeline for user ${userId} completed in ${Date.now() - start}ms`);
    return resume;
  } catch (error) {
    if (upload?.public_id && !resume) {
      await deleteResumeAsset(upload.public_id);
    }
    throw error;
  }
};

// Handle Resume.
export const upsertResume = async (userId, resumeData) => {
  const { skills, experiences, experienceYears, ...otherData } = resumeData;

  return Resume.findOneAndUpdate(
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
        filePublicId: otherData.filePublicId || '',
        rawText: otherData.rawText || '',


        parsedData: otherData.parsedData || {}
      }
    },
    { new: true, upsert: true }
  );
};

// Update resume fields.
export const updateResumeFields = async (userId, updates) => {


  const allowedFields = [
  'name', 'email', 'phone', 'location', 'summary',
  'skills', 'experiences', 'education', 'projects', 'experienceYears'];


  const updatePayload = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      updatePayload[field] = updates[field];
    }
  });

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, 'No fields provided for update');
  }

  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    { $set: updatePayload },
    { new: true }
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};

// Get resume by user ID.
export const getResumeByUserId = async (userId) => {
  const resume = await Resume.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};

// Find resume by user ID.
export const findResumeByUserId = async (userId) => Resume.findOne({ user: userId });

// Get all resumes.
export const getAllResumes = async (options = {}) => {
  const { limit = 10, page = 1, search = '' } = options;
  const skip = (page - 1) * limit;



  const query = search ? { name: { $regex: search, $options: 'i' } } : {};

  const resumes = await Resume.find(query).
  populate('user', 'name email role').
  limit(limit).
  skip(skip).
  sort({ createdAt: -1 });

  const total = await Resume.countDocuments(query);

  return {
    data: resumes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Update resume verification.
export const updateResumeVerification = async (resumeId, isVerified) => {
  const resume = await Resume.findByIdAndUpdate(
    resumeId,
    { $set: { isVerified } },
    { new: true }
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};

// Delete resume.
export const deleteResume = async (userId) => {
  const resume = await Resume.findOne({ user: userId });

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  if (resume.filePublicId) {
    await deleteResumeAsset(resume.filePublicId);
  }

  await resume.deleteOne();
  return resume;
};