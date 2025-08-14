import { prisma } from '../config/database';
import { OpportunityStage, ProposalStatus } from '@prisma/client';

interface PipelineFilter {
  salesTeamId?: string;
  accountManagerId?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ProposalAnalyticsFilter extends PipelineFilter {
  templateId?: string;
  minAmount?: number;
  maxAmount?: number;
}

class SalesPipelineService {
  // Get overall pipeline metrics
  async getPipelineMetrics(filter: PipelineFilter) {
    const where: any = {};

    if (filter.salesTeamId) {
      where.salesTeamId = filter.salesTeamId;
    }
    if (filter.accountManagerId) {
      where.accountManagerId = filter.accountManagerId;
    }
    if (filter.companyId) {
      where.companyId = filter.companyId;
    }
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        where.createdAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.createdAt.lte = new Date(filter.dateTo);
      }
    }

    // Get opportunities by stage
    const opportunitiesByStage = await prisma.opportunity.groupBy({
      by: ['stage'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        expectedAmount: true,
      },
      _avg: {
        probability: true,
      },
    });

    // Get total metrics
    const totalOpportunities = await prisma.opportunity.count({ where });
    const totalPipeline = await prisma.opportunity.aggregate({
      where,
      _sum: {
        amount: true,
        expectedAmount: true,
      },
      _avg: {
        probability: true,
      },
    });

    // Get conversion rates
    const wonOpportunities = await prisma.opportunity.count({
      where: {
        ...where,
        stage: OpportunityStage.CLOSED_WON,
      },
    });

    const lostOpportunities = await prisma.opportunity.count({
      where: {
        ...where,
        stage: OpportunityStage.CLOSED_LOST,
      },
    });

    const conversionRate = totalOpportunities > 0
      ? (wonOpportunities / totalOpportunities) * 100
      : 0;

    const winRate = (wonOpportunities + lostOpportunities) > 0
      ? (wonOpportunities / (wonOpportunities + lostOpportunities)) * 100
      : 0;

    // Calculate average deal size
    const avgDealSize = totalOpportunities > 0
      ? (totalPipeline._sum.amount || 0) / totalOpportunities
      : 0;

    // Calculate average sales cycle
    const closedDeals = await prisma.opportunity.findMany({
      where: {
        ...where,
        OR: [
          { stage: OpportunityStage.CLOSED_WON },
          { stage: OpportunityStage.CLOSED_LOST },
        ],
        actualCloseDate: { not: null },
      },
      select: {
        createdAt: true,
        actualCloseDate: true,
      },
    });

    const avgSalesCycle = this.calculateAverageSalesCycle(closedDeals);

    // Get velocity metrics
    const velocityMetrics = await this.calculatePipelineVelocity(where);

    return {
      summary: {
        totalOpportunities,
        totalPipelineValue: totalPipeline._sum.amount || 0,
        expectedRevenue: totalPipeline._sum.expectedAmount || 0,
        averageProbability: totalPipeline._avg.probability || 0,
        averageDealSize: avgDealSize,
        conversionRate,
        winRate,
        averageSalesCycle,
      },
      stageDistribution: opportunitiesByStage.map(stage => ({
        stage: stage.stage,
        count: stage._count.id,
        value: stage._sum.amount || 0,
        expectedValue: stage._sum.expectedAmount || 0,
        averageProbability: stage._avg.probability || 0,
      })),
      velocity: velocityMetrics,
    };
  }

  // Get proposal analytics
  async getProposalAnalytics(filter: ProposalAnalyticsFilter) {
    const where: any = {};

    if (filter.salesTeamId || filter.accountManagerId || filter.companyId) {
      where.opportunity = {};
      if (filter.salesTeamId) {
        where.opportunity.salesTeamId = filter.salesTeamId;
      }
      if (filter.accountManagerId) {
        where.opportunity.accountManagerId = filter.accountManagerId;
      }
      if (filter.companyId) {
        where.opportunity.companyId = filter.companyId;
      }
    }

    if (filter.templateId) {
      where.templateId = filter.templateId;
    }

    if (filter.minAmount || filter.maxAmount) {
      where.totalAmount = {};
      if (filter.minAmount) {
        where.totalAmount.gte = filter.minAmount;
      }
      if (filter.maxAmount) {
        where.totalAmount.lte = filter.maxAmount;
      }
    }

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        where.createdAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.createdAt.lte = new Date(filter.dateTo);
      }
    }

    // Get proposals by status
    const proposalsByStatus = await prisma.proposal.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
      _avg: {
        discountPercent: true,
      },
    });

    // Get total metrics
    const totalProposals = await prisma.proposal.count({ where });
    const proposalMetrics = await prisma.proposal.aggregate({
      where,
      _sum: {
        totalAmount: true,
        discountAmount: true,
      },
      _avg: {
        totalAmount: true,
        discountPercent: true,
      },
    });

    // Get acceptance rate
    const acceptedProposals = await prisma.proposal.count({
      where: {
        ...where,
        status: ProposalStatus.ACCEPTED,
      },
    });

    const declinedProposals = await prisma.proposal.count({
      where: {
        ...where,
        status: ProposalStatus.DECLINED,
      },
    });

    const acceptanceRate = (acceptedProposals + declinedProposals) > 0
      ? (acceptedProposals / (acceptedProposals + declinedProposals)) * 100
      : 0;

    // Get template performance
    const templatePerformance = await prisma.proposal.groupBy({
      by: ['templateId'],
      where: {
        ...where,
        templateId: { not: null },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get approval metrics
    const approvalMetrics = await this.getApprovalMetrics(where);

    return {
      summary: {
        totalProposals,
        totalValue: proposalMetrics._sum.totalAmount || 0,
        totalDiscounts: proposalMetrics._sum.discountAmount || 0,
        averageValue: proposalMetrics._avg.totalAmount || 0,
        averageDiscount: proposalMetrics._avg.discountPercent || 0,
        acceptanceRate,
      },
      statusDistribution: proposalsByStatus.map(status => ({
        status: status.status,
        count: status._count.id,
        value: status._sum.totalAmount || 0,
        averageDiscount: status._avg.discountPercent || 0,
      })),
      templatePerformance: await Promise.all(
        templatePerformance.map(async (template) => {
          const templateData = template.templateId
            ? await prisma.proposalTemplate.findUnique({
                where: { id: template.templateId },
                select: { name: true },
              })
            : null;
          
          return {
            templateId: template.templateId,
            templateName: templateData?.name || 'No Template',
            count: template._count.id,
            totalValue: template._sum.totalAmount || 0,
          };
        })
      ),
      approvalMetrics,
    };
  }

  // Get funnel analysis
  async getFunnelAnalysis(filter: PipelineFilter) {
    const where: any = {};

    if (filter.salesTeamId) {
      where.salesTeamId = filter.salesTeamId;
    }
    if (filter.accountManagerId) {
      where.accountManagerId = filter.accountManagerId;
    }
    if (filter.companyId) {
      where.companyId = filter.companyId;
    }

    // Define funnel stages
    const funnelStages = [
      OpportunityStage.QUALIFYING,
      OpportunityStage.NEEDS_ANALYSIS,
      OpportunityStage.PROPOSAL,
      OpportunityStage.NEGOTIATION,
      OpportunityStage.CLOSED_WON,
    ];

    const funnelData = await Promise.all(
      funnelStages.map(async (stage) => {
        const stageData = await prisma.opportunity.aggregate({
          where: {
            ...where,
            stage,
          },
          _count: {
            id: true,
          },
          _sum: {
            amount: true,
          },
        });

        return {
          stage,
          count: stageData._count.id,
          value: stageData._sum.amount || 0,
        };
      })
    );

    // Calculate conversion rates between stages
    const conversionRates = [];
    for (let i = 0; i < funnelData.length - 1; i++) {
      const currentStage = funnelData[i];
      const nextStage = funnelData[i + 1];
      
      const conversionRate = currentStage.count > 0
        ? (nextStage.count / currentStage.count) * 100
        : 0;

      conversionRates.push({
        from: currentStage.stage,
        to: nextStage.stage,
        rate: conversionRate,
      });
    }

    return {
      funnel: funnelData,
      conversionRates,
    };
  }

  // Get sales forecast
  async getSalesForcast(months: number = 3) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);

    // Get opportunities expected to close in the forecast period
    const opportunities = await prisma.opportunity.findMany({
      where: {
        expectedCloseDate: {
          gte: today,
          lte: futureDate,
        },
        stage: {
          notIn: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST],
        },
      },
      select: {
        id: true,
        amount: true,
        probability: true,
        expectedCloseDate: true,
        stage: true,
      },
    });

    // Group by month
    const forecastByMonth: Record<string, any> = {};

    opportunities.forEach(opp => {
      if (!opp.expectedCloseDate) return;

      const monthKey = `${opp.expectedCloseDate.getFullYear()}-${String(opp.expectedCloseDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!forecastByMonth[monthKey]) {
        forecastByMonth[monthKey] = {
          month: monthKey,
          opportunities: 0,
          pipelineValue: 0,
          weightedValue: 0,
          bestCase: 0,
          worstCase: 0,
        };
      }

      forecastByMonth[monthKey].opportunities += 1;
      forecastByMonth[monthKey].pipelineValue += opp.amount || 0;
      forecastByMonth[monthKey].weightedValue += (opp.amount || 0) * (opp.probability / 100);
      
      // Best case: all opportunities close
      forecastByMonth[monthKey].bestCase += opp.amount || 0;
      
      // Worst case: only high probability (>70%) opportunities close
      if (opp.probability > 70) {
        forecastByMonth[monthKey].worstCase += opp.amount || 0;
      }
    });

    // Calculate totals
    const totals = Object.values(forecastByMonth).reduce(
      (acc: any, month: any) => ({
        opportunities: acc.opportunities + month.opportunities,
        pipelineValue: acc.pipelineValue + month.pipelineValue,
        weightedValue: acc.weightedValue + month.weightedValue,
        bestCase: acc.bestCase + month.bestCase,
        worstCase: acc.worstCase + month.worstCase,
      }),
      {
        opportunities: 0,
        pipelineValue: 0,
        weightedValue: 0,
        bestCase: 0,
        worstCase: 0,
      }
    );

    return {
      period: {
        from: today.toISOString(),
        to: futureDate.toISOString(),
        months,
      },
      totals,
      monthlyForecast: Object.values(forecastByMonth).sort((a: any, b: any) => 
        a.month.localeCompare(b.month)
      ),
    };
  }

  // Get team performance
  async getTeamPerformance(filter: PipelineFilter) {
    const where: any = {};

    if (filter.salesTeamId) {
      where.salesTeamId = filter.salesTeamId;
    }
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        where.createdAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.createdAt.lte = new Date(filter.dateTo);
      }
    }

    // Get performance by account manager
    const performanceByManager = await prisma.opportunity.groupBy({
      by: ['accountManagerId'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Get detailed metrics for each manager
    const detailedPerformance = await Promise.all(
      performanceByManager.map(async (manager) => {
        const managerData = await prisma.user.findUnique({
          where: { id: manager.accountManagerId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        const wonDeals = await prisma.opportunity.count({
          where: {
            ...where,
            accountManagerId: manager.accountManagerId,
            stage: OpportunityStage.CLOSED_WON,
          },
        });

        const lostDeals = await prisma.opportunity.count({
          where: {
            ...where,
            accountManagerId: manager.accountManagerId,
            stage: OpportunityStage.CLOSED_LOST,
          },
        });

        const winRate = (wonDeals + lostDeals) > 0
          ? (wonDeals / (wonDeals + lostDeals)) * 100
          : 0;

        return {
          accountManagerId: manager.accountManagerId,
          name: managerData ? `${managerData.firstName} ${managerData.lastName}` : 'Unknown',
          email: managerData?.email || '',
          totalOpportunities: manager._count.id,
          totalValue: manager._sum.amount || 0,
          wonDeals,
          lostDeals,
          winRate,
          averageDealSize: manager._count.id > 0
            ? (manager._sum.amount || 0) / manager._count.id
            : 0,
        };
      })
    );

    return {
      teamPerformance: detailedPerformance.sort((a, b) => b.totalValue - a.totalValue),
    };
  }

  // Helper: Calculate average sales cycle
  private calculateAverageSalesCycle(
    closedDeals: Array<{ createdAt: Date; actualCloseDate: Date | null }>
  ): number {
    if (closedDeals.length === 0) return 0;

    const cycleDays = closedDeals
      .filter(deal => deal.actualCloseDate)
      .map(deal => {
        const created = new Date(deal.createdAt);
        const closed = new Date(deal.actualCloseDate!);
        return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });

    if (cycleDays.length === 0) return 0;

    return Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length);
  }

  // Helper: Calculate pipeline velocity
  private async calculatePipelineVelocity(where: any) {
    // Get stage transitions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stageTransitions = await prisma.opportunityStageHistory.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        opportunity: where,
      },
      include: {
        opportunity: true,
      },
    });

    // Calculate average time in each stage
    const stageMetrics: Record<string, { totalDays: number; count: number }> = {};

    stageTransitions.forEach(transition => {
      if (transition.fromStage && transition.durationDays) {
        if (!stageMetrics[transition.fromStage]) {
          stageMetrics[transition.fromStage] = { totalDays: 0, count: 0 };
        }
        stageMetrics[transition.fromStage].totalDays += transition.durationDays;
        stageMetrics[transition.fromStage].count += 1;
      }
    });

    const averageTimeByStage = Object.entries(stageMetrics).map(([stage, metrics]) => ({
      stage,
      averageDays: metrics.count > 0 ? Math.round(metrics.totalDays / metrics.count) : 0,
    }));

    return {
      stageTransitions: stageTransitions.length,
      averageTimeByStage,
    };
  }

  // Helper: Get approval metrics
  private async getApprovalMetrics(where: any) {
    const approvals = await prisma.proposalApproval.findMany({
      where: {
        proposal: where,
      },
      select: {
        status: true,
        createdAt: true,
        approvedAt: true,
        rejectedAt: true,
      },
    });

    const totalApprovals = approvals.length;
    const approved = approvals.filter(a => a.status === 'APPROVED').length;
    const rejected = approvals.filter(a => a.status === 'REJECTED').length;
    const pending = approvals.filter(a => a.status === 'PENDING').length;

    // Calculate average approval time
    const approvalTimes = approvals
      .filter(a => a.approvedAt)
      .map(a => {
        const created = new Date(a.createdAt);
        const approved = new Date(a.approvedAt!);
        return (approved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      });

    const averageApprovalTime = approvalTimes.length > 0
      ? Math.round(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length)
      : 0;

    return {
      totalApprovals,
      approved,
      rejected,
      pending,
      approvalRate: totalApprovals > 0 ? (approved / totalApprovals) * 100 : 0,
      averageApprovalTimeHours: averageApprovalTime,
    };
  }
}

export const salesPipelineService = new SalesPipelineService();