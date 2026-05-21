import Redis from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Configure redis client with auto-reconnection and retry logic
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis connection lost. Retrying in ${delay}ms...`);
    return delay;
  },
});

redisConnection.on('connect', () => {
  logger.info('Redis client connected');
});

redisConnection.on('error', (err) => {
  logger.error(`Redis connection error: ${err}`);
});

export default redisConnection;
