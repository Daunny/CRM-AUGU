import { prisma } from '../config/database';
import { dashboardService } from './dashboard.service';
import { AppError } from '../utils/errors';
import { cacheService } from './cache.service';
import { 
  ReportType, 
  ReportFormat, 
  ReportFrequency,
  ReportStatus,
  Prisma 
} from '@prisma/client';

interface CreateReportTemplateDto {
  code: string;
  name: string;
  description?: string;
  type: ReportType;
  format?: ReportFormat;
  frequency?: ReportFrequency;
  config: any;
  layout?: any;
  styles?: any;
  isScheduled?: boolean;
  scheduleConfig?: any;
}

interface UpdateReportTemplateDto {
  name?: string;
  description?: string;
  format?: ReportFormat;
  frequency?: ReportFrequency;
  config?: any;
  layout?: any;
  styles?: any;
  isScheduled?: boolean;
  scheduleConfig?: any;
  isActive?: boolean;
}

interface GenerateReportDto {
  templateId?: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  parameters?: any;
}

export class ReportService {
  // Generate unique report template code
  private async generateTemplateCode(type: ReportType): Promise<string> {
    const prefix = type.substring(0, 3).toUpperCase();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastTemplate = await prisma.reportTemplate.findFirst({
      where: {
        code: {
          startsWith: `${prefix}-${year}${month}`,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    let sequence = 1;
    if (lastTemplate) {
      const lastSequence = parseInt(lastTemplate.code.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Create report template
  async createReportTemplate(data: CreateReportTemplateDto, userId: string) {
    // Check if code already exists
    const existing = await prisma.reportTemplate.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Template code already exists', 400);
    }

    const template = await prisma.reportTemplate.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        format: data.format || ReportFormat.PDF,
        frequency: data.frequency || ReportFrequency.ON_DEMAND,
        config: data.config,
        layout: data.layout,
        styles: data.styles,
        isScheduled: data.isScheduled || false,
        scheduleConfig: data.scheduleConfig,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return template;
  }

  // Get report templates
  async getReportTemplates(
    filter?: {
      type?: ReportType;
      isActive?: boolean;
      isScheduled?: boolean;
    },
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReportTemplateWhereInput = {};

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.isScheduled !== undefined) {
      where.isScheduled = filter.isScheduled;
    }

    const [templates, total] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              reports: true,
            },
          },
        },
      }),
      prisma.reportTemplate.count({ where }),
    ]);

    return {
      data: templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get report template by ID
  async getReportTemplateById(id: string) {
    const template = await prisma.reportTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reports: {
          take: 10,
          orderBy: { generatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            format: true,
            status: true,
            generatedAt: true,
            fileUrl: true,
          },
        },
      },
    });

    if (!template) {
      throw new AppError('Report template not found', 404);
    }

    return template;
  }

  // Update report template
  async updateReportTemplate(id: string, data: UpdateReportTemplateDto, userId: string) {
    const template = await prisma.reportTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError('Report template not found', 404);
    }

    const updated = await prisma.reportTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        version: {
          increment: 1,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  // Delete report template
  async deleteReportTemplate(id: string) {
    const template = await prisma.reportTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    if (!template) {
      throw new AppError('Report template not found', 404);
    }

    if (template._count.reports > 0) {
      // Soft delete by deactivating
      await prisma.reportTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Template deactivated (has associated reports)' };
    }

    // Hard delete if no reports
    await prisma.reportTemplate.delete({
      where: { id },
    });

    return { message: 'Template deleted successfully' };
  }

  // Generate report
  async generateReport(data: GenerateReportDto, userId: string) {
    // Create report record
    const report = await prisma.report.create({
      data: {
        templateId: data.templateId,
        name: data.name,
        type: data.type,
        format: data.format,
        parameters: data.parameters,
        status: ReportStatus.GENERATING,
        data: {},
        generatedBy: userId,
      },
    });

    try {
      // Generate report data based on type
      let reportData: any = {};

      switch (data.type) {
        case ReportType.SALES_REPORT:
          reportData = await this.generateSalesReport(data.parameters);
          break;
        case ReportType.PROJECT_STATUS:
          reportData = await this.generateProjectStatusReport(data.parameters);
          break;
        case ReportType.CUSTOMER_ANALYSIS:
          reportData = await this.generateCustomerAnalysisReport(data.parameters);
          break;
        case ReportType.FINANCIAL_SUMMARY:
          reportData = await this.generateFinancialSummaryReport(data.parameters);
          break;
        case ReportType.TEAM_PERFORMANCE:
          reportData = await this.generateTeamPerformanceReport(data.parameters);
          break;
        case ReportType.EXECUTIVE_SUMMARY:
          reportData = await this.generateExecutiveSummaryReport(data.parameters);
          break;
        default:
          reportData = await this.generateCustomReport(data.parameters);
      }

      // Update report with generated data
      const updatedReport = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.COMPLETED,
          data: reportData,
          // File generation would happen here for PDF/Excel formats
          // fileUrl: generatedFileUrl,
          // fileSize: generatedFileSize,
        },
        include: {
          generator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedReport;
    } catch (error) {
      // Update report status to failed
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Report generation failed',
        },
      });

      throw error;
    }
  }

  // Get reports
  async getReports(
    filter?: {
      templateId?: string;
      type?: ReportType;
      status?: ReportStatus;
      generatedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReportWhereInput = {};

    if (filter?.templateId) {
      where.templateId = filter.templateId;
    }

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.generatedBy) {
      where.generatedBy = filter.generatedBy;
    }

    if (filter?.dateFrom || filter?.dateTo) {
      where.generatedAt = {};
      if (filter.dateFrom) {
        where.generatedAt.gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        where.generatedAt.lte = filter.dateTo;
      }
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          generator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get report by ID
  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        template: true,
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    return report;
  }

  // Delete report
  async deleteReport(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    await prisma.report.delete({
      where: { id },
    });

    return { message: 'Report deleted successfully' };
  }

  // Report generation methods
  private async generateSalesReport(parameters: any) {
    const { dateRange, userId, includeForecasts } = parameters || {};
    
    const [salesMetrics, pipelineOverview, conversionRates, topDeals] = await Promise.all([
      dashboardService.getSalesMetrics(dateRange),
      dashboardService.getPipelineOverview(userId, dateRange),
      dashboardService.getConversionRates(userId, dateRange),
      dashboardService.getTopDeals(userId, dateRange),
    ]);

    const report = {
      title: 'Sales Report',
      generatedAt: new Date(),
      period: dateRange,
      metrics: salesMetrics,
      pipeline: pipelineOverview,
      conversions: conversionRates,
      topDeals,
    };

    if (includeForecasts) {
      const forecast = await dashboardService.getSalesForecast(userId);
      report['forecast'] = forecast;
    }

    return report;
  }

  private async generateProjectStatusReport(parameters: any) {
    const { projectId, projectManagerId } = parameters || {};
    
    let projectData;
    
    if (projectId) {
      // Get specific project details
      projectData = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          milestones: {
            include: {
              dependencies: true,
            },
          },
          tasks: {
            include: {
              assignedTo: true,
            },
          },
          risks: true,
          budgets: true,
          resources: true,
          deliverables: true,
        },
      });
    } else {
      // Get all projects overview
      const dashboard = await dashboardService.getProjectDashboard(projectManagerId);
      projectData = dashboard;
    }

    return {
      title: 'Project Status Report',
      generatedAt: new Date(),
      data: projectData,
    };
  }

  private async generateCustomerAnalysisReport(parameters: any) {
    const dashboard = await dashboardService.getCustomerDashboard();
    
    return {
      title: 'Customer Analysis Report',
      generatedAt: new Date(),
      segments: dashboard.segments,
      satisfaction: dashboard.satisfaction,
      retention: dashboard.retention,
      acquisition: dashboard.acquisition,
      lifecycle: dashboard.lifecycle,
      churnRisk: dashboard.churnRisk,
    };
  }

  private async generateFinancialSummaryReport(parameters: any) {
    const { dateRange } = parameters || {};
    
    const [revenueAnalysis, projectBudgets] = await Promise.all([
      dashboardService.getRevenueAnalysis(dateRange),
      prisma.projectBudget.groupBy({
        by: ['category'],
        _sum: {
          plannedAmount: true,
          actualAmount: true,
        },
      }),
    ]);

    return {
      title: 'Financial Summary Report',
      generatedAt: new Date(),
      period: dateRange,
      revenue: revenueAnalysis,
      budgets: projectBudgets,
    };
  }

  private async generateTeamPerformanceReport(parameters: any) {
    const { dateRange } = parameters || {};
    
    const performance = await dashboardService.getTeamPerformance(dateRange);
    
    return {
      title: 'Team Performance Report',
      generatedAt: new Date(),
      period: dateRange,
      individual: performance.individual,
      team: performance.team,
    };
  }

  private async generateExecutiveSummaryReport(parameters: any) {
    const { dateRange } = parameters || {};
    
    const dashboard = await dashboardService.getExecutiveDashboard(dateRange);
    
    return {
      title: 'Executive Summary Report',
      generatedAt: new Date(),
      period: dateRange,
      kpis: dashboard.kpis,
      salesMetrics: dashboard.salesMetrics,
      projectMetrics: dashboard.projectMetrics,
      customerMetrics: dashboard.customerMetrics,
      teamPerformance: dashboard.teamPerformance,
      revenueAnalysis: dashboard.revenueAnalysis,
    };
  }

  private async generateCustomReport(parameters: any) {
    // Custom report logic based on parameters
    return {
      title: 'Custom Report',
      generatedAt: new Date(),
      parameters,
      data: {}, // Custom data generation logic
    };
  }

  // Get scheduled reports that need to be generated
  async getScheduledReportsToGenerate() {
    const now = new Date();
    
    const templates = await prisma.reportTemplate.findMany({
      where: {
        isActive: true,
        isScheduled: true,
        OR: [
          { nextGenerateAt: null },
          { nextGenerateAt: { lte: now } },
        ],
      },
    });

    return templates;
  }

  // Update next generation time for scheduled report
  async updateNextGenerationTime(templateId: string) {
    const template = await prisma.reportTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isScheduled) {
      return;
    }

    // Calculate next generation time based on frequency
    const now = new Date();
    let nextGenerateAt: Date;

    switch (template.frequency) {
      case ReportFrequency.DAILY:
        nextGenerateAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case ReportFrequency.WEEKLY:
        nextGenerateAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case ReportFrequency.MONTHLY:
        nextGenerateAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case ReportFrequency.QUARTERLY:
        nextGenerateAt = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        break;
      case ReportFrequency.YEARLY:
        nextGenerateAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      default:
        return;
    }

    await prisma.reportTemplate.update({
      where: { id: templateId },
      data: {
        lastGeneratedAt: now,
        nextGenerateAt,
      },
    });
  }
}

export const reportService = new ReportService();