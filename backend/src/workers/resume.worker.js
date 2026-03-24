// ── Resume Processing Worker ──
import fs from 'fs';
import { Worker } from 'bullmq';
import { QUEUE_NAME } from '../queues/resume.queue.js';
import { bullMQRedisOptions } from '../config/redis.js';
import * as resumeService from '../services/resume.service.js';
import logger from '../utils/logger.js';

let _worker = null;

/**
 * Start the resume processing worker.
 * Should be called once during server startup.
 */
export const startResumeWorker = () => {
  if (_worker) return _worker;

  _worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { userId, filePath } = job.data;
      const start = Date.now();

      logger.info(`[Worker] Processing resume job ${job.id} for user ${userId}`);

      try {
        const pdfBuffer = fs.readFileSync(filePath);
        await resumeService.processResumeFile(userId, pdfBuffer, filePath);

        const elapsed = Date.now() - start;
        logger.info(`[METRIC] Resume job ${job.id} completed in ${elapsed}ms`);
      } catch (error) {
        logger.error(`[Worker] Resume job ${job.id} failed: ${error.message}`);
        throw error; // Let BullMQ handle retry
      }
    },
    {
      connection: bullMQRedisOptions,
      concurrency: 2, // Process up to 2 resumes simultaneously
    }
  );

  _worker.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} completed successfully`);
  });

  _worker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
  });

  _worker.on('error', (err) => {
    logger.error(`[Worker] Worker error: ${err.message}`);
  });

  logger.info('Resume worker started');
  return _worker;
};

/**
 * Gracefully close the worker.
 */
export const closeResumeWorker = async () => {
  if (_worker) {
    await _worker.close();
    _worker = null;
    logger.info('Resume worker closed');
  }
};
