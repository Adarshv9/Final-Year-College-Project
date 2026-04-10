// ── Express App Configuration ──
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import requestIdMiddleware from './middlewares/requestId.js';
import ApiError from './utils/ApiError.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware order matters: security and request metadata come first,
// parsers/sanitizers run before routes, and the error handler stays last.

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── Request ID — attach before everything so it's available in logs ───────────
app.use(requestIdMiddleware);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookie Parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Data Sanitization ─────────────────────────────────────────────────────────
app.use(mongoSanitize());

// ── HTTP Logger ───────────────────────────────────────────────────────────────
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── API Latency Metrics ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`[METRIC] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ── Rate Limiter ──────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send('Hello World');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// ── Static Files ──────────────────────────────────────────────────────────────
// Uploaded resume files are exposed from a separate folder instead of being
// served through the API controllers.
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
// Versioning the API at the mount point makes it easier to evolve routes
// without changing the rest of the server setup.
app.use('/api/v1', routes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, [], true, 'ROUTE_NOT_FOUND'));
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
