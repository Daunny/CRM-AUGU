import redisClient from '../config/redis';
import logger from './logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheManager {
  private static defaultTTL = 3600; // 1 hour
  private static prefix = 'crm:';

  // Generate cache key
  private static generateKey(prefix: string, key: string): string {
    return `${this.prefix}${prefix}:${key}`;
  }

  // Set cache
  static async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = this.generateKey(options.prefix || 'general', key);
      const ttl = options.ttl || this.defaultTTL;
      const stringValue = JSON.stringify(value);
      
      await redisClient.setEx(cacheKey, ttl, stringValue);
      logger.debug(`Cache set: ${cacheKey}`);
    } catch (error) {
      logger.error('Cache set error:', error);
      // Don't throw error, let the app continue without cache
    }
  }

  // Get cache
  static async get<T>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(options.prefix || 'general', key);
      const value = await redisClient.get(cacheKey);
      
      if (!value) {
        return null;
      }
      
      logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache
  static async delete(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(options.prefix || 'general', key);
      await redisClient.del(cacheKey);
      logger.debug(`Cache deleted: ${cacheKey}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  // Delete cache by pattern
  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.prefix}${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.debug(`Cache deleted by pattern: ${pattern}, ${keys.length} keys deleted`);
      }
    } catch (error) {
      logger.error('Cache delete by pattern error:', error);
    }
  }

  // Clear all cache
  static async clear(): Promise<void> {
    try {
      await redisClient.flushDb();
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  // Cache decorator for methods
  static cache(options: CacheOptions = {}) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        
        // Try to get from cache
        const cached = await CacheManager.get(cacheKey, options);
        if (cached) {
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Save to cache
        await CacheManager.set(cacheKey, result, options);
        
        return result;
      };

      return descriptor;
    };
  }
}

// Cache invalidation helpers
export class CacheInvalidator {
  // Invalidate proposal cache
  static async invalidateProposal(proposalId: string): Promise<void> {
    await CacheManager.deleteByPattern(`proposal:*${proposalId}*`);
  }

  // Invalidate opportunity cache
  static async invalidateOpportunity(opportunityId: string): Promise<void> {
    await CacheManager.deleteByPattern(`opportunity:*${opportunityId}*`);
  }

  // Invalidate company cache
  static async invalidateCompany(companyId: string): Promise<void> {
    await CacheManager.deleteByPattern(`company:*${companyId}*`);
  }

  // Invalidate user cache
  static async invalidateUser(userId: string): Promise<void> {
    await CacheManager.deleteByPattern(`user:*${userId}*`);
  }
}

export { CacheManager as cache };