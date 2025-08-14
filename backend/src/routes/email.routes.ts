import { Router } from 'express';
import {
  sendEmail,
  sendBulkEmails,
  sendTestEmail,
  testEmailConnection,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTaskAssignmentEmail,
  sendProposalStatusEmail,
  sendMeetingReminderEmail,
  sendReportGeneratedEmail,
  sendDailyDigestEmail,
  sendSystemAnnouncement,
} from '../controllers/email.controller';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// General email endpoints
router.post('/send', authorize(['ADMIN', 'OPERATOR']), sendEmail);
router.post('/send-bulk', authorize(['ADMIN', 'OPERATOR']), sendBulkEmails);
router.post('/test', authorize(['ADMIN']), sendTestEmail);
router.get('/test-connection', authorize(['ADMIN']), testEmailConnection);

// Automated email endpoints
router.post('/welcome', authorize(['ADMIN', 'OPERATOR']), sendWelcomeEmail);
router.post('/password-reset', sendPasswordResetEmail); // All authenticated users can request password reset
router.post('/task-assigned', authorize(['ADMIN', 'OPERATOR', 'MEMBER']), sendTaskAssignmentEmail);
router.post('/proposal-status', authorize(['ADMIN', 'OPERATOR']), sendProposalStatusEmail);
router.post('/meeting-reminder', authorize(['ADMIN', 'OPERATOR', 'MEMBER']), sendMeetingReminderEmail);
router.post('/report-generated', authorize(['ADMIN', 'OPERATOR']), sendReportGeneratedEmail);
router.post('/daily-digest', authorize(['ADMIN', 'OPERATOR']), sendDailyDigestEmail);
router.post('/system-announcement', authorize(['ADMIN']), sendSystemAnnouncement);

export default router;