import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB using Mongoose.
 * Retries are handled by Mongoose's built-in reconnection logic.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
