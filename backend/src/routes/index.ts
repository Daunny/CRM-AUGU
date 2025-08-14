import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import fileRoutes from './file.routes';
import emailRoutes from './email.routes';
// import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Health check - no auth required
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info - no auth required
router.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'CRM AUGU API',
    version: '1.0.0',
    description: 'Customer-centric CRM Platform API',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      customers: '/api/customers',
      opportunities: '/api/opportunities',
      projects: '/api/projects',
      tasks: '/api/tasks',
      users: '/api/users'
    }
  });
});

// Auth routes - mixed (some public, some protected)
router.use('/auth', authRoutes);

// Dashboard routes (protected)
router.use('/dashboard', dashboardRoutes);

// Report routes (protected)
router.use('/reports', reportRoutes);

// Notification routes (protected)
router.use('/notifications', notificationRoutes);

// File routes (mixed - some public, some protected)
router.use('/files', fileRoutes);

// Email routes (protected)
router.use('/email', emailRoutes);

// All routes below require authentication
// router.use(authenticate);

// Customer routes (to be implemented)
// router.use('/customers', customerRoutes);

// Opportunity routes (to be implemented)
// router.use('/opportunities', opportunityRoutes);

// Project routes (to be implemented)
// router.use('/projects', projectRoutes);

// Task routes (to be implemented)
// router.use('/tasks', taskRoutes);

// User routes (to be implemented)
// router.use('/users', userRoutes);

// Activity routes (to be implemented)
// router.use('/activities', activityRoutes);

// Report routes (to be implemented)
// router.use('/reports', reportRoutes);

export default router;