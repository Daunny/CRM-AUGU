import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
  }
})();

// Cache utilities
export const cache = {
  get: async (key: string): Promise<any> => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  },
  
  set: async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key: ${key}`, error);
    }
  },
  
  del: async (key: string): Promise<void> => {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key: ${key}`, error);
    }
  },
  
  flush: async (): Promise<void> => {
    try {
      await redisClient.flushAll();
    } catch (error) {
      logger.error('Cache flush error', error);
    }
  }
};

export default redisClient;