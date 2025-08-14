import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  // Template Management
  createReportTemplate,
  getReportTemplates,
  getReportTemplateById,
  updateReportTemplate,
  deleteReportTemplate,
  // Report Management
  generateReport,
  getReports,
  getReportById,
  deleteReport,
  // Quick Report Generation
  generateSalesReport,
  generateProjectStatusReport,
  generateCustomerAnalysisReport,
  generateFinancialSummaryReport,
  generateTeamPerformanceReport,
  generateExecutiveSummaryReport,
} from '../controllers/report.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Report Template Management
router.post('/templates', authorize('ADMIN', 'MANAGER'), createReportTemplate);
router.get('/templates', getReportTemplates);
router.get('/templates/:id', getReportTemplateById);
router.put('/templates/:id', authorize('ADMIN', 'MANAGER'), updateReportTemplate);
router.delete('/templates/:id', authorize('ADMIN'), deleteReportTemplate);

// Report Generation and Management
router.post('/generate', generateReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteReport);

// Quick Report Generation Endpoints
router.get('/generate/sales', generateSalesReport);
router.get('/generate/project-status', generateProjectStatusReport);
router.get('/generate/customer-analysis', generateCustomerAnalysisReport);
router.get('/generate/financial-summary', authorize('ADMIN', 'MANAGER'), generateFinancialSummaryReport);
router.get('/generate/team-performance', authorize('ADMIN', 'MANAGER'), generateTeamPerformanceReport);
router.get('/generate/executive-summary', authorize('ADMIN'), generateExecutiveSummaryReport);

export default router;