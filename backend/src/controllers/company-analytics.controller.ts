import { Request, Response, NextFunction } from 'express';
import { companyAnalyticsService } from '../services/company-analytics.service';
import { AuthRequest } from '../middlewares/auth';

/**
 * Get company analytics dashboard
 */
export const getCompanyAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const analytics = await companyAnalyticsService.getCompanyAnalytics(id);

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

/**
 * Calculate health score for a company
 */
export const calculateHealthScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const healthScore = await companyAnalyticsService.calculateHealthScore(id);

    res.json({
      success: true,
      data: {
        companyId: id,
        healthScore,
        calculatedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate churn risk for a company
 */
export const calculateChurnRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const churnRisk = await companyAnalyticsService.calculateChurnRisk(id);

    res.json({
      success: true,
      data: {
        companyId: id,
        churnRisk,
        riskPercentage: Math.round(churnRisk * 100),
        calculatedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate lifetime value for a company
 */
export const calculateLifetimeValue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const lifetimeValue = await companyAnalyticsService.calculateLifetimeValue(id);

    res.json({
      success: true,
      data: {
        companyId: id,
        lifetimeValue,
        calculatedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-segment a company
 */
export const autoSegmentCompany = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const segment = await companyAnalyticsService.autoSegmentCompany(id);

    res.json({
      success: true,
      data: {
        companyId: id,
        segment,
        segmentedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch update analytics for multiple companies
 */
export const batchUpdateAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyIds } = req.body;
    await companyAnalyticsService.batchUpdateAnalytics(companyIds);

    res.json({
      success: true,
      message: 'Analytics update started',
      data: {
        companiesQueued: companyIds?.length || 'all',
        startedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};