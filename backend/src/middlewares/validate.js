import ApiError from '../utils/ApiError.js';

/**
 * Returns an Express middleware that validates the request
 * against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema with optional
 *   `body`, `params`, and `query` keys.
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, _res, next) => {
  const validProperties = ['body', 'params', 'query'];
  const objectToValidate = {};

  validProperties.forEach((prop) => {
    if (schema.describe().keys[prop]) {
      objectToValidate[prop] = req[prop];
    }
  });

  const { error, value } = schema.validate(objectToValidate, {
    abortEarly: false, // collect all errors
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new ApiError(422, 'Validation failed', errors));
  }

  // Replace request properties with validated (and sanitised) values
  Object.assign(req, value);
  next();
};

export default validate;
