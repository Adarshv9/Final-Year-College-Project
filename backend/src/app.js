import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import ApiError from './utils/ApiError.js';
import routes from './routes/index.js';

const app = express();

// ── Security Headers ──
app.use(helmet());

// ── CORS ──
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Sanitize data against NoSQL injection ──
app.use(mongoSanitize());

// ── HTTP Request Logging ──
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate Limiting ──
app.use(generalLimiter);

// ── Root Route ──
app.get('/', (req, res) => {
  res.send('Hello World');
});

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// ── API Routes ──
app.use('/api/v1', routes);

// ── 404 Handler ──
app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Centralised Error Handler ──
app.use(errorHandler);

export default app;
