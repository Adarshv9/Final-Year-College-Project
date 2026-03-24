// ── Request ID Middleware ──
// Generates a unique request ID for every incoming request.
// Attaches it to req.id and sets the X-Request-Id response header.
import { randomUUID } from 'crypto';

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export default requestId;
