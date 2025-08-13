import { Request, Response, NextFunction } from 'express';
import { leadService } from '../services/lead.service';
import { AuthRequest } from '../middlewares/auth';

// Lead Controllers
export const createLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const lead = await leadService.createLead(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: lead,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      status,
      source,
      assignedToId,
      assignedTeamId,
      bantScore,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {
      search: search as string,
      status: status as any,
      source: source as any,
      assignedToId: assignedToId as string,
      assignedTeamId: assignedTeamId as string,
      bantScore: bantScore ? parseInt(bantScore as string) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const result = await leadService.getLeads(
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

export const getLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    res.json({
      success: true,
      data: lead,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const lead = await leadService.updateLead(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: lead,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await leadService.deleteLead(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Lead deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lead Assignment
export const assignLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignment = await leadService.assignLead(
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: assignment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await leadService.approveAssignment(
      id,
      req.user!.userId
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

export const rejectAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await leadService.rejectAssignment(
      id,
      reason,
      req.user!.userId
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

// Lead Conversion
export const convertLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await leadService.convertLead(
      id,
      req.body,
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