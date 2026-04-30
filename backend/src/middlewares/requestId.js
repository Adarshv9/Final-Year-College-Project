// Attaches a unique request ID to each incoming request.



import { randomUUID } from 'crypto';

// Handle ID.
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export default requestId;