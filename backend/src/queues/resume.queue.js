// ── Resume Processing Queue ──
import { Queue } from 'bullmq';
import { bullMQRedisOptions } from '../config/redis.js';
import logger from '../utils/logger.js';

export const QUEUE_NAME = 'resume-processing';

let _queue = null;

export const getResumeQueue = () => {
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      connection: bullMQRedisOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });

    _queue.on('error', (err) => {
      logger.error(`Resume queue error: ${err.message}`);
    });
  }
  return _queue;
};

/**
 * Enqueue a resume processing job.
 * @param {{ userId: string, filePath: string }} data
 * @returns {Promise<Job>} BullMQ job
 */
export const addResumeJob = async (data) => {
  const queue = getResumeQueue();
  const job = await queue.add('parse-resume', data, {
    jobId: `resume-${data.userId}-${Date.now()}`,
  });
  logger.info(`Resume job enqueued: ${job.id} for user ${data.userId}`);
  return job;
};
