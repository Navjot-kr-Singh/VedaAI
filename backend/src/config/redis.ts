import Redis, { RedisOptions } from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const isSecure = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io');

const connectionOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis connection lost. Retrying in ${delay}ms...`);
    return delay;
  },
};

if (isSecure) {
  connectionOptions.tls = {};
}

// Configure redis client with auto-reconnection and retry logic
export const redisConnection = new Redis(redisUrl, connectionOptions);

redisConnection.on('connect', () => {
  logger.info('Redis client connected');
});

redisConnection.on('error', (err) => {
  logger.error(`Redis connection error: ${err}`);
});

export default redisConnection;
