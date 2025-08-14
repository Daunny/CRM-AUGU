import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middleware/validation.middleware';
import {
  createProposalSchema,
  updateProposalSchema,
  updateProposalItemsSchema,
  approveProposalSchema,
  rejectProposalSchema,
  customerResponseSchema,
  createTemplateSchema,
  updateTemplateSchema,
  getProposalsQuerySchema,
} from '../validations/proposal.validation';
import {
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  updateProposalItems,
  checkRequiredApprovers,
  submitForApproval,
  approveProposal,
  rejectProposal,
  sendToCustomer,
  recordCustomerResponse,
  cloneProposal,
  deleteProposal,
  createTemplate,
  getTemplates,
  updateTemplate,
} from '../controllers/proposal.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Proposal CRUD - with validation
router.post('/', 
  authorize('ADMIN', 'MANAGER', 'OPERATOR'), 
  validate(createProposalSchema), 
  createProposal
);
router.get('/', 
  validate({ query: getProposalsQuerySchema }), 
  getProposals
);
router.get('/:id', getProposalById);
router.put('/:id', 
  authorize('ADMIN', 'MANAGER', 'OPERATOR'), 
  validate(updateProposalSchema), 
  updateProposal
);
router.put('/:id/items', 
  authorize('ADMIN', 'MANAGER', 'OPERATOR'), 
  validate(updateProposalItemsSchema), 
  updateProposalItems
);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteProposal);

// Proposal Workflow - with validation
router.get('/:id/check-approvers', checkRequiredApprovers);
router.post('/:id/submit', authorize('ADMIN', 'MANAGER', 'OPERATOR'), submitForApproval);
router.post('/:id/approve', 
  authorize('ADMIN', 'MANAGER'), 
  validate(approveProposalSchema), 
  approveProposal
);
router.post('/:id/reject', 
  authorize('ADMIN', 'MANAGER'), 
  validate(rejectProposalSchema), 
  rejectProposal
);
router.post('/:id/send', authorize('ADMIN', 'MANAGER', 'OPERATOR'), sendToCustomer);
router.post('/:id/customer-response', 
  authorize('ADMIN', 'MANAGER', 'OPERATOR'), 
  validate(customerResponseSchema), 
  recordCustomerResponse
);

// Proposal Operations
router.post('/:id/clone', authorize('ADMIN', 'MANAGER', 'OPERATOR'), cloneProposal);

// Template Management - with validation
router.post('/templates', 
  authorize('ADMIN', 'MANAGER'), 
  validate(createTemplateSchema), 
  createTemplate
);
router.get('/templates', getTemplates);
router.put('/templates/:id', 
  authorize('ADMIN', 'MANAGER'), 
  validate(updateTemplateSchema), 
  updateTemplate
);

export default router;