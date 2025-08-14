import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  sendNotification,
  sendAnnouncement,
  testNotifications,
} from '../controllers/notification.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// User notification routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/clear-read', deleteReadNotifications);

// Admin notification routes
router.post('/send', authorize('ADMIN', 'MANAGER'), sendNotification);
router.post('/announcement', authorize('ADMIN'), sendAnnouncement);

// Test routes (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/:type', testNotifications);
}

export default router;