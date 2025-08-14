import { Request, Response, NextFunction } from 'express';
import { proposalService } from '../services/proposal.service';
import { AuthRequest } from '../middlewares/auth';
import { ProposalStatus } from '@prisma/client';

// Create proposal
export const createProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const proposal = await proposalService.createProposal(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get proposals
export const getProposals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      opportunityId,
      status,
      templateId,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {
      opportunityId: opportunityId as string,
      status: status as ProposalStatus,
      templateId: templateId as string,
      search: search as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const result = await proposalService.getProposals(
      filter,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get proposal by ID
export const getProposalById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.getProposalById(id);

    res.json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update proposal
export const updateProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.updateProposal(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update proposal items
export const updateProposalItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.updateProposalItems(
      id,
      req.body.items,
      req.user!.userId
    );

    res.json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Check required approvers before submission
export const checkRequiredApprovers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await proposalService.checkRequiredApprovers(id);

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit proposal for approval
export const submitForApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await proposalService.submitForApproval(
      id,
      req.user!.userId
    );

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Approve proposal
export const approveProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const result = await proposalService.approveProposal(
      id,
      comments,
      req.user!.userId
    );

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reject proposal
export const rejectProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason, comments } = req.body;
    const result = await proposalService.rejectProposal(
      id,
      reason,
      comments,
      req.user!.userId
    );

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send proposal to customer
export const sendToCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.sendToCustomer(
      id,
      req.user!.userId
    );

    res.json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Record customer response
export const recordCustomerResponse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { accepted, signedBy } = req.body;
    const proposal = await proposalService.recordCustomerResponse(
      id,
      accepted,
      signedBy,
      req.user!.userId
    );

    res.json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clone proposal
export const cloneProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.cloneProposal(
      id,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete proposal
export const deleteProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await proposalService.deleteProposal(
      id,
      req.user!.userId
    );

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Template Management

// Create template
export const createTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const template = await proposalService.createTemplate(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: template,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get templates
export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isActive = 'true' } = req.query;
    const templates = await proposalService.getTemplates(
      isActive === 'true'
    );

    res.json({
      success: true,
      data: templates,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update template
export const updateTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const template = await proposalService.updateTemplate(id, req.body);

    res.json({
      success: true,
      data: template,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};