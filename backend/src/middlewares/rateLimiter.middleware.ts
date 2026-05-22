import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisConnection } from '../config/redis';
import logger from '../config/logger';

let store;
try {
  // Use RedisStore for production distributed rate limiting
  store = new RedisStore({
    // @ts-ignore
    sendCommand: async (...args: string[]) => {
      return await redisConnection.call(args[0], ...args.slice(1));
    },
  });
  logger.info('Rate limiter RedisStore initialized successfully');
} catch (err) {
  logger.warn('Failed to initialize RedisStore for rate limiter. Falling back to default memory store.');
}

export const apiRateLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  handler: (req: Request, res: Response, next: NextFunction, options: any) => {
    logger.warn(`Rate limit exceeded: IP ${req.ip} on ${req.method} ${req.originalUrl}`);
    res.status(429).json(options.message);
  },
});
