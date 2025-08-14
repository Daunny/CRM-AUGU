import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  updateProposalItems,
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

// Proposal CRUD
router.post('/', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), createProposal);
router.get('/', getProposals);
router.get('/:id', getProposalById);
router.put('/:id', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), updateProposal);
router.put('/:id/items', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), updateProposalItems);
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), deleteProposal);

// Proposal Workflow
router.post('/:id/submit', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), submitForApproval);
router.post('/:id/approve', authorize(['ADMIN', 'MANAGER']), approveProposal);
router.post('/:id/reject', authorize(['ADMIN', 'MANAGER']), rejectProposal);
router.post('/:id/send', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), sendToCustomer);
router.post('/:id/customer-response', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), recordCustomerResponse);

// Proposal Operations
router.post('/:id/clone', authorize(['ADMIN', 'MANAGER', 'OPERATOR']), cloneProposal);

// Template Management
router.post('/templates', authorize(['ADMIN', 'MANAGER']), createTemplate);
router.get('/templates', getTemplates);
router.put('/templates/:id', authorize(['ADMIN', 'MANAGER']), updateTemplate);

export default router;