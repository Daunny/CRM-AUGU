import { prisma } from '../config/database';
import { cacheService } from './cache.service';
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export class DashboardService {
  // Executive Dashboard
  async getExecutiveDashboard(dateRange?: { from: Date; to: Date }) {
    const cacheKey = `dashboard:executive:${JSON.stringify(dateRange)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const range = dateRange || {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    };

    const [
      kpis,
      salesMetrics,
      projectMetrics,
      customerMetrics,
      teamPerformance,
      revenueAnalysis,
    ] = await Promise.all([
      this.getKeyPerformanceIndicators(range),
      this.getSalesMetrics(range),
      this.getProjectMetrics(range),
      this.getCustomerMetrics(range),
      this.getTeamPerformance(range),
      this.getRevenueAnalysis(range),
    ]);

    const dashboard = {
      kpis,
      salesMetrics,
      projectMetrics,
      customerMetrics,
      teamPerformance,
      revenueAnalysis,
      generatedAt: new Date(),
    };

    await cacheService.set(cacheKey, dashboard, 300); // 5분 캐시
    return dashboard;
  }

  // Sales Dashboard
  async getSalesDashboard(userId?: string, dateRange?: { from: Date; to: Date }) {
    const range = dateRange || {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    };

    const [
      pipeline,
      activities,
      targets,
      topDeals,
      conversionRates,
      forecast,
    ] = await Promise.all([
      this.getPipelineOverview(userId, range),
      this.getSalesActivities(userId, range),
      this.getSalesTargets(userId, range),
      this.getTopDeals(userId, range),
      this.getConversionRates(userId, range),
      this.getSalesForecast(userId),
    ]);

    return {
      pipeline,
      activities,
      targets,
      topDeals,
      conversionRates,
      forecast,
      generatedAt: new Date(),
    };
  }

  // Project Dashboard
  async getProjectDashboard(projectManagerId?: string) {
    const where = projectManagerId ? { projectManagerId } : {};

    const [
      overview,
      timeline,
      resources,
      risks,
      milestones,
      budgetStatus,
    ] = await Promise.all([
      this.getProjectOverview(where),
      this.getProjectTimeline(where),
      this.getResourceUtilization(where),
      this.getRiskMatrix(where),
      this.getMilestoneStatus(where),
      this.getBudgetStatus(where),
    ]);

    return {
      overview,
      timeline,
      resources,
      risks,
      milestones,
      budgetStatus,
      generatedAt: new Date(),
    };
  }

  // Customer Dashboard
  async getCustomerDashboard() {
    const [
      segments,
      satisfaction,
      retention,
      acquisition,
      lifecycle,
      churnRisk,
    ] = await Promise.all([
      this.getCustomerSegmentation(),
      this.getCustomerSatisfaction(),
      this.getRetentionMetrics(),
      this.getAcquisitionMetrics(),
      this.getCustomerLifecycle(),
      this.getChurnRiskAnalysis(),
    ]);

    return {
      segments,
      satisfaction,
      retention,
      acquisition,
      lifecycle,
      churnRisk,
      generatedAt: new Date(),
    };
  }

  // Key Performance Indicators
  async getKeyPerformanceIndicators(range?: { from: Date; to: Date }) {
    if (!range) {
      range = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    const [revenue, deals, customers, projects] = await Promise.all([
      // 총 매출
      prisma.opportunity.aggregate({
        where: {
          stage: 'CLOSED_WON',
          closedAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      // 진행 중인 거래
      prisma.opportunity.count({
        where: {
          stage: {
            in: ['QUALIFYING', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION'],
          },
        },
      }),
      // 신규 고객
      prisma.company.count({
        where: {
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      // 진행 중인 프로젝트
      prisma.project.count({
        where: {
          status: 'IN_PROGRESS',
        },
      }),
    ]);

    // 전월 대비 비교
    const previousRange = {
      from: subDays(range.from, 30),
      to: subDays(range.to, 30),
    };

    const previousRevenue = await prisma.opportunity.aggregate({
      where: {
        stage: 'CLOSED_WON',
        closedAt: {
          gte: previousRange.from,
          lte: previousRange.to,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const revenueGrowth = previousRevenue._sum.amount
      ? ((revenue._sum.amount || 0) - previousRevenue._sum.amount) / previousRevenue._sum.amount * 100
      : 0;

    return {
      revenue: {
        value: revenue._sum.amount || 0,
        count: revenue._count,
        growth: revenueGrowth,
        currency: 'KRW',
      },
      activeDeals: {
        value: deals,
        label: '진행 중인 거래',
      },
      newCustomers: {
        value: customers,
        label: '신규 고객',
      },
      activeProjects: {
        value: projects,
        label: '진행 중인 프로젝트',
      },
    };
  }

  // Sales Metrics
  async getSalesMetrics(range?: { from: Date; to: Date }) {
    if (!range) {
      range = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    const opportunities = await prisma.opportunity.findMany({
      where: {
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      include: {
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 단계별 분포
    const stageDistribution = opportunities.reduce((acc, opp) => {
      acc[opp.stage] = (acc[opp.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 평균 거래 규모
    const avgDealSize = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0) / opportunities.length || 0;

    // 승률
    const won = opportunities.filter(o => o.stage === 'CLOSED_WON').length;
    const lost = opportunities.filter(o => o.stage === 'CLOSED_LOST').length;
    const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;

    // 평균 거래 기간
    const closedDeals = opportunities.filter(o => o.closedAt);
    const avgSalesCycle = closedDeals.length > 0
      ? closedDeals.reduce((sum, opp) => {
          const days = Math.floor((opp.closedAt!.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / closedDeals.length
      : 0;

    return {
      stageDistribution,
      avgDealSize,
      winRate,
      avgSalesCycle,
      totalOpportunities: opportunities.length,
      totalValue: opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0),
    };
  }

  // Project Metrics
  async getProjectMetrics(range?: { from: Date; to: Date }) {
    if (!range) {
      range = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    const projects = await prisma.project.findMany({
      where: {
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      include: {
        milestones: true,
        tasks: true,
        budgets: true,
      },
    });

    // 상태별 분포
    const statusDistribution = projects.reduce((acc, proj) => {
      acc[proj.status] = (acc[proj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 건강도별 분포
    const healthDistribution = projects.reduce((acc, proj) => {
      const health = proj.health || 'UNKNOWN';
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 예산 현황
    const budgetStatus = projects.reduce((acc, proj) => {
      const planned = proj.budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
      const actual = proj.budgets.reduce((sum, b) => sum + b.actualAmount, 0);
      acc.totalPlanned += planned;
      acc.totalActual += actual;
      if (actual > planned) acc.overBudget++;
      return acc;
    }, { totalPlanned: 0, totalActual: 0, overBudget: 0 });

    // 평균 진행률
    const avgProgress = projects.length > 0
      ? projects.reduce((sum, proj) => sum + (proj.progress || 0), 0) / projects.length
      : 0;

    return {
      statusDistribution,
      healthDistribution,
      budgetStatus,
      avgProgress,
      totalProjects: projects.length,
      onTimeDelivery: projects.filter(p => p.status === 'COMPLETED' && p.actualEndDate && p.endDate && p.actualEndDate <= p.endDate).length,
    };
  }

  // Customer Metrics
  async getCustomerMetrics(range?: { from: Date; to: Date }) {
    if (!range) {
      range = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    const [totalCustomers, newCustomers, activeCustomers] = await Promise.all([
      prisma.company.count({
        where: {
          customerStatus: 'ACTIVE',
        },
      }),
      prisma.company.count({
        where: {
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      prisma.company.count({
        where: {
          opportunities: {
            some: {
              createdAt: {
                gte: range.from,
                lte: range.to,
              },
            },
          },
        },
      }),
    ]);

    // 고객 등급별 분포
    const tierDistribution = await prisma.company.groupBy({
      by: ['customerTier'],
      where: {
        customerStatus: 'ACTIVE',
      },
      _count: true,
    });

    // 산업별 분포
    const industryDistribution = await prisma.company.groupBy({
      by: ['industry'],
      where: {
        customerStatus: 'ACTIVE',
      },
      _count: true,
    });

    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      tierDistribution: tierDistribution.reduce((acc, item) => {
        acc[item.customerTier || 'NONE'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      industryDistribution: industryDistribution.reduce((acc, item) => {
        acc[item.industry || 'OTHER'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      retentionRate: await this.calculateRetentionRate(range),
    };
  }

  // Team Performance
  async getTeamPerformance(range?: { from: Date; to: Date }) {
    if (!range) {
      range = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['OPERATOR', 'MANAGER'],
        },
      },
      include: {
        opportunities: {
          where: {
            createdAt: {
              gte: range.from,
              lte: range.to,
            },
          },
        },
        assignedTasks: {
          where: {
            createdAt: {
              gte: range.from,
              lte: range.to,
            },
          },
        },
      },
    });

    const performance = users.map(user => {
      const opportunities = user.opportunities;
      const won = opportunities.filter(o => o.stage === 'CLOSED_WON');
      const revenue = won.reduce((sum, o) => sum + (o.amount || 0), 0);
      const tasks = user.assignedTasks;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        metrics: {
          dealsCreated: opportunities.length,
          dealsWon: won.length,
          revenue,
          winRate: opportunities.length > 0 ? (won.length / opportunities.length) * 100 : 0,
          tasksCompleted: completedTasks.length,
          taskCompletionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        },
      };
    });

    // 팀 전체 통계
    const teamStats = {
      totalRevenue: performance.reduce((sum, p) => sum + p.metrics.revenue, 0),
      totalDeals: performance.reduce((sum, p) => sum + p.metrics.dealsCreated, 0),
      avgWinRate: performance.reduce((sum, p) => sum + p.metrics.winRate, 0) / performance.length,
      topPerformer: performance.sort((a, b) => b.metrics.revenue - a.metrics.revenue)[0],
    };

    return {
      individual: performance,
      team: teamStats,
    };
  }

  // Revenue Analysis
  async getRevenueAnalysis(range?: { from: Date; to: Date }) {
    if (!range) {
      range = {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    // 월별 매출 추이
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', closed_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as deals
      FROM opportunities
      WHERE stage = 'CLOSED_WON'
        AND closed_at >= ${range.from}
        AND closed_at <= ${range.to}
      GROUP BY DATE_TRUNC('month', closed_at)
      ORDER BY month
    `;

    // 제품별 매출
    const productRevenue = await prisma.opportunityProduct.groupBy({
      by: ['productId'],
      where: {
        opportunity: {
          stage: 'CLOSED_WON',
          closedAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      },
      _sum: {
        totalPrice: true,
      },
      _count: true,
    });

    // 고객별 매출 Top 10
    const topCustomers = await prisma.company.findMany({
      where: {
        opportunities: {
          some: {
            stage: 'CLOSED_WON',
            closedAt: {
              gte: range.from,
              lte: range.to,
            },
          },
        },
      },
      include: {
        opportunities: {
          where: {
            stage: 'CLOSED_WON',
            closedAt: {
              gte: range.from,
              lte: range.to,
            },
          },
        },
      },
      take: 10,
    });

    const customerRevenue = topCustomers.map(customer => ({
      id: customer.id,
      name: customer.name,
      revenue: customer.opportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
      deals: customer.opportunities.length,
    })).sort((a, b) => b.revenue - a.revenue);

    return {
      monthlyRevenue,
      productRevenue,
      customerRevenue,
      totalRevenue: customerRevenue.reduce((sum, c) => sum + c.revenue, 0),
    };
  }

  // Helper methods for detailed metrics
  async getPipelineOverview(userId?: string, range: { from: Date; to: Date }) {
    const where: any = {
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    };
    if (userId) where.accountManagerId = userId;

    const opportunities = await prisma.opportunity.groupBy({
      by: ['stage'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return opportunities.map(item => ({
      stage: item.stage,
      count: item._count,
      value: item._sum.amount || 0,
    }));
  }

  async getSalesActivities(userId?: string, range: { from: Date; to: Date }) {
    const where: any = {
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    };
    if (userId) where.userId = userId;

    const activities = await prisma.activity.groupBy({
      by: ['activityType'],
      where,
      _count: true,
    });

    return activities.map(item => ({
      type: item.activityType,
      count: item._count,
    }));
  }

  async getSalesTargets(userId?: string, range: { from: Date; to: Date }) {
    // 목표 대비 달성률 계산
    const actualRevenue = await prisma.opportunity.aggregate({
      where: {
        accountManagerId: userId,
        stage: 'CLOSED_WON',
        closedAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // TODO: KPI 테이블에서 목표 가져오기
    const target = 100000000; // 1억원 (임시값)
    const actual = actualRevenue._sum.amount || 0;

    return {
      target,
      actual,
      achievement: (actual / target) * 100,
      remaining: Math.max(0, target - actual),
    };
  }

  async getTopDeals(userId?: string, range: { from: Date; to: Date }) {
    const where: any = {
      stage: {
        notIn: ['CLOSED_WON', 'CLOSED_LOST'],
      },
    };
    if (userId) where.accountManagerId = userId;

    return await prisma.opportunity.findMany({
      where,
      orderBy: {
        amount: 'desc',
      },
      take: 10,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getConversionRates(userId?: string, range: { from: Date; to: Date }) {
    const stages = ['QUALIFYING', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
    const conversions: any[] = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];

      const fromCount = await prisma.opportunity.count({
        where: {
          accountManagerId: userId,
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      });

      const toCount = await prisma.opportunity.count({
        where: {
          accountManagerId: userId,
          stage: {
            in: stages.slice(i + 1),
          },
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      });

      conversions.push({
        from: fromStage,
        to: toStage,
        rate: fromCount > 0 ? (toCount / fromCount) * 100 : 0,
      });
    }

    return conversions;
  }

  async getSalesForecast(userId?: string) {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        accountManagerId: userId,
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
        expectedCloseDate: {
          gte: new Date(),
          lte: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3개월 예측
        },
      },
    });

    // 단계별 가중치
    const stageWeights: Record<string, number> = {
      QUALIFYING: 0.1,
      NEEDS_ANALYSIS: 0.25,
      PROPOSAL: 0.5,
      NEGOTIATION: 0.75,
    };

    const forecast = opportunities.reduce((acc, opp) => {
      const weight = stageWeights[opp.stage] || 0;
      const weightedAmount = (opp.amount || 0) * weight;
      
      const month = opp.expectedCloseDate ? 
        new Date(opp.expectedCloseDate).toISOString().slice(0, 7) : 
        'unknown';
      
      if (!acc[month]) acc[month] = { best: 0, likely: 0, worst: 0 };
      
      acc[month].best += opp.amount || 0;
      acc[month].likely += weightedAmount;
      acc[month].worst += weightedAmount * 0.5;
      
      return acc;
    }, {} as Record<string, any>);

    return forecast;
  }

  async getProjectOverview(where: any) {
    const projects = await prisma.project.groupBy({
      by: ['status'],
      where: {
        ...where,
        deletedAt: null,
      },
      _count: true,
    });

    return projects.map(item => ({
      status: item.status,
      count: item._count,
    }));
  }

  async getProjectTimeline(where: any) {
    return await prisma.project.findMany({
      where: {
        ...where,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        progress: true,
        health: true,
      },
      orderBy: {
        endDate: 'asc',
      },
      take: 20,
    });
  }

  async getResourceUtilization(where: any) {
    const resources = await prisma.projectResource.groupBy({
      by: ['resourceType', 'status'],
      where: {
        project: where,
      },
      _count: true,
    });

    return resources.map(item => ({
      type: item.resourceType,
      status: item.status,
      count: item._count,
    }));
  }

  async getRiskMatrix(where: any) {
    const risks = await prisma.projectRisk.groupBy({
      by: ['probability', 'impact'],
      where: {
        project: where,
        status: {
          notIn: ['RESOLVED', 'ACCEPTED'],
        },
      },
      _count: true,
    });

    return risks.map(item => ({
      probability: item.probability,
      impact: item.impact,
      count: item._count,
    }));
  }

  async getMilestoneStatus(where: any) {
    const milestones = await prisma.milestone.groupBy({
      by: ['status'],
      where: {
        project: where,
      },
      _count: true,
    });

    return milestones.map(item => ({
      status: item.status,
      count: item._count,
    }));
  }

  async getBudgetStatus(where: any) {
    const budgets = await prisma.projectBudget.groupBy({
      by: ['category'],
      where: {
        project: where,
      },
      _sum: {
        plannedAmount: true,
        actualAmount: true,
      },
    });

    return budgets.map(item => ({
      category: item.category,
      planned: item._sum.plannedAmount || 0,
      actual: item._sum.actualAmount || 0,
      variance: (item._sum.plannedAmount || 0) - (item._sum.actualAmount || 0),
    }));
  }

  async getCustomerSegmentation() {
    const segments = await prisma.$queryRaw`
      SELECT 
        CASE
          WHEN total_revenue > 100000000 THEN 'VIP'
          WHEN total_revenue > 50000000 THEN 'Gold'
          WHEN total_revenue > 10000000 THEN 'Silver'
          ELSE 'Bronze'
        END as segment,
        COUNT(*) as count,
        AVG(total_revenue) as avg_revenue
      FROM (
        SELECT 
          c.id,
          COALESCE(SUM(o.amount), 0) as total_revenue
        FROM companies c
        LEFT JOIN opportunities o ON c.id = o.company_id AND o.stage = 'CLOSED_WON'
        WHERE c.deleted_at IS NULL
        GROUP BY c.id
      ) customer_revenue
      GROUP BY segment
    `;

    return segments;
  }

  async getCustomerSatisfaction() {
    // TODO: NPS 점수 계산 (설문 데이터 필요)
    return {
      nps: 72,
      promoters: 45,
      passives: 30,
      detractors: 25,
      responses: 100,
    };
  }

  async getRetentionMetrics() {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const [currentCustomers, lastYearCustomers, retained] = await Promise.all([
      prisma.company.count({
        where: {
          customerStatus: 'ACTIVE',
          createdAt: {
            lte: new Date(`${currentYear}-12-31`),
          },
        },
      }),
      prisma.company.count({
        where: {
          customerStatus: 'ACTIVE',
          createdAt: {
            lte: new Date(`${lastYear}-12-31`),
          },
        },
      }),
      prisma.company.count({
        where: {
          customerStatus: 'ACTIVE',
          createdAt: {
            lte: new Date(`${lastYear}-12-31`),
          },
          opportunities: {
            some: {
              createdAt: {
                gte: new Date(`${currentYear}-01-01`),
              },
            },
          },
        },
      }),
    ]);

    return {
      retentionRate: lastYearCustomers > 0 ? (retained / lastYearCustomers) * 100 : 0,
      currentCustomers,
      lastYearCustomers,
      retained,
      churned: lastYearCustomers - retained,
    };
  }

  async getAcquisitionMetrics() {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    const acquisitions = await Promise.all(
      last12Months.map(async ({ year, month }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);

        const count = await prisma.company.count({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        });

        return {
          month: `${year}-${String(month).padStart(2, '0')}`,
          count,
        };
      })
    );

    return acquisitions;
  }

  async getCustomerLifecycle() {
    const stages = await prisma.company.groupBy({
      by: ['customerStatus'],
      _count: true,
      _avg: {
        healthScore: true,
        engagementScore: true,
      },
    });

    return stages.map(item => ({
      status: item.customerStatus,
      count: item._count,
      avgHealthScore: item._avg.healthScore || 0,
      avgEngagementScore: item._avg.engagementScore || 0,
    }));
  }

  async getChurnRiskAnalysis() {
    // 이탈 위험 고객 식별
    const atRiskCustomers = await prisma.company.findMany({
      where: {
        OR: [
          { healthScore: { lt: 50 } },
          { engagementScore: { lt: 30 } },
          {
            opportunities: {
              none: {
                createdAt: {
                  gte: subDays(new Date(), 180), // 6개월간 기회 없음
                },
              },
            },
          },
        ],
        customerStatus: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        healthScore: true,
        engagementScore: true,
        lastHealthCheck: true,
      },
      take: 20,
    });

    return {
      atRiskCount: atRiskCustomers.length,
      customers: atRiskCustomers,
      riskFactors: {
        lowHealth: atRiskCustomers.filter(c => (c.healthScore || 100) < 50).length,
        lowEngagement: atRiskCustomers.filter(c => (c.engagementScore || 100) < 30).length,
        inactive: atRiskCustomers.filter(c => !c.lastHealthCheck || c.lastHealthCheck < subDays(new Date(), 90)).length,
      },
    };
  }

  async calculateRetentionRate(range: { from: Date; to: Date }) {
    const startCustomers = await prisma.company.count({
      where: {
        customerStatus: 'ACTIVE',
        createdAt: {
          lt: range.from,
        },
      },
    });

    const endCustomers = await prisma.company.count({
      where: {
        customerStatus: 'ACTIVE',
        createdAt: {
          lt: range.to,
        },
      },
    });

    const churned = await prisma.company.count({
      where: {
        customerStatus: 'CHURNED',
        updatedAt: {
          gte: range.from,
          lte: range.to,
        },
      },
    });

    if (startCustomers === 0) return 100;
    return ((startCustomers - churned) / startCustomers) * 100;
  }
}

export const dashboardService = new DashboardService();