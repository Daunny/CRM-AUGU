import { Router } from 'express';
import { authenticate, authorizeByTier } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { UserTier } from '@prisma/client';
import * as leadController from '../controllers/lead.controller';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createLeadSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50),
    companyName: z.string().min(1).max(200),
    contactName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'ADVERTISEMENT', 'SOCIAL_MEDIA', 'EVENT', 'OTHER']).optional(),
    sourceDetail: z.string().optional(),
    notes: z.string().optional(),
    assignedToId: z.string().uuid().optional(),
    assignedTeamId: z.string().uuid().optional(),
  }),
});

const updateLeadSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    companyName: z.string().min(1).max(200).optional(),
    contactName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'ADVERTISEMENT', 'SOCIAL_MEDIA', 'EVENT', 'OTHER']).optional(),
    sourceDetail: z.string().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST']).optional(),
    bantBudget: z.boolean().optional(),
    bantAuthority: z.boolean().optional(),
    bantNeed: z.boolean().optional(),
    bantTimeline: z.boolean().optional(),
    notes: z.string().optional(),
    assignedToId: z.string().uuid().optional(),
    assignedTeamId: z.string().uuid().optional(),
  }),
});

const assignLeadSchema = z.object({
  body: z.object({
    leadId: z.string().uuid(),
    assignedToId: z.string().uuid().optional(),
    assignedTeamId: z.string().uuid().optional(),
    assignmentReason: z.string().optional(),
  }),
});

const rejectAssignmentSchema = z.object({
  body: z.object({
    reason: z.string().min(1),
  }),
});

const convertLeadSchema = z.object({
  body: z.object({
    companyId: z.string().uuid().optional(),
    newCompanyData: z.object({
      code: z.string().min(1).max(50),
      name: z.string().min(1).max(200),
      businessNumber: z.string().optional(),
      industryId: z.string().uuid().optional(),
    }).optional(),
    opportunityData: z.object({
      code: z.string().min(1).max(50),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      amount: z.number().optional(),
      expectedCloseDate: z.string().optional(),
      assignedToId: z.string().uuid().optional(),
      assignedTeamId: z.string().uuid().optional(),
    }),
  }),
});

// Lead routes
router.get(
  '/',
  authenticate,
  leadController.getLeads
);

router.get(
  '/:id',
  authenticate,
  leadController.getLeadById
);

router.post(
  '/',
  authenticate,
  validate(createLeadSchema),
  leadController.createLead
);

router.patch(
  '/:id',
  authenticate,
  validate(updateLeadSchema),
  leadController.updateLead
);

router.delete(
  '/:id',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  leadController.deleteLead
);

// Lead Assignment routes
router.post(
  '/assign',
  authenticate,
  validate(assignLeadSchema),
  leadController.assignLead
);

router.post(
  '/assignments/:id/approve',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  leadController.approveAssignment
);

router.post(
  '/assignments/:id/reject',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  validate(rejectAssignmentSchema),
  leadController.rejectAssignment
);

// Lead Conversion
router.post(
  '/:id/convert',
  authenticate,
  validate(convertLeadSchema),
  leadController.convertLead
);

export default router;