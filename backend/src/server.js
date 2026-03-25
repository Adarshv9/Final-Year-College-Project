// Server bootstrap: validates config, connects to MongoDB, and starts Express.
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import connectDB from './config/db.js';
import {
  startDecisionEmailProcessor,
  stopDecisionEmailProcessor,
} from './services/application.service.js';
import logger from './utils/logger.js';

/**
 * Bootstrap the server:
 * 1. Validate environment variables
 * 2. Connect to MongoDB
 * 3. Start listening
 */
const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    logger.info('MongoDB connected');
    startDecisionEmailProcessor();

    const server = app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────────
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      stopDecisionEmailProcessor();
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
