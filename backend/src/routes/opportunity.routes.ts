import { Router } from 'express';
import { authenticate, authorizeByTier } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { UserTier } from '@prisma/client';
import * as opportunityController from '../controllers/opportunity.controller';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createOpportunitySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    companyId: z.string().uuid(),
    branchId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
    type: z.enum(['NEW_BUSINESS', 'EXISTING_BUSINESS', 'RENEWAL', 'UPGRADE']).optional(),
    stage: z.enum([
      'QUALIFYING',
      'NEEDS_ANALYSIS',
      'VALUE_PROPOSITION',
      'DECISION_MAKERS',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST'
    ]).optional(),
    probability: z.number().min(0).max(100).optional(),
    amount: z.number().optional(),
    currency: z.string().default('KRW'),
    expectedCloseDate: z.string().optional(),
    competitorInfo: z.string().optional(),
    nextAction: z.string().optional(),
    nextActionDate: z.string().optional(),
    lossReason: z.string().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.any().optional(),
    ownerId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
  }),
});

const updateOpportunitySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    companyId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
    type: z.enum(['NEW_BUSINESS', 'EXISTING_BUSINESS', 'RENEWAL', 'UPGRADE']).optional(),
    stage: z.enum([
      'QUALIFYING',
      'NEEDS_ANALYSIS',
      'VALUE_PROPOSITION',
      'DECISION_MAKERS',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST'
    ]).optional(),
    probability: z.number().min(0).max(100).optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    expectedCloseDate: z.string().optional(),
    closedAt: z.string().optional(),
    wonAmount: z.number().optional(),
    competitorInfo: z.string().optional(),
    nextAction: z.string().optional(),
    nextActionDate: z.string().optional(),
    lossReason: z.string().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.any().optional(),
    ownerId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
  }),
});

// Opportunity routes
router.get(
  '/',
  authenticate,
  opportunityController.getOpportunities
);

router.get(
  '/analytics/pipeline',
  authenticate,
  opportunityController.getPipelineAnalytics
);

router.get(
  '/:id',
  authenticate,
  opportunityController.getOpportunityById
);

router.post(
  '/',
  authenticate,
  validate(createOpportunitySchema),
  opportunityController.createOpportunity
);

router.patch(
  '/:id',
  authenticate,
  validate(updateOpportunitySchema),
  opportunityController.updateOpportunity
);

router.delete(
  '/:id',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  opportunityController.deleteOpportunity
);

export default router;