import { Request, Response, NextFunction } from 'express';
import { opportunityService } from '../services/opportunity.service';
import { AuthRequest } from '../middlewares/auth';

// Opportunity Controllers
export const createOpportunity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const opportunity = await opportunityService.createOpportunity(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: opportunity,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOpportunities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      companyId,
      stage,
      type,
      ownerId,
      teamId,
      minAmount,
      maxAmount,
      expectedCloseDateFrom,
      expectedCloseDateTo,
    } = req.query;

    const filter = {
      search: search as string,
      companyId: companyId as string,
      stage: stage as any,
      type: type as any,
      ownerId: ownerId as string,
      teamId: teamId as string,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      expectedCloseDateFrom: expectedCloseDateFrom as string,
      expectedCloseDateTo: expectedCloseDateTo as string,
    };

    const result = await opportunityService.getOpportunities(
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

export const getOpportunityById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const opportunity = await opportunityService.getOpportunityById(id);

    res.json({
      success: true,
      data: opportunity,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOpportunity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const opportunity = await opportunityService.updateOpportunity(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: opportunity,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOpportunity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await opportunityService.deleteOpportunity(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Opportunity deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Proposal Controllers
export const createProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const proposal = await opportunityService.createProposal(
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

export const getProposals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { opportunityId } = req.params;
    const proposals = await opportunityService.getProposals(opportunityId);

    res.json({
      success: true,
      data: proposals,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const proposal = await opportunityService.updateProposal(
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

export const deleteProposal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await opportunityService.deleteProposal(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Proposal deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Pipeline Analytics
export const getPipelineAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, ownerId, dateFrom, dateTo } = req.query;

    const filter = {
      teamId: teamId as string,
      ownerId: ownerId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const analytics = await opportunityService.getPipelineAnalytics(filter);

    res.json({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};