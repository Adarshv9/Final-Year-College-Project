// ── Redis Cache Utility ──
// Thin wrapper with graceful no-op fallback when Redis is unavailable.
import { createClient } from 'redis';
import logger from './logger.js';

let _client = null;
let _connected = false;

const getClient = async () => {
  if (_client && _connected) return _client;

  try {
    _client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    _client.on('error', (err) => {
      logger.warn(`Redis error: ${err.message}`);
      _connected = false;
    });

    _client.on('connect', () => {
      logger.info('Redis connected');
      _connected = true;
    });

    _client.on('end', () => {
      _connected = false;
    });

    await _client.connect();
    _connected = true;
  } catch (err) {
    logger.warn(`Redis unavailable, caching disabled: ${err.message}`);
    _client = null;
    _connected = false;
  }

  return _connected ? _client : null;
};

// Initialize on first import (non-blocking)
getClient().catch(() => {});

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {Promise<any|null>} Parsed value or null on miss/error
 */
export const getCache = async (key) => {
  try {
    const client = await getClient();
    if (!client) return null;
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Set a value in cache with optional TTL.
 * @param {string} key
 * @param {any}    value
 * @param {number} [ttlSeconds=300] - Default 5 minutes
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    const client = await getClient();
    if (!client) return;
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // silent: cache is optional
  }
};

/**
 * Delete a key from cache.
 * @param {string} key
 */
export const delCache = async (key) => {
  try {
    const client = await getClient();
    if (!client) return;
    await client.del(key);
  } catch {
    // silent
  }
};

export default { getCache, setCache, delCache };
