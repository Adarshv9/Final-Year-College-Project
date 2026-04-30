// Connects the backend to the MongoDB database.

import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

const LEGACY_APPLICATION_INDEXES = ['job_1', 'applicant_1', 'job_1_applicant_1'];

// Handle Legacy Application Indexes.
const dropLegacyApplicationIndexes = async (connection) => {
  const collections = await connection.db.
  listCollections({ name: 'applications' }, { nameOnly: true }).
  toArray();

  if (collections.length === 0) return;

  const applicationCollection = connection.db.collection('applications');
  const indexes = await applicationCollection.indexes();

  for (const indexName of LEGACY_APPLICATION_INDEXES) {
    const exists = indexes.some((index) => index.name === indexName);
    if (!exists) continue;

    await applicationCollection.dropIndex(indexName);
    logger.info(`Dropped legacy applications index: ${indexName}`);
  }
};





// Connect DB.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri);
    await dropLegacyApplicationIndexes(conn.connection);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;