import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Centralised Express error-handling middleware.
 * Converts all errors into a consistent JSON shape.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message };

  // ── Mongoose bad ObjectId ──
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  // ── Mongoose duplicate key ──
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = new ApiError(409, `Duplicate value for field(s): ${field}`);
  }

  // ── Mongoose validation error ──
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, 'Validation failed', messages);
  }

  // ── JWT errors ──
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log server-side errors
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    // Include stack trace only in development
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
