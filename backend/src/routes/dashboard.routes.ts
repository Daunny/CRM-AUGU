import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getExecutiveDashboard,
  getSalesDashboard,
  getProjectDashboard,
  getCustomerDashboard,
  getKPIs,
  getSalesMetrics,
  getProjectMetrics,
  getCustomerMetrics,
  getTeamPerformance,
  getRevenueAnalysis,
  getPipelineOverview,
  getSalesActivities,
  getSalesTargets,
  getTopDeals,
  getConversionRates,
  getSalesForecast,
  getCustomerSegmentation,
  getChurnRiskAnalysis,
} from '../controllers/dashboard.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Main Dashboards
router.get('/executive', authorize('ADMIN', 'MANAGER'), getExecutiveDashboard);
router.get('/sales', getSalesDashboard);
router.get('/project', getProjectDashboard);
router.get('/customer', getCustomerDashboard);

// Executive Dashboard Widgets
router.get('/kpis', getKPIs);
router.get('/sales-metrics', getSalesMetrics);
router.get('/project-metrics', getProjectMetrics);
router.get('/customer-metrics', getCustomerMetrics);
router.get('/team-performance', authorize('ADMIN', 'MANAGER'), getTeamPerformance);
router.get('/revenue-analysis', authorize('ADMIN', 'MANAGER'), getRevenueAnalysis);

// Sales Dashboard Widgets
router.get('/pipeline-overview', getPipelineOverview);
router.get('/sales-activities', getSalesActivities);
router.get('/sales-targets', getSalesTargets);
router.get('/top-deals', getTopDeals);
router.get('/conversion-rates', getConversionRates);
router.get('/sales-forecast', getSalesForecast);

// Customer Dashboard Widgets
router.get('/customer-segmentation', getCustomerSegmentation);
router.get('/churn-risk', getChurnRiskAnalysis);

export default router;