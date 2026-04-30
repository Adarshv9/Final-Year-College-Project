// Defines the standard API error object used across the backend.




class ApiError extends Error {








  constructor(
  statusCode,
  message,
  errors = [],
  isOperational = true,
  errorCode = null,
  details = null)
  {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;


    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;