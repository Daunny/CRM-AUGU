import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import {
  getCompanyAnalytics,
  calculateHealthScore,
  calculateChurnRisk,
  calculateLifetimeValue,
  autoSegmentCompany,
  batchUpdateAnalytics,
} from '../controllers/company-analytics.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get company analytics dashboard
router.get('/:id/analytics', getCompanyAnalytics);

// Calculate specific metrics
router.post('/:id/health-score', authorize(['ADMIN', 'MANAGER']), calculateHealthScore);
router.post('/:id/churn-risk', authorize(['ADMIN', 'MANAGER']), calculateChurnRisk);
router.post('/:id/lifetime-value', authorize(['ADMIN', 'MANAGER']), calculateLifetimeValue);
router.post('/:id/auto-segment', authorize(['ADMIN', 'MANAGER']), autoSegmentCompany);

// Batch operations
router.post('/batch/update-analytics', authorize(['ADMIN']), batchUpdateAnalytics);

export default router;