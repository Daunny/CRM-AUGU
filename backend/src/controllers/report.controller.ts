import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { ReportType, ReportFormat, ReportFrequency, ReportStatus } from '@prisma/client';

// Report Template Controllers

export const createReportTemplate = async (req: Request, res: Response) => {
  try {
    const template = await reportService.createReportTemplate(
      req.body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error creating report template:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create report template',
    });
  }
};

export const getReportTemplates = async (req: Request, res: Response) => {
  try {
    const { type, isActive, isScheduled, page, limit } = req.query;
    
    const filter = {
      type: type as ReportType,
      isActive: isActive === 'true',
      isScheduled: isScheduled === 'true',
    };

    const templates = await reportService.getReportTemplates(
      filter,
      Number(page) || 1,
      Number(limit) || 20
    );

    res.json({
      success: true,
      data: templates.data,
      pagination: {
        total: templates.total,
        page: templates.page,
        totalPages: templates.totalPages,
      },
    });
  } catch (error) {
    console.error('Error getting report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report templates',
    });
  }
};

export const getReportTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await reportService.getReportTemplateById(id);

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error getting report template:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get report template',
    });
  }
};

export const updateReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await reportService.updateReportTemplate(
      id,
      req.body,
      req.user!.id
    );

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error updating report template:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to update report template',
    });
  }
};

export const deleteReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await reportService.deleteReportTemplate(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error deleting report template:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete report template',
    });
  }
};

// Report Controllers

export const generateReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.generateReport(
      req.body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate report',
    });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const { 
      templateId, 
      type, 
      status, 
      generatedBy,
      dateFrom,
      dateTo,
      page, 
      limit 
    } = req.query;
    
    const filter = {
      templateId: templateId as string,
      type: type as ReportType,
      status: status as ReportStatus,
      generatedBy: generatedBy as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const reports = await reportService.getReports(
      filter,
      Number(page) || 1,
      Number(limit) || 20
    );

    res.json({
      success: true,
      data: reports.data,
      pagination: {
        total: reports.total,
        page: reports.page,
        totalPages: reports.totalPages,
      },
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
    });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await reportService.getReportById(id);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get report',
    });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await reportService.deleteReport(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete report',
    });
  }
};

// Quick Report Generation

export const generateSalesReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo, userId, includeForecasts } = req.query;
    
    const report = await reportService.generateReport(
      {
        name: `Sales Report - ${new Date().toISOString().split('T')[0]}`,
        type: ReportType.SALES_REPORT,
        format: ReportFormat.JSON,
        parameters: {
          dateRange: dateFrom && dateTo ? {
            from: new Date(dateFrom as string),
            to: new Date(dateTo as string),
          } : undefined,
          userId: userId || req.user!.id,
          includeForecasts: includeForecasts === 'true',
        },
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales report',
    });
  }
};

export const generateProjectStatusReport = async (req: Request, res: Response) => {
  try {
    const { projectId, projectManagerId } = req.query;
    
    const report = await reportService.generateReport(
      {
        name: `Project Status Report - ${new Date().toISOString().split('T')[0]}`,
        type: ReportType.PROJECT_STATUS,
        format: ReportFormat.JSON,
        parameters: {
          projectId: projectId as string,
          projectManagerId: projectManagerId as string,
        },
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating project status report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate project status report',
    });
  }
};

export const generateCustomerAnalysisReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.generateReport(
      {
        name: `Customer Analysis Report - ${new Date().toISOString().split('T')[0]}`,
        type: ReportType.CUSTOMER_ANALYSIS,
        format: ReportFormat.JSON,
        parameters: req.query,
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating customer analysis report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer analysis report',
    });
  }
};

export const generateFinancialSummaryReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const report = await reportService.generateReport(
      {
        name: `Financial Summary Report - ${new Date().toISOString().split('T')[0]}`,
        type: ReportType.FINANCIAL_SUMMARY,
        format: ReportFormat.JSON,
        parameters: {
          dateRange: dateFrom && dateTo ? {
            from: new Date(dateFrom as string),
            to: new Date(dateTo as string),
          } : undefined,
        },
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating financial summary report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial summary report',
    });
  }
};

export const generateTeamPerformanceReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const report = await reportService.generateReport(
      {
        name: `Team Performance Report - ${new Date().toISOString().split('T')[0]}`,
        type: ReportType.TEAM_PERFORMANCE,
        format: ReportFormat.JSON,
        parameters: {
          dateRange: dateFrom && dateTo ? {
            from: new Date(dateFrom as string),
            to: new Date(dateTo as string),
          } : undefined,
        },
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating team performance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate team performance report',
    });
  }
};

export const generateExecutiveSummaryReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const report = await reportService.generateReport(
      {
        name: `Executive Summary Report - ${new Date().toISOString().split('T')[0]}`,
        type: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.JSON,
        parameters: {
          dateRange: dateFrom && dateTo ? {
            from: new Date(dateFrom as string),
            to: new Date(dateTo as string),
          } : undefined,
        },
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating executive summary report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate executive summary report',
    });
  }
};