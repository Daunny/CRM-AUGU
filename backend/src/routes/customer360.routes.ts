import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as customer360Controller from '../controllers/customer360.controller';

const router = Router();

// Customer 360 View routes
router.get(
  '/:companyId/view',
  authenticate,
  customer360Controller.getCustomer360View
);

router.get(
  '/:companyId/interactions',
  authenticate,
  customer360Controller.getInteractionHistory
);

router.get(
  '/:companyId/revenue',
  authenticate,
  customer360Controller.getRevenueAnalytics
);

router.get(
  '/:companyId/risk',
  authenticate,
  customer360Controller.getRiskAssessment
);

export default router;