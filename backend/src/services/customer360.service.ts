import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import {
  Customer360View,
  CustomerSegment,
  InteractionItem,
  RevenueAnalytics,
  RiskAssessment,
  EngagementTimeline,
  TimelineActivity,
  OpportunityMetrics,
  CompanyWithRelations,
  CustomerMetrics,
} from '../types/customer360.types';

interface CustomerHealthScore {
  overall: number;
  engagement: number;
  satisfaction: number;
  revenue: number;
  risk: number;
  factors: {
    factor: string;
    score: number;
    weight: number;
    description: string;
  }[];
}

interface CustomerSegmentOld {
  type: 'SIZE' | 'INDUSTRY' | 'VALUE' | 'LIFECYCLE';
  value: string;
  description: string;
}

interface Customer360ViewOld {
  company: CompanyWithRelations;
  segments: CustomerSegment[];
  healthScore: CustomerHealthScore;
  summary: {
    totalOpportunities: number;
    activeOpportunities: number;
    wonOpportunities: number;
    totalRevenue: number;
    totalContacts: number;
    keyContacts: any[];
    lastInteraction: Date | null;
    nextAction: {
      type: string;
      description: string;
      dueDate: Date | null;
    } | null;
  };
  timeline: {
    activities: any[];
    opportunities: any[];
  };
  financials: {
    totalRevenue: number;
    averageDealSize: number;
    pipelineValue: number;
  };
  relationships: {
    branches: any[];
    contacts: any[];
    decisionMakers: any[];
  };
}

export class Customer360Service {
  // Calculate customer health score
  private calculateHealthScore(): CustomerHealthScore {
    // This is a simplified version - in production, this would use actual metrics
    const factors = [
      { factor: 'Engagement Level', score: 85, weight: 0.25, description: 'Based on interaction frequency' },
      { factor: 'Revenue Growth', score: 75, weight: 0.30, description: 'Year-over-year revenue change' },
      { factor: 'Project Success', score: 90, weight: 0.20, description: 'Project completion and satisfaction' },
      { factor: 'Payment History', score: 95, weight: 0.15, description: 'On-time payment rate' },
      { factor: 'Support Tickets', score: 70, weight: 0.10, description: 'Issue resolution metrics' },
    ];

    const overall = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);

    return {
      overall: Math.round(overall),
      engagement: 85,
      satisfaction: 88,
      revenue: 75,
      risk: 15, // Lower is better
      factors,
    };
  }

  // Determine customer segments
  private async determineSegments(company: any): Promise<CustomerSegment[]> {
    const segments: CustomerSegment[] = [];

    // Size segment (simplified - can be expanded when size field is added)
    segments.push({
      type: 'SIZE',
      value: 'Standard',
      description: 'Standard customer segment',
    });

    // Industry segment
    if (company.industry) {
      segments.push({
        type: 'INDUSTRY',
        value: company.industry.name,
        description: `Operating in ${company.industry.name} industry`,
      });
    }

    // Value segment (based on total revenue)
    const opportunities = await prisma.opportunity.findMany({
      where: {
        companyId: company.id,
        stage: 'CLOSED_WON',
      },
      select: {
        amount: true,
      },
    });

    const totalRevenue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    
    let valueSegment: string;
    if (totalRevenue > 100000000) { // 1억원 이상
      valueSegment = 'Strategic';
    } else if (totalRevenue > 50000000) { // 5천만원 이상
      valueSegment = 'Key Account';
    } else if (totalRevenue > 10000000) { // 1천만원 이상
      valueSegment = 'Growth';
    } else {
      valueSegment = 'Transactional';
    }

    segments.push({
      type: 'VALUE',
      value: valueSegment,
      description: `${valueSegment} account based on revenue contribution`,
    });

    // Lifecycle segment
    const accountAge = Math.floor(
      (Date.now() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    
    let lifecycleSegment: string;
    if (accountAge < 1) {
      lifecycleSegment = 'New Customer';
    } else if (accountAge < 3) {
      lifecycleSegment = 'Growing Customer';
    } else {
      lifecycleSegment = 'Established Customer';
    }

    segments.push({
      type: 'LIFECYCLE',
      value: lifecycleSegment,
      description: `${lifecycleSegment} (${accountAge} years)`,
    });

    return segments;
  }

  // Get comprehensive customer view
  async getCustomer360View(companyId: string): Promise<Customer360View> {
    // Fetch company with industry
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        industry: true,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Fetch related data separately
    const [branches, contacts, opportunities, activities] = await Promise.all([
      prisma.branch.findMany({
        where: { companyId, deletedAt: null },
      }),
      prisma.contact.findMany({
        where: { 
          branchId: {
            in: await prisma.branch.findMany({
              where: { companyId },
              select: { id: true }
            }).then(b => b.map(x => x.id))
          },
          deletedAt: null 
        },
        include: {
          branch: {
            select: { name: true },
          },
        },
      }),
      prisma.opportunity.findMany({
        where: { companyId, deletedAt: null },
        include: {
          accountManager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.findMany({
        where: { companyId },
        orderBy: { startTime: 'desc' },
        take: 20,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    // Calculate segments and health score
    const segments = await this.determineSegments(company);
    const healthScore = this.calculateHealthScore();

    // Identify key contacts (decision makers)
    const keyContacts = contacts
      .filter((c: any) => c.isKeyContact || c.jobTitle?.includes('대표') || c.jobTitle?.includes('임원'))
      .slice(0, 5);

    // Calculate summary metrics
    const activeOpportunities = opportunities.filter(
      (o: any) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)
    );
    const wonOpportunities = opportunities.filter((o: any) => o.stage === 'CLOSED_WON');
    const totalRevenue = wonOpportunities.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

    // Find last interaction and next action
    const lastActivity = activities[0];
    const upcomingActivities = await prisma.activity.findMany({
      where: {
        companyId,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: 1,
    });

    const nextAction = upcomingActivities[0]
      ? {
          type: upcomingActivities[0].activityType,
          description: upcomingActivities[0].subject,
          dueDate: upcomingActivities[0].startTime,
        }
      : null;

    // Prepare timeline
    const timeline = {
      activities: activities.slice(0, 10),
      opportunities: opportunities.slice(0, 5),
    };

    // Calculate financials
    const pipelineValue = activeOpportunities.reduce((sum, o) => sum + (o.expectedAmount || 0), 0);
    const averageDealSize = wonOpportunities.length > 0 ? totalRevenue / wonOpportunities.length : 0;

    // Prepare relationships
    const relationships = {
      branches: branches,
      contacts: contacts.slice(0, 10),
      decisionMakers: keyContacts,
    };

    return {
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
        businessNumber: company.businessNumber,
        industry: company.industry,
        website: company.website,
        description: company.description,
        createdAt: company.createdAt,
      },
      segments,
      healthScore,
      summary: {
        totalOpportunities: opportunities.length,
        activeOpportunities: activeOpportunities.length,
        wonOpportunities: wonOpportunities.length,
        totalRevenue,
        totalContacts: contacts.length,
        keyContacts,
        lastInteraction: lastActivity ? lastActivity.startTime : null,
        nextAction,
      },
      timeline,
      financials: {
        totalRevenue,
        averageDealSize,
        pipelineValue,
      },
      relationships,
    };
  }

  // Get customer interaction history
  async getInteractionHistory(
    companyId: string,
    filter?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      userId?: string;
    }
  ) {
    const where: any = {
      companyId,
    };

    if (filter?.startDate || filter?.endDate) {
      where.startTime = {};
      if (filter.startDate) {
        where.startTime.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.startTime.lte = filter.endDate;
      }
    }

    if (filter?.type) {
      where.activityType = filter.type;
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Group activities by date
    const groupedActivities = activities.reduce((acc: any, activity) => {
      const date = new Date(activity.startTime).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    return {
      total: activities.length,
      activities,
      groupedByDate: groupedActivities,
      summary: {
        calls: activities.filter(a => a.activityType === 'CALL').length,
        emails: activities.filter(a => a.activityType === 'EMAIL').length,
        meetings: activities.filter(a => a.activityType === 'MEETING').length,
        notes: activities.filter(a => a.activityType === 'NOTE').length,
      },
    };
  }

  // Get customer revenue analytics
  async getRevenueAnalytics(companyId: string) {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        companyId,
      },
      include: {
        accountManager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const wonOpportunities = opportunities.filter(o => o.stage === 'CLOSED_WON');
    const lostOpportunities = opportunities.filter(o => o.stage === 'CLOSED_LOST');
    const activeOpportunities = opportunities.filter(
      o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)
    );

    const totalRevenue = wonOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
    const pipelineValue = activeOpportunities.reduce((sum, o) => sum + (o.expectedAmount || 0), 0);
    const winRate = opportunities.length > 0
      ? (wonOpportunities.length / (wonOpportunities.length + lostOpportunities.length)) * 100
      : 0;

    // Revenue by year
    const revenueByYear = wonOpportunities.reduce((acc: any, opp) => {
      const year = new Date(opp.actualCloseDate || opp.createdAt).getFullYear();
      if (!acc[year]) {
        acc[year] = 0;
      }
      acc[year] += opp.amount || 0;
      return acc;
    }, {});

    // Revenue by product/service (using opportunity type)
    const revenueByType = wonOpportunities.reduce((acc: any, opp) => {
      const type = opp.type || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += opp.amount || 0;
      return acc;
    }, {});

    return {
      summary: {
        totalRevenue,
        pipelineValue,
        winRate: Math.round(winRate),
        averageDealSize: wonOpportunities.length > 0 ? totalRevenue / wonOpportunities.length : 0,
        totalOpportunities: opportunities.length,
        wonDeals: wonOpportunities.length,
        lostDeals: lostOpportunities.length,
        activeDeals: activeOpportunities.length,
      },
      trends: {
        revenueByYear,
        revenueByType,
      },
      opportunities: {
        won: wonOpportunities.slice(0, 5),
        active: activeOpportunities.slice(0, 5),
        lost: lostOpportunities.slice(0, 5),
      },
    };
  }

  // Get customer risk assessment
  async getRiskAssessment(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const [opportunities, activities] = await Promise.all([
      prisma.opportunity.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.findMany({
        where: { companyId },
        orderBy: { startTime: 'desc' },
        take: 10,
      }),
    ]);

    const riskFactors = [];
    let overallRisk = 'LOW';

    // Check for recent activity
    const lastActivity = activities[0];
    const daysSinceLastActivity = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity.startTime).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastActivity > 90) {
      riskFactors.push({
        factor: 'No Recent Engagement',
        level: 'HIGH',
        description: `No interaction in ${daysSinceLastActivity} days`,
        recommendation: 'Schedule a check-in call or meeting',
      });
      overallRisk = 'HIGH';
    } else if (daysSinceLastActivity > 30) {
      riskFactors.push({
        factor: 'Low Engagement',
        level: 'MEDIUM',
        description: `Last interaction ${daysSinceLastActivity} days ago`,
        recommendation: 'Increase touchpoint frequency',
      });
      if (overallRisk === 'LOW') overallRisk = 'MEDIUM';
    }

    // Check for lost opportunities
    const recentLostOpps = opportunities.filter(
      o => o.stage === 'CLOSED_LOST' && 
      (Date.now() - new Date(o.actualCloseDate || o.updatedAt).getTime()) < 90 * 24 * 60 * 60 * 1000
    );

    if (recentLostOpps.length > 0) {
      riskFactors.push({
        factor: 'Recent Lost Deals',
        level: 'MEDIUM',
        description: `${recentLostOpps.length} deals lost in last 90 days`,
        recommendation: 'Analyze loss reasons and address concerns',
      });
      if (overallRisk === 'LOW') overallRisk = 'MEDIUM';
    }

    return {
      overallRisk,
      riskFactors,
      recommendations: riskFactors.map(f => f.recommendation),
      lastAssessment: new Date(),
    };
  }
}

export const customer360Service = new Customer360Service();