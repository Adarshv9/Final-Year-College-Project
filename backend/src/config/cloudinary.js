// Cloudinary configuration and helpers for storing resume files.
import { v2 as cloudinary } from 'cloudinary';
import ApiError from '../utils/ApiError.js';
import { env } from './env.js';

const parseCloudinaryUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;

  try {
    const parsed = new URL(cloudinaryUrl);
    return {
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
    };
  } catch (_error) {
    return null;
  }
};

const cloudinaryConfig = parseCloudinaryUrl(env.cloudinaryUrl);

if (cloudinaryConfig) {
  cloudinary.config({
    ...cloudinaryConfig,
    secure: true,
  });
}

const ensureConfigured = () => {
  if (!cloudinaryConfig) {
    throw new ApiError(500, 'Cloudinary is not configured');
  }
};

export const uploadResumeBuffer = async (buffer, options = {}) => {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        // Force Cloudinary to treat this asset as a PDF so the dashboard
        // shows a PDF "Format" and PDF viewers/downloads behave correctly.
        // format: 'pdf',
        folder: 'talentbridge/resumes',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export const deleteResumeAsset = async (publicId) => {
  if (!publicId || !cloudinaryConfig) return;

  try {
    const resImage = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
    
    // Also attempt raw resource deletion in case there are old format files
    if (resImage.result !== 'ok') {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
      });
    }
  } catch (err) {
    // ignore deletion errors to prevent blocker
  }
};

const sanitizeAttachmentName = (value = '') =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

export const buildResumeDownloadUrl = (publicId, resumeName = 'Resume') => {
  if (!publicId || !cloudinaryConfig) return '';

  const attachmentName = sanitizeAttachmentName(`${resumeName}_Resume`) || 'Resume';
  // const looksLikePdfPublicId = /\.pdf$/i.test(publicId);

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    flags: `attachment:${attachmentName}`,
    secure: true,
    sign_url: true,
  });
};

export default cloudinary;
