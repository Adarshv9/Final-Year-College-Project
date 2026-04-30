// Loads environment variables and exposes normalized backend config.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/college_project',
  cloudinaryUrl: process.env.CLOUDINARY_URL || '',

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  email: {
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    secure: process.env.EMAIL_SECURE
      ? process.env.EMAIL_SECURE === 'true'
      : true,
    connectionTimeoutMs: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT_MS, 10) || 10000,
    greetingTimeoutMs: parseInt(process.env.EMAIL_GREETING_TIMEOUT_MS, 10) || 10000,
    socketTimeoutMs: parseInt(process.env.EMAIL_SOCKET_TIMEOUT_MS, 10) || 15000,
    sendTimeoutMs: parseInt(process.env.EMAIL_SEND_TIMEOUT_MS, 10) || 15000,
  },

};

/**
 * Validate that critical environment variables are set.
 * Throws on missing required values in production.
 */
export const validateEnv = () => {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
