import { Request, Response, NextFunction } from 'express';
import { salesPipelineService } from '../services/sales-pipeline.service';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

// Get pipeline metrics with enhanced error handling
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

    // Validated data from middleware
    const filter = {
      salesTeamId: salesTeamId as string | undefined,
      accountManagerId: accountManagerId as string | undefined,
      companyId: companyId as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
    };

    logger.info('Fetching pipeline metrics', { 
      userId: req.user?.id, 
      filter 
    });

    const metrics = await salesPipelineService.getPipelineMetrics(filter);

    res.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch pipeline metrics', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      query: req.query 
    });
    
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to fetch pipeline metrics', 500));
    }
  }
};

// Get proposal analytics with proper validation
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

    // Data has been validated by middleware
    const filter = {
      salesTeamId: salesTeamId as string | undefined,
      accountManagerId: accountManagerId as string | undefined,
      companyId: companyId as string | undefined,
      templateId: templateId as string | undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
    };

    logger.info('Fetching proposal analytics', { 
      userId: req.user?.id, 
      filter 
    });

    const analytics = await salesPipelineService.getProposalAnalytics(filter);

    res.json({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposal analytics', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      query: req.query 
    });
    
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to fetch proposal analytics', 500));
    }
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