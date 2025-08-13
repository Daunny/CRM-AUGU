import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, validateRefreshToken } from '../middleware/auth.middleware';
import { validate, schemas } from '../utils/validator';
import { requireRole, UserRole } from '../middleware/rbac.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/register', 
  validate(schemas.register),
  authController.register
);

router.post('/login',
  validate(schemas.login),
  authController.login
);

router.post('/refresh',
  validateRefreshToken,
  authController.refreshToken
);

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication to all routes below

router.post('/logout', authController.logout);

router.get('/me', authController.getCurrentUser);

router.put('/change-password', authController.changePassword);

router.post('/validate', authController.validateToken);

// Admin routes
router.get('/sessions/:userId?',
  requireRole(UserRole.ADMIN),
  authController.getUserSessions
);

router.delete('/sessions/:sessionId',
  requireRole(UserRole.ADMIN),
  authController.revokeSession
);

export default router;