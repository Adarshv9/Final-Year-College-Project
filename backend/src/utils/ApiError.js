/**
 * Custom operational error class.
 * Extends the native Error to include an HTTP status code and
 * an optional array of detailed validation errors.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message    - Human-readable error message
   * @param {Array}  [errors]   - Optional array of field-level errors
   * @param {boolean} [isOperational] - Distinguishes trusted operational errors from programming bugs
   */
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    // Capture a clean stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
