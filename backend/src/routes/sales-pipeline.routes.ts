import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import rateLimit from 'express-rate-limit';
import {
  getPipelineMetrics,
  getProposalAnalytics,
  getFunnelAnalysis,
  getSalesForecast,
  getTeamPerformance,
} from '../controllers/sales-pipeline.controller';
import {
  pipelineMetricsSchema,
  proposalAnalyticsSchema,
  funnelAnalysisSchema,
  salesForecastSchema,
  teamPerformanceSchema,
} from '../validators/sales-pipeline.validator';

const router = Router();

// Rate limiting for analytics endpoints (expensive operations)
const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many analytics requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Heavy analytics rate limiter (for forecast and complex queries)
const heavyAnalyticsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  message: 'Too many complex analytics requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(authenticate);

// Pipeline Analytics with validation and rate limiting
router.get('/metrics', 
  analyticsRateLimiter,
  validate(pipelineMetricsSchema), 
  getPipelineMetrics
);

router.get('/proposals', 
  analyticsRateLimiter,
  validate(proposalAnalyticsSchema), 
  getProposalAnalytics
);

router.get('/funnel', 
  analyticsRateLimiter,
  validate(funnelAnalysisSchema), 
  getFunnelAnalysis
);

router.get('/forecast', 
  heavyAnalyticsRateLimiter,
  validate(salesForecastSchema), 
  getSalesForecast
);

router.get('/team-performance', 
  authorize('ADMIN', 'MANAGER'),
  analyticsRateLimiter,
  validate(teamPerformanceSchema), 
  getTeamPerformance
);

export default router;