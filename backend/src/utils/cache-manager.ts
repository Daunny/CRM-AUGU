import Redis from 'ioredis';
import { createHash } from 'crypto';
import { env } from '../config/security.config';

export class CacheManager {
  private static instance: CacheManager;
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes
  private readonly cacheVersion: string = 'v1:'; // Version prefix for cache invalidation
  
  // Cache key prefixes for different data types
  private static readonly PREFIXES = {
    USER: 'user:',
    COMPANY: 'company:',
    LEAD: 'lead:',
    OPPORTUNITY: 'opp:',
    PROJECT: 'proj:',
    QUERY: 'query:',
    SESSION: 'sess:',
    PERMISSION: 'perm:',
    CONFIG: 'config:',
    STATS: 'stats:',
  };
  
  // TTL configurations (in seconds)
  private static readonly TTL = {
    SHORT: 60,        // 1 minute - volatile data
    MEDIUM: 300,      // 5 minutes - standard cache
    LONG: 3600,       // 1 hour - stable data
    VERY_LONG: 86400, // 24 hours - static data
    SESSION: 900,     // 15 minutes - user sessions
  };
  
  private constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis reconnection attempt ${times}, retrying in ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    });
    
    this.redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
      // Don't crash the application on Redis errors
    });
    
    this.redis.on('connect', () => {
      console.log('📦 Redis connected for caching');
    });
    
    this.redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
    
    this.redis.on('close', () => {
      console.log('❌ Redis connection closed');
    });
  }
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  // Generate cache key with version prefix and hash
  private generateKey(prefix: string, identifier: string | object): string {
    const versionedPrefix = `${this.cacheVersion}${prefix}`;
    
    if (typeof identifier === 'string') {
      return `${versionedPrefix}${identifier}`;
    }
    
    // Hash complex objects for consistent keys
    const hash = createHash('sha256')
      .update(JSON.stringify(identifier))
      .digest('hex')
      .substring(0, 16);
    
    return `${versionedPrefix}${hash}`;
  }
  
  // Check if Redis is connected and ready
  private isRedisReady(): boolean {
    return this.redis && this.redis.status === 'ready';
  }
  
  // Get data from cache with connection check
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check Redis connection status
      if (!this.isRedisReady()) {
        console.warn('Redis not ready, skipping cache get for key:', key);
        return null;
      }
      
      const data = await this.redis.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      // Return null to fallback to database
      return null;
    }
  }
  
  // Set data in cache with TTL and connection check
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      // Check Redis connection status
      if (!this.isRedisReady()) {
        console.warn('Redis not ready, skipping cache set for key:', key);
        return false;
      }
      
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      
      await this.redis.setex(key, expiry, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      // Continue operation even if cache fails
      return false;
    }
  }
  
  // Delete from cache with connection check
  async delete(key: string | string[]): Promise<number> {
    try {
      // Check Redis connection status
      if (!this.isRedisReady()) {
        console.warn('Redis not ready, skipping cache delete');
        return 0;
      }
      
      if (Array.isArray(key)) {
        return await this.redis.del(...key);
      }
      return await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return 0;
    }
  }
  
  // Clear cache by pattern with connection check
  async clearPattern(pattern: string): Promise<number> {
    try {
      // Check Redis connection status
      if (!this.isRedisReady()) {
        console.warn('Redis not ready, skipping cache clear pattern');
        return 0;
      }
      
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.redis.del(...keys);
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return 0;
    }
  }
  
  // Cache with automatic fetch if missing
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const fresh = await fetcher();
    
    // Store in cache
    await this.set(key, fresh, ttl);
    
    return fresh;
  }
  
  // Invalidate related caches
  async invalidateRelated(entityType: string, entityId: string): Promise<void> {
    const patterns = [
      `${entityType}:${entityId}`,
      `${entityType}:${entityId}:*`,
      `query:*${entityType}*`,
      `stats:${entityType}:*`,
    ];
    
    for (const pattern of patterns) {
      await this.clearPattern(pattern);
    }
  }
  
  // User-specific cache operations
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    const cacheKey = this.generateKey(CacheManager.PREFIXES.USER, `${userId}:${key}`);
    return this.get<T>(cacheKey);
  }
  
  async setUserCache(userId: string, key: string, value: any, ttl?: number): Promise<boolean> {
    const cacheKey = this.generateKey(CacheManager.PREFIXES.USER, `${userId}:${key}`);
    return this.set(cacheKey, value, ttl || CacheManager.TTL.MEDIUM);
  }
  
  async clearUserCache(userId: string): Promise<number> {
    return this.clearPattern(`${CacheManager.PREFIXES.USER}${userId}:*`);
  }
  
  // Query result cache operations
  async getQueryCache<T>(model: string, params: any): Promise<T | null> {
    const cacheKey = this.generateKey(CacheManager.PREFIXES.QUERY, { model, params });
    return this.get<T>(cacheKey);
  }
  
  async setQueryCache(model: string, params: any, value: any, ttl?: number): Promise<boolean> {
    const cacheKey = this.generateKey(CacheManager.PREFIXES.QUERY, { model, params });
    return this.set(cacheKey, value, ttl || CacheManager.TTL.SHORT);
  }
  
  // Company-specific cache
  async getCompanyCache<T>(companyId: string, key?: string): Promise<T | null> {
    const cacheKey = key 
      ? `${CacheManager.PREFIXES.COMPANY}${companyId}:${key}`
      : `${CacheManager.PREFIXES.COMPANY}${companyId}`;
    return this.get<T>(cacheKey);
  }
  
  async setCompanyCache(companyId: string, value: any, key?: string, ttl?: number): Promise<boolean> {
    const cacheKey = key
      ? `${CacheManager.PREFIXES.COMPANY}${companyId}:${key}`
      : `${CacheManager.PREFIXES.COMPANY}${companyId}`;
    return this.set(cacheKey, value, ttl || CacheManager.TTL.LONG);
  }
  
  // Session management
  async getSession(sessionId: string): Promise<any> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.SESSION}${sessionId}`;
    return this.get(cacheKey);
  }
  
  async setSession(sessionId: string, data: any): Promise<boolean> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.SESSION}${sessionId}`;
    return this.set(cacheKey, data, CacheManager.TTL.SESSION);
  }
  
  async destroySession(sessionId: string): Promise<number> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.SESSION}${sessionId}`;
    return this.delete(cacheKey);
  }
  
  // Permission cache
  async getPermissions(userId: string): Promise<any> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.PERMISSION}${userId}`;
    return this.get(cacheKey);
  }
  
  async setPermissions(userId: string, permissions: any): Promise<boolean> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.PERMISSION}${userId}`;
    return this.set(cacheKey, permissions, CacheManager.TTL.LONG);
  }
  
  // Statistics cache
  async getStats(key: string): Promise<any> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.STATS}${key}`;
    return this.get(cacheKey);
  }
  
  async setStats(key: string, stats: any, ttl?: number): Promise<boolean> {
    const cacheKey = `${this.cacheVersion}${CacheManager.PREFIXES.STATS}${key}`;
    return this.set(cacheKey, stats, ttl || CacheManager.TTL.LONG);
  }
  
  // Cache warming - preload frequently accessed data
  async warmCache(entities: Array<{ type: string; id: string; data: any }>): Promise<void> {
    const promises = entities.map(({ type, id, data }) => {
      const prefix = (CacheManager.PREFIXES as any)[type.toUpperCase()];
      if (!prefix) return Promise.resolve();
      
      const key = `${prefix}${id}`;
      return this.set(key, data, CacheManager.TTL.LONG);
    });
    
    await Promise.all(promises);
  }
  
  // Cache statistics
  async getCacheStats(): Promise<{
    connected: boolean;
    memory: any;
    keys: number;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const dbSize = await this.redis.dbsize();
      const stats = await this.redis.info('stats');
      
      // Parse Redis info output
      const parseInfo = (info: string, key: string): string => {
        const match = info.match(new RegExp(`${key}:([^\\r\\n]+)`));
        return match ? match[1] : '0';
      };
      
      return {
        connected: this.redis.status === 'ready',
        memory: {
          used: parseInfo(info, 'used_memory_human'),
          peak: parseInfo(info, 'used_memory_peak_human'),
          rss: parseInfo(info, 'used_memory_rss_human'),
        },
        keys: dbSize,
        hits: parseInt(parseInfo(stats, 'keyspace_hits')),
        misses: parseInt(parseInfo(stats, 'keyspace_misses')),
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        connected: false,
        memory: {},
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }
  }
  
  // Bulk operations with connection check
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      // Check Redis connection status
      if (!this.isRedisReady()) {
        console.warn('Redis not ready, skipping cache mget');
        return keys.map(() => null);
      }
      
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }
  
  async mset(items: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      // Check Redis connection status
      if (!this.isRedisReady()) {
        console.warn('Redis not ready, skipping cache mset');
        return false;
      }
      
      const pipeline = this.redis.pipeline();
      
      for (const { key, value, ttl } of items) {
        const serialized = JSON.stringify(value);
        const expiry = ttl || this.defaultTTL;
        pipeline.setex(key, expiry, serialized);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }
  
  // Lock mechanism for preventing race conditions
  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.set(lockKey, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }
  
  async releaseLock(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.del(lockKey);
    return result === 1;
  }
  
  // Cache tags for group invalidation
  async tagCache(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, CacheManager.TTL.VERY_LONG);
    }
    
    await pipeline.exec();
  }
  
  async invalidateTag(tag: string): Promise<number> {
    const keys = await this.redis.smembers(`tag:${tag}`);
    if (keys.length === 0) return 0;
    
    await this.redis.del(`tag:${tag}`, ...keys);
    return keys.length;
  }
  
  // Close connection
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();

// Export types and constants
export const CachePrefixes = CacheManager['PREFIXES'];
export const CacheTTL = CacheManager['TTL'];

export default cache;