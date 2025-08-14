import { Request, Response, NextFunction } from 'express';
import { customer360Service } from '../services/customer360.service';

// Get comprehensive customer view
export const getCustomer360View = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const view = await customer360Service.getCustomer360View(companyId);

    res.json({
      success: true,
      data: view,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get customer interaction history
export const getInteractionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, type, userId } = req.query;

    const filter = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as string,
      userId: userId as string,
    };

    const history = await customer360Service.getInteractionHistory(companyId, filter);

    res.json({
      success: true,
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get customer revenue analytics
export const getRevenueAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const analytics = await customer360Service.getRevenueAnalytics(companyId);

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

// Get customer risk assessment
export const getRiskAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const assessment = await customer360Service.getRiskAssessment(companyId);

    res.json({
      success: true,
      data: assessment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};