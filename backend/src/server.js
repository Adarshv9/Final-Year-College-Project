import app from './app.js';
import { env, validateEnv } from './config/env.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { checkRedisAvailable } from './config/redis.js';

/**
 * Bootstrap the server:
 * 1. Validate environment variables
 * 2. Connect to MongoDB
 * 3. Check Redis / BullMQ availability
 * 4. Start resume worker (if Redis available)
 * 5. Start listening
 */
const startServer = async () => {
  try {
    // Validate required environment variables
    validateEnv();

    // Connect to MongoDB
    await connectDB();
    logger.info('MongoDB connected');

    // Check Redis availability (non-blocking)
    const redisOk = await checkRedisAvailable();

    // Start BullMQ worker only if Redis is available
    if (redisOk) {
      const { startResumeWorker } = await import('./workers/resume.worker.js');
      startResumeWorker();
      logger.info('Resume background worker started');
    } else {
      logger.warn('Redis unavailable — resume processing will run synchronously');
    }

    // Start Express server
    const server = app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────────
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      if (redisOk) {
        const { closeResumeWorker } = await import('./workers/resume.worker.js');
        await closeResumeWorker();
      }

      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
