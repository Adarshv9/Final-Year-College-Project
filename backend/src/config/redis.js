// ── Redis Connection for BullMQ ──
// Separate from the redis client used for caching.
// BullMQ requires an ioredis-compatible connection config.
import logger from '../utils/logger.js';

export const bullMQRedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
};

let redisAvailable = true;

// Test connection without blocking server startup
const testRedisConnection = async () => {
  try {
    const { default: IORedis } = await import('ioredis');
    const testClient = new IORedis({ ...bullMQRedisOptions, lazyConnect: true });
    await testClient.connect();
    await testClient.ping();
    await testClient.quit();
    logger.info('BullMQ Redis connection available');
    return true;
  } catch (err) {
    logger.warn(`BullMQ Redis unavailable: ${err.message}. Queue-based processing disabled.`);
    return false;
  }
};

export const checkRedisAvailable = async () => {
  redisAvailable = await testRedisConnection();
  return redisAvailable;
};

export const isRedisAvailable = () => redisAvailable;
