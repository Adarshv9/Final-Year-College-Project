/**
 * Enhanced operational error class.
 * Adds errorCode and details to the standard message + statusCode pattern.
 */
class ApiError extends Error {
  /**
   * @param {number}  statusCode    - HTTP status code
   * @param {string}  message       - Human-readable error message
   * @param {Array}   [errors]      - Field-level validation errors
   * @param {boolean} [isOperational] - Distinguishes trusted operational errors from bugs
   * @param {string}  [errorCode]   - Machine-readable error code (e.g. 'RESUME_NOT_FOUND')
   * @param {any}     [details]     - Additional context for debugging
   */
  constructor(
    statusCode,
    message,
    errors = [],
    isOperational = true,
    errorCode = null,
    details = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    // Capture a clean stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
