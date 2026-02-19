import app from './app.js';
import { env, validateEnv } from './config/env.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

/**
 * Bootstrap the server:
 * 1. Validate environment variables
 * 2. Connect to MongoDB
 * 3. Start listening on the configured port
 */
const startServer = async () => {
  try {
    // Validate required environment variables
    validateEnv();

    // Connect to MongoDB
    await connectDB();
    console.log("MongoDB connected");

    // Start Express server
    const server = app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
      console.log(`Server started on port ${env.port}`);
    });

    // ── Graceful shutdown ──
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
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
