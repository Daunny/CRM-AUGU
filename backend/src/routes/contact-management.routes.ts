import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as contactManagementController from '../controllers/contact-management.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search contacts with advanced filtering
router.get(
  '/search',
  contactManagementController.searchContacts
);

// Get contact engagement metrics
router.get(
  '/:contactId/engagement-metrics',
  contactManagementController.getContactEngagementMetrics
);

// Get contact influence score
router.get(
  '/:contactId/influence-score',
  contactManagementController.getContactInfluenceScore
);

// Get contact relationship map
router.get(
  '/:contactId/relationship-map',
  contactManagementController.getContactRelationshipMap
);

// Update contact preferences
router.put(
  '/:contactId/preferences',
  contactManagementController.updateContactPreferences
);

// Get contact communication history
router.get(
  '/:contactId/communication-history',
  contactManagementController.getContactCommunicationHistory
);

// Find duplicate contacts
router.get(
  '/duplicates/find',
  contactManagementController.findDuplicateContacts
);

// Merge duplicate contacts
router.post(
  '/duplicates/merge',
  contactManagementController.mergeContacts
);

// Export contacts to CSV
router.get(
  '/export/csv',
  contactManagementController.exportContactsToCSV
);

export default router;