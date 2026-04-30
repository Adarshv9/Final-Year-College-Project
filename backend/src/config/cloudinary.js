// Configures Cloudinary for resume and media storage.

import { v2 as cloudinary } from 'cloudinary';
import ApiError from '../utils/ApiError.js';
import { env } from './env.js';

// Parse cloudinary URL.
const parseCloudinaryUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;

  try {
    const parsed = new URL(cloudinaryUrl);
    return {
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password)
    };
  } catch (_error) {
    return null;
  }
};

const cloudinaryConfig = parseCloudinaryUrl(env.cloudinaryUrl);

if (cloudinaryConfig) {
  cloudinary.config({
    ...cloudinaryConfig,
    secure: true
  });
}

// Handle Configured.
const ensureConfigured = () => {
  if (!cloudinaryConfig) {
    throw new ApiError(500, 'Cloudinary is not configured');
  }
};

// Handle Resume Buffer.
export const uploadResumeBuffer = async (buffer, options = {}) => {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',



        folder: 'talentbridge/resumes',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options
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

// Delete resume asset.
export const deleteResumeAsset = async (publicId) => {
  if (!publicId || !cloudinaryConfig) return;

  try {
    const resImage = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });


    if (resImage.result !== 'ok') {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw'
      });
    }
  } catch (err) {

  }
};

// Handle Attachment Name.
const sanitizeAttachmentName = (value = '') =>
value.
trim().
replace(/[^a-zA-Z0-9]+/g, '_').
replace(/^_+|_+$/g, '').
slice(0, 80);

// Build resume download URL.
export const buildResumeDownloadUrl = (publicId, resumeName = 'Resume') => {
  if (!publicId || !cloudinaryConfig) return '';

  const attachmentName = sanitizeAttachmentName(`${resumeName}_Resume`) || 'Resume';


  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    flags: `attachment:${attachmentName}`,
    secure: true,
    sign_url: true
  });
};

export default cloudinary;