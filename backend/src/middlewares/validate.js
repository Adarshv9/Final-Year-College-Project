// Validates request payloads against Joi schemas.

import ApiError from '../utils/ApiError.js';









// Validate .
const validate = (schema) => (req, _res, next) => {
  const validProperties = ['body', 'params', 'query'];
  const objectToValidate = {};

  validProperties.forEach((prop) => {
    if (schema.describe().keys[prop]) {
      objectToValidate[prop] = req[prop];
    }
  });

  const { error, value } = schema.validate(objectToValidate, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new ApiError(422, 'Validation failed', errors));
  }


  Object.assign(req, value);
  next();
};

export default validate;