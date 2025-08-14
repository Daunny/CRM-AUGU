import { PrismaClient } from '@prisma/client';
import { BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

export class CompanyAnalyticsService {
  /**
   * Calculate health score for a company
   * Health score is based on multiple factors:
   * - Engagement Score (20%): Recent interactions and activities
   * - Satisfaction Score (25%): Project success rates and feedback
   * - Revenue Score (30%): Total revenue and growth trends
   * - Activity Score (15%): Meeting frequency and communication
   * - Project Score (10%): Active projects and completion rates
   */
  async calculateHealthScore(companyId: string): Promise<number> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        opportunities: {
          where: {
            deletedAt: null,
          },
        },
        projects: {
          where: {
            deletedAt: null,
          },
        },
        meetings: {
          where: {
            deletedAt: null,
            startTime: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        },
      },
    });

    if (!company) {
      throw new BadRequestError('Company not found');
    }

    // Calculate component scores
    const engagementScore = this.calculateEngagementScore(company);
    const satisfactionScore = this.calculateSatisfactionScore(company);
    const revenueScore = this.calculateRevenueScore(company);
    const activityScore = this.calculateActivityScore(company);
    const projectScore = this.calculateProjectScore(company);

    // Weighted average
    const weights = {
      engagementScore: 0.20,
      satisfactionScore: 0.25,
      revenueScore: 0.30,
      activityScore: 0.15,
      projectScore: 0.10,
    };

    const healthScore = Math.round(
      engagementScore * weights.engagementScore +
      satisfactionScore * weights.satisfactionScore +
      revenueScore * weights.revenueScore +
      activityScore * weights.activityScore +
      projectScore * weights.projectScore
    );

    // Update company with calculated scores
    await prisma.company.update({
      where: { id: companyId },
      data: {
        healthScore,
        engagementScore,
        satisfactionScore,
        lastHealthCheck: new Date(),
      },
    });

    return healthScore;
  }

  /**
   * Calculate engagement score based on recent interactions
   */
  private calculateEngagementScore(company: any): number {
    const recentMeetings = company.meetings?.length || 0;
    const activitiesCount = recentMeetings; // Simplified for now
    
    // Score based on activity frequency
    if (activitiesCount >= 10) return 100;
    if (activitiesCount >= 7) return 85;
    if (activitiesCount >= 5) return 70;
    if (activitiesCount >= 3) return 50;
    if (activitiesCount >= 1) return 30;
    return 10;
  }

  /**
   * Calculate satisfaction score based on project success
   */
  private calculateSatisfactionScore(company: any): number {
    const projects = company.projects || [];
    if (projects.length === 0) return 50; // Neutral if no projects

    const completedProjects = projects.filter((p: any) => 
      p.status === 'COMPLETED'
    ).length;
    
    const successRate = completedProjects / projects.length;
    return Math.round(successRate * 100);
  }

  /**
   * Calculate revenue score based on opportunities
   */
  private calculateRevenueScore(company: any): number {
    const opportunities = company.opportunities || [];
    const totalRevenue = opportunities.reduce((sum: number, opp: any) => 
      sum + (opp.amount || 0), 0
    );
    
    // Score based on revenue thresholds
    if (totalRevenue >= 10000000) return 100; // 10M+
    if (totalRevenue >= 5000000) return 85;   // 5M+
    if (totalRevenue >= 1000000) return 70;   // 1M+
    if (totalRevenue >= 500000) return 55;    // 500K+
    if (totalRevenue >= 100000) return 40;    // 100K+
    if (totalRevenue > 0) return 25;
    return 10;
  }

  /**
   * Calculate activity score based on meeting frequency
   */
  private calculateActivityScore(company: any): number {
    const meetings = company.meetings || [];
    const monthlyAverage = meetings.length / 3; // Over 3 months
    
    if (monthlyAverage >= 5) return 100;
    if (monthlyAverage >= 3) return 80;
    if (monthlyAverage >= 2) return 60;
    if (monthlyAverage >= 1) return 40;
    if (monthlyAverage > 0) return 20;
    return 0;
  }

  /**
   * Calculate project score based on active projects
   */
  private calculateProjectScore(company: any): number {
    const projects = company.projects || [];
    const activeProjects = projects.filter((p: any) => 
      p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
    ).length;
    
    if (activeProjects >= 5) return 100;
    if (activeProjects >= 3) return 80;
    if (activeProjects >= 2) return 60;
    if (activeProjects >= 1) return 40;
    return 20;
  }

  /**
   * Auto-segment companies based on various criteria
   */
  async autoSegmentCompany(companyId: string): Promise<string> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        opportunities: {
          where: { deletedAt: null },
        },
        projects: {
          where: { deletedAt: null },
        },
      },
    });

    if (!company) {
      throw new BadRequestError('Company not found');
    }

    // Calculate total revenue
    const totalRevenue = company.opportunities?.reduce(
      (sum, opp) => sum + (opp.amount || 0), 
      0
    ) || 0;

    // Determine segment based on revenue and other factors
    let segment: string;
    const employeeCount = company.size || 0;
    const projectCount = company.projects?.length || 0;

    if (totalRevenue >= 5000000 || employeeCount >= 1000) {
      segment = 'ENTERPRISE';
    } else if (totalRevenue >= 1000000 || employeeCount >= 250) {
      segment = 'KEY_ACCOUNT';
    } else if (totalRevenue >= 500000 || employeeCount >= 100) {
      segment = 'MID_MARKET';
    } else if (totalRevenue >= 100000 || employeeCount >= 50) {
      segment = 'SMB';
    } else {
      segment = 'STARTER';
    }

    // Update company segment
    await prisma.company.update({
      where: { id: companyId },
      data: { segment },
    });

    return segment;
  }

  /**
   * Calculate churn risk for a company
   */
  async calculateChurnRisk(companyId: string): Promise<number> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        meetings: {
          where: {
            deletedAt: null,
            startTime: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 6 months
            },
          },
          orderBy: { startTime: 'desc' },
        },
        opportunities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        projects: {
          where: { deletedAt: null },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new BadRequestError('Company not found');
    }

    // Risk factors
    let riskScore = 0;
    const maxRisk = 100;

    // 1. No recent meetings (40% weight)
    const lastMeeting = company.meetings?.[0];
    const daysSinceLastMeeting = lastMeeting 
      ? Math.floor((Date.now() - new Date(lastMeeting.startTime).getTime()) / (1000 * 60 * 60 * 24))
      : 180;
    
    if (daysSinceLastMeeting >= 90) riskScore += 40;
    else if (daysSinceLastMeeting >= 60) riskScore += 25;
    else if (daysSinceLastMeeting >= 30) riskScore += 10;

    // 2. No active opportunities (30% weight)
    const activeOpportunities = company.opportunities?.filter(
      opp => opp.stage !== 'CLOSED_WON' && opp.stage !== 'CLOSED_LOST'
    ).length || 0;
    
    if (activeOpportunities === 0) riskScore += 30;
    else if (activeOpportunities === 1) riskScore += 15;

    // 3. Low health score (20% weight)
    const healthScore = company.healthScore || 50;
    if (healthScore <= 30) riskScore += 20;
    else if (healthScore <= 50) riskScore += 10;

    // 4. No active projects (10% weight)
    const activeProjects = company.projects?.filter(
      p => p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
    ).length || 0;
    
    if (activeProjects === 0) riskScore += 10;

    // Calculate risk percentage
    const churnRisk = Math.min(riskScore, maxRisk) / 100;

    // Determine risk level
    let riskLevel: string;
    if (churnRisk >= 0.7) riskLevel = 'HIGH';
    else if (churnRisk >= 0.4) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Update company with churn risk
    await prisma.company.update({
      where: { id: companyId },
      data: { 
        churnRisk,
        riskLevel,
      },
    });

    return churnRisk;
  }

  /**
   * Calculate lifetime value for a company
   */
  async calculateLifetimeValue(companyId: string): Promise<number> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        opportunities: {
          where: {
            deletedAt: null,
            stage: 'CLOSED_WON',
          },
        },
      },
    });

    if (!company) {
      throw new BadRequestError('Company not found');
    }

    // Calculate historical revenue
    const historicalRevenue = company.opportunities?.reduce(
      (sum, opp) => sum + (opp.amount || 0), 
      0
    ) || 0;

    // Calculate average annual revenue
    const accountAge = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(company.createdAt).getTime()) / 
        (365 * 24 * 60 * 60 * 1000)
      )
    );
    const avgAnnualRevenue = historicalRevenue / accountAge;

    // Estimate retention years based on churn risk
    const churnRisk = company.churnRisk || 0.5;
    const estimatedRetentionYears = Math.max(1, Math.round(5 * (1 - churnRisk)));

    // Calculate LTV
    const lifetimeValue = avgAnnualRevenue * estimatedRetentionYears;

    // Update company with LTV
    await prisma.company.update({
      where: { id: companyId },
      data: { lifetimeValue },
    });

    return lifetimeValue;
  }

  /**
   * Batch update analytics for multiple companies
   */
  async batchUpdateAnalytics(companyIds?: string[]): Promise<void> {
    const companies = companyIds 
      ? await prisma.company.findMany({
          where: { 
            id: { in: companyIds },
            deletedAt: null,
          },
        })
      : await prisma.company.findMany({
          where: { deletedAt: null },
          take: 100, // Process 100 at a time if no specific IDs
        });

    for (const company of companies) {
      try {
        await this.calculateHealthScore(company.id);
        await this.calculateChurnRisk(company.id);
        await this.calculateLifetimeValue(company.id);
        await this.autoSegmentCompany(company.id);
      } catch (error) {
        console.error(`Failed to update analytics for company ${company.id}:`, error);
      }
    }
  }

  /**
   * Get analytics dashboard for a company
   */
  async getCompanyAnalytics(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        segment: true,
        healthScore: true,
        churnRisk: true,
        riskLevel: true,
        lifetimeValue: true,
        engagementScore: true,
        satisfactionScore: true,
        lastHealthCheck: true,
      },
    });

    if (!company) {
      throw new BadRequestError('Company not found');
    }

    // Calculate fresh scores if needed
    const shouldRefresh = !company.lastHealthCheck || 
      (Date.now() - new Date(company.lastHealthCheck).getTime()) > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldRefresh) {
      await this.calculateHealthScore(companyId);
      await this.calculateChurnRisk(companyId);
      await this.calculateLifetimeValue(companyId);
      await this.autoSegmentCompany(companyId);
      
      // Fetch updated data
      return await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          segment: true,
          healthScore: true,
          churnRisk: true,
          riskLevel: true,
          lifetimeValue: true,
          engagementScore: true,
          satisfactionScore: true,
          lastHealthCheck: true,
        },
      });
    }

    return company;
  }
}

export const companyAnalyticsService = new CompanyAnalyticsService();