import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getPipelineMetrics,
  getProposalAnalytics,
  getFunnelAnalysis,
  getSalesForecast,
  getTeamPerformance,
} from '../controllers/sales-pipeline.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Pipeline Analytics
router.get('/metrics', getPipelineMetrics);
router.get('/proposals', getProposalAnalytics);
router.get('/funnel', getFunnelAnalysis);
router.get('/forecast', getSalesForecast);
router.get('/team-performance', authorize(['ADMIN', 'MANAGER']), getTeamPerformance);

export default router;