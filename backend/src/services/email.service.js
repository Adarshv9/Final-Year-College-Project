import { Resend } from 'resend';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

let resendClient = null;

const RESEND_SANDBOX_FROM = 'onboarding@resend.dev';
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
]);

const resolveFromAddress = (configuredFrom) => {
  if (!configuredFrom) return RESEND_SANDBOX_FROM;

  const normalizedFrom = configuredFrom.trim().toLowerCase();
  const domain = normalizedFrom.split('@')[1] || '';

  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    logger.warn(
      `[Email] EMAIL_FROM=${configuredFrom} uses a personal inbox domain that Resend cannot send from without domain verification. Falling back to ${RESEND_SANDBOX_FROM}.`
    );
    return RESEND_SANDBOX_FROM;
  }

  return configuredFrom;
};

export const EMAIL_FROM_ADDRESS = resolveFromAddress(env.emailFrom);

const getResendClient = () => {
  if (!resendClient) {
    if (!env.resendApiKey) {
      throw new ApiError(503, 'Email delivery is not configured. Set RESEND_API_KEY.');
    }

    resendClient = new Resend(env.resendApiKey);
  }

  return resendClient;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  from = EMAIL_FROM_ADDRESS,
  context = 'transactional',
}) => {
  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({ from, to, subject, html });

    if (error) {
      logger.error(`[Email:${context}] Resend delivery failed: ${error.message || JSON.stringify(error)}`);
      throw new ApiError(503, 'Failed to send email. Please try again later.');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.error(`[Email:${context}] Unexpected email error: ${error.message}`);
    throw new ApiError(503, 'Failed to send email. Please try again later.');
  }
};
