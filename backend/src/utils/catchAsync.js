/**
 * Wraps an async Express route handler so that
 * any rejected promise is forwarded to the next() error handler
 * instead of causing an unhandled promise rejection.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function}  - Express-compatible handler
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
