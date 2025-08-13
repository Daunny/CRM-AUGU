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

const createProposalSchema = z.object({
  body: z.object({
    opportunityId: z.string().uuid(),
    code: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    version: z.string().min(1).max(20),
    content: z.string().optional(),
    validUntil: z.string().optional(),
    proposedAmount: z.number(),
    discount: z.number().optional(),
    finalAmount: z.number(),
    terms: z.string().optional(),
    attachments: z.array(z.string()).optional(),
  }),
});

const updateProposalSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    title: z.string().min(1).max(200).optional(),
    version: z.string().min(1).max(20).optional(),
    content: z.string().optional(),
    validUntil: z.string().optional(),
    proposedAmount: z.number().optional(),
    discount: z.number().optional(),
    finalAmount: z.number().optional(),
    terms: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    approvedBy: z.string().uuid().optional(),
    approvedAt: z.string().optional(),
    rejectionReason: z.string().optional(),
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

// Proposal routes
router.post(
  '/proposals',
  authenticate,
  validate(createProposalSchema),
  opportunityController.createProposal
);

router.get(
  '/:opportunityId/proposals',
  authenticate,
  opportunityController.getProposals
);

router.patch(
  '/proposals/:id',
  authenticate,
  validate(updateProposalSchema),
  opportunityController.updateProposal
);

router.delete(
  '/proposals/:id',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  opportunityController.deleteProposal
);

export default router;