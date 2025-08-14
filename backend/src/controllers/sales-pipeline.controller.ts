import { Request, Response, NextFunction } from 'express';
import { salesPipelineService } from '../services/sales-pipeline.service';

// Get pipeline metrics
export const getPipelineMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      salesTeamId,
      accountManagerId,
      companyId,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {
      salesTeamId: salesTeamId as string,
      accountManagerId: accountManagerId as string,
      companyId: companyId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const metrics = await salesPipelineService.getPipelineMetrics(filter);

    res.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get proposal analytics
export const getProposalAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      salesTeamId,
      accountManagerId,
      companyId,
      templateId,
      minAmount,
      maxAmount,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {
      salesTeamId: salesTeamId as string,
      accountManagerId: accountManagerId as string,
      companyId: companyId as string,
      templateId: templateId as string,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const analytics = await salesPipelineService.getProposalAnalytics(filter);

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

// Get funnel analysis
export const getFunnelAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      salesTeamId,
      accountManagerId,
      companyId,
    } = req.query;

    const filter = {
      salesTeamId: salesTeamId as string,
      accountManagerId: accountManagerId as string,
      companyId: companyId as string,
    };

    const funnel = await salesPipelineService.getFunnelAnalysis(filter);

    res.json({
      success: true,
      data: funnel,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get sales forecast
export const getSalesForecast = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { months = '3' } = req.query;
    const forecast = await salesPipelineService.getSalesForcast(
      parseInt(months as string)
    );

    res.json({
      success: true,
      data: forecast,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get team performance
export const getTeamPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      salesTeamId,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {
      salesTeamId: salesTeamId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const performance = await salesPipelineService.getTeamPerformance(filter);

    res.json({
      success: true,
      data: performance,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};