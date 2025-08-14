import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AppError } from '../utils/errors';

// Executive Dashboard
export const getExecutiveDashboard = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const dashboard = await dashboardService.getExecutiveDashboard(dateRange);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting executive dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get executive dashboard',
    });
  }
};

// Sales Dashboard
export const getSalesDashboard = async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    // Use current user if userId not specified
    const targetUserId = userId as string || req.user?.id;

    const dashboard = await dashboardService.getSalesDashboard(targetUserId, dateRange);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting sales dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales dashboard',
    });
  }
};

// Project Dashboard
export const getProjectDashboard = async (req: Request, res: Response) => {
  try {
    const { projectManagerId } = req.query;
    
    const dashboard = await dashboardService.getProjectDashboard(
      projectManagerId as string
    );
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting project dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project dashboard',
    });
  }
};

// Customer Dashboard
export const getCustomerDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await dashboardService.getCustomerDashboard();
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting customer dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer dashboard',
    });
  }
};

// Custom Dashboard Widgets
export const getKPIs = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const kpis = await dashboardService.getKeyPerformanceIndicators(dateRange);
    
    res.json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    console.error('Error getting KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get KPIs',
    });
  }
};

export const getSalesMetrics = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const metrics = await dashboardService.getSalesMetrics(dateRange);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting sales metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales metrics',
    });
  }
};

export const getProjectMetrics = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const metrics = await dashboardService.getProjectMetrics(dateRange);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting project metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project metrics',
    });
  }
};

export const getCustomerMetrics = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const metrics = await dashboardService.getCustomerMetrics(dateRange);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting customer metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer metrics',
    });
  }
};

export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const performance = await dashboardService.getTeamPerformance(dateRange);
    
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Error getting team performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team performance',
    });
  }
};

export const getRevenueAnalysis = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const analysis = await dashboardService.getRevenueAnalysis(dateRange);
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error getting revenue analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue analysis',
    });
  }
};

// Pipeline Overview
export const getPipelineOverview = async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const overview = await dashboardService.getPipelineOverview(
      userId as string,
      dateRange!
    );
    
    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error getting pipeline overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pipeline overview',
    });
  }
};

// Sales Activities
export const getSalesActivities = async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const activities = await dashboardService.getSalesActivities(
      userId as string,
      dateRange!
    );
    
    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Error getting sales activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales activities',
    });
  }
};

// Sales Targets
export const getSalesTargets = async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const targets = await dashboardService.getSalesTargets(
      userId as string,
      dateRange!
    );
    
    res.json({
      success: true,
      data: targets,
    });
  } catch (error) {
    console.error('Error getting sales targets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales targets',
    });
  }
};

// Top Deals
export const getTopDeals = async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const deals = await dashboardService.getTopDeals(
      userId as string,
      dateRange!
    );
    
    res.json({
      success: true,
      data: deals,
    });
  } catch (error) {
    console.error('Error getting top deals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top deals',
    });
  }
};

// Conversion Rates
export const getConversionRates = async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;
    
    const dateRange = from && to 
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const rates = await dashboardService.getConversionRates(
      userId as string,
      dateRange!
    );
    
    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    console.error('Error getting conversion rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversion rates',
    });
  }
};

// Sales Forecast
export const getSalesForecast = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const forecast = await dashboardService.getSalesForecast(
      userId as string
    );
    
    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Error getting sales forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales forecast',
    });
  }
};

// Customer Segmentation
export const getCustomerSegmentation = async (req: Request, res: Response) => {
  try {
    const segmentation = await dashboardService.getCustomerSegmentation();
    
    res.json({
      success: true,
      data: segmentation,
    });
  } catch (error) {
    console.error('Error getting customer segmentation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer segmentation',
    });
  }
};

// Churn Risk Analysis
export const getChurnRiskAnalysis = async (req: Request, res: Response) => {
  try {
    const analysis = await dashboardService.getChurnRiskAnalysis();
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error getting churn risk analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get churn risk analysis',
    });
  }
};