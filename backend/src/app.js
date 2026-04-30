// Configures the Express app with middleware, routes, and error handling.

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





app.use(helmet());


app.use(requestIdMiddleware);


app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use(cookieParser());


app.use(mongoSanitize());


if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}


app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`[METRIC] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});


app.use(generalLimiter);


app.get('/', (_req, res) => {
  res.send('Hello World');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});




app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));




app.use('/api/v1', routes);


app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, [], true, 'ROUTE_NOT_FOUND'));
});


app.use(errorHandler);

export default app;