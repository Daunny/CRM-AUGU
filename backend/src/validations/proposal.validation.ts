import Joi from 'joi';
import { ProposalStatus, ProposalItemType } from '@prisma/client';

// Proposal Item Schema
const proposalItemSchema = Joi.object({
  productId: Joi.string().uuid().optional(),
  itemType: Joi.string().valid(...Object.values(ProposalItemType)).required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).default(0),
});

// Create Proposal Schema
export const createProposalSchema = Joi.object({
  body: Joi.object({
    opportunityId: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(255).required(),
    executiveSummary: Joi.string().max(5000).optional(),
    templateId: Joi.string().uuid().optional(),
    validUntil: Joi.date().greater('now').required(),
    items: Joi.array().items(proposalItemSchema).min(1).required(),
    paymentTerms: Joi.string().max(2000).optional(),
    deliveryTerms: Joi.string().max(2000).optional(),
    warrantyTerms: Joi.string().max(2000).optional(),
    specialTerms: Joi.string().max(2000).optional(),
    discountPercent: Joi.number().min(0).max(100).default(0),
    tax: Joi.number().min(0).max(100).default(0),
  }),
});

// Update Proposal Schema
export const updateProposalSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    executiveSummary: Joi.string().max(5000).optional(),
    validUntil: Joi.date().greater('now').optional(),
    paymentTerms: Joi.string().max(2000).optional(),
    deliveryTerms: Joi.string().max(2000).optional(),
    warrantyTerms: Joi.string().max(2000).optional(),
    specialTerms: Joi.string().max(2000).optional(),
    discountPercent: Joi.number().min(0).max(100).optional(),
    tax: Joi.number().min(0).max(100).optional(),
  }),
});

// Update Proposal Items Schema
export const updateProposalItemsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    items: Joi.array().items(proposalItemSchema).min(1).required(),
  }),
});

// Approve/Reject Schema
export const approveProposalSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    comments: Joi.string().max(1000).optional(),
  }),
});

export const rejectProposalSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    reason: Joi.string().min(1).max(500).required(),
    comments: Joi.string().max(1000).optional(),
  }),
});

// Customer Response Schema
export const customerResponseSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    accepted: Joi.boolean().required(),
    signedBy: Joi.string().max(255).when('accepted', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
});

// Template Schema
export const createTemplateSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().min(1).max(50).required(),
    name: Joi.string().min(1).max(255).required(),
    category: Joi.string().max(100).optional(),
    description: Joi.string().max(1000).optional(),
    content: Joi.object().required(),
    sections: Joi.object().optional(),
    terms: Joi.object().optional(),
  }),
});

export const updateTemplateSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    category: Joi.string().max(100).optional(),
    description: Joi.string().max(1000).optional(),
    content: Joi.object().optional(),
    sections: Joi.object().optional(),
    terms: Joi.object().optional(),
    isActive: Joi.boolean().optional(),
  }),
});

// Query Schemas
export const getProposalsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  opportunityId: Joi.string().uuid().optional(),
  status: Joi.string().valid(...Object.values(ProposalStatus)).optional(),
  templateId: Joi.string().uuid().optional(),
  search: Joi.string().max(255).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().greater(Joi.ref('dateFrom')).optional(),
});