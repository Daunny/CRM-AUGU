import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { Router } from 'express';

// Mock express app with rate limiting
const createTestApp = () => {
  const app = express();
  const router = Router();

  // Standard analytics rate limiter (adjusted for testing)
  const analyticsRateLimiter = rateLimit({
    windowMs: 1000, // 1 second for faster tests
    max: 3, // 3 requests per second for testing
    message: 'Too many analytics requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Heavy analytics rate limiter (adjusted for testing)
  const heavyAnalyticsRateLimiter = rateLimit({
    windowMs: 2000, // 2 seconds for testing
    max: 2, // 2 requests per 2 seconds
    message: 'Too many complex analytics requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Mock endpoints
  router.get('/metrics', analyticsRateLimiter, (req, res) => {
    res.json({ success: true, data: 'metrics' });
  });

  router.get('/forecast', heavyAnalyticsRateLimiter, (req, res) => {
    res.json({ success: true, data: 'forecast' });
  });

  app.use('/api/sales-pipeline', router);
  return app;
};

describe('Sales Pipeline Rate Limiting', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Standard Analytics Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const responses = await Promise.all([
        request(app).get('/api/sales-pipeline/metrics'),
        request(app).get('/api/sales-pipeline/metrics'),
        request(app).get('/api/sales-pipeline/metrics'),
      ]);

      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    it('should block requests exceeding rate limit', async () => {
      // Make 3 requests (at limit)
      for (let i = 0; i < 3; i++) {
        const res = await request(app).get('/api/sales-pipeline/metrics');
        expect(res.status).toBe(200);
      }

      // 4th request should be rate limited
      const res = await request(app).get('/api/sales-pipeline/metrics');
      expect(res.status).toBe(429);
      expect(res.text).toContain('Too many analytics requests');
    });

    it('should include rate limit headers', async () => {
      const res = await request(app).get('/api/sales-pipeline/metrics');
      
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
      expect(res.headers).toHaveProperty('ratelimit-reset');
    });

    it('should reset rate limit after window expires', async () => {
      // Exhaust rate limit
      for (let i = 0; i < 3; i++) {
        await request(app).get('/api/sales-pipeline/metrics');
      }

      // Should be rate limited
      let res = await request(app).get('/api/sales-pipeline/metrics');
      expect(res.status).toBe(429);

      // Wait for window to reset (1 second + buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should work again
      res = await request(app).get('/api/sales-pipeline/metrics');
      expect(res.status).toBe(200);
    });
  });

  describe('Heavy Analytics Rate Limiting', () => {
    it('should have stricter limits for heavy operations', async () => {
      // First 2 requests should succeed
      const res1 = await request(app).get('/api/sales-pipeline/forecast');
      expect(res1.status).toBe(200);

      const res2 = await request(app).get('/api/sales-pipeline/forecast');
      expect(res2.status).toBe(200);

      // 3rd request should be rate limited
      const res3 = await request(app).get('/api/sales-pipeline/forecast');
      expect(res3.status).toBe(429);
      expect(res3.text).toContain('Too many complex analytics requests');
    });

    it('should have longer window for heavy operations', async () => {
      // Exhaust rate limit
      await request(app).get('/api/sales-pipeline/forecast');
      await request(app).get('/api/sales-pipeline/forecast');

      // Should be rate limited
      let res = await request(app).get('/api/sales-pipeline/forecast');
      expect(res.status).toBe(429);

      // Wait 1 second (not enough for 2-second window)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should still be rate limited
      res = await request(app).get('/api/sales-pipeline/forecast');
      expect(res.status).toBe(429);

      // Wait another 1.2 seconds (total > 2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Should work again
      res = await request(app).get('/api/sales-pipeline/forecast');
      expect(res.status).toBe(200);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should decrement remaining requests correctly', async () => {
      const res1 = await request(app).get('/api/sales-pipeline/metrics');
      expect(res1.headers['ratelimit-limit']).toBe('3');
      expect(res1.headers['ratelimit-remaining']).toBe('2');

      const res2 = await request(app).get('/api/sales-pipeline/metrics');
      expect(res2.headers['ratelimit-remaining']).toBe('1');

      const res3 = await request(app).get('/api/sales-pipeline/metrics');
      expect(res3.headers['ratelimit-remaining']).toBe('0');
    });

    it('should provide retry-after header when rate limited', async () => {
      // Exhaust rate limit
      for (let i = 0; i < 3; i++) {
        await request(app).get('/api/sales-pipeline/metrics');
      }

      const res = await request(app).get('/api/sales-pipeline/metrics');
      expect(res.status).toBe(429);
      expect(res.headers).toHaveProperty('retry-after');
      
      const retryAfter = parseInt(res.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(1);
    });
  });

  describe('Different Endpoints Have Independent Limits', () => {
    it('should track rate limits independently per endpoint', async () => {
      // Exhaust metrics endpoint
      for (let i = 0; i < 3; i++) {
        const res = await request(app).get('/api/sales-pipeline/metrics');
        expect(res.status).toBe(200);
      }

      // Metrics should be rate limited
      let res = await request(app).get('/api/sales-pipeline/metrics');
      expect(res.status).toBe(429);

      // But forecast should still work (different rate limiter)
      res = await request(app).get('/api/sales-pipeline/forecast');
      expect(res.status).toBe(200);
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should rate limit globally in test environment', async () => {
      // Note: In test environment without trust proxy setup,
      // rate limiting is global rather than per-IP
      const testApp = createTestApp();
      
      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const res = await request(testApp)
          .get('/api/sales-pipeline/metrics');
        expect(res.status).toBe(200);
      }

      // 4th request should be rate limited regardless of IP header
      const res = await request(testApp)
        .get('/api/sales-pipeline/metrics')
        .set('X-Forwarded-For', '192.168.1.2');
      expect(res.status).toBe(429);
    });
  });
});