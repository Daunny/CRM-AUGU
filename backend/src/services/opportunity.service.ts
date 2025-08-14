import { Prisma, OpportunityType, OpportunityStage } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

interface CreateOpportunityInput {
  code: string;
  title: string;
  description?: string;
  companyId: string;
  branchId?: string;
  contactId?: string;
  type?: OpportunityType;
  stage?: OpportunityStage;
  probability?: number;
  amount?: number;
  currency?: string;
  expectedCloseDate?: Date | string;
  competitorInfo?: string;
  nextAction?: string;
  nextActionDate?: Date | string;
  lossReason?: string;
  tags?: string[];
  customFields?: any;
  accountManagerId?: string;
  salesTeamId?: string;
}

interface UpdateOpportunityInput extends Partial<CreateOpportunityInput> {
  actualCloseDate?: Date | string;
}

interface OpportunityFilter {
  search?: string;
  companyId?: string;
  stage?: OpportunityStage;
  type?: OpportunityType;
  accountManagerId?: string;
  salesTeamId?: string;
  minAmount?: number;
  maxAmount?: number;
  expectedCloseDateFrom?: Date | string;
  expectedCloseDateTo?: Date | string;
}

export class OpportunityService {
  // Calculate expected amount based on probability
  private calculateExpectedAmount(amount: number | null, probability: number): number {
    if (!amount) return 0;
    return amount * (probability / 100);
  }

  // Update stage probability mapping
  private getStageProbability(stage: OpportunityStage): number {
    const probabilityMap: Record<OpportunityStage, number> = {
      [OpportunityStage.QUALIFYING]: 10,
      [OpportunityStage.NEEDS_ANALYSIS]: 20,
      [OpportunityStage.PROPOSAL]: 60,
      [OpportunityStage.NEGOTIATION]: 80,
      [OpportunityStage.CLOSED_WON]: 100,
      [OpportunityStage.CLOSED_LOST]: 0,
    };
    return probabilityMap[stage] || 10;
  }

  // Opportunity CRUD
  async createOpportunity(input: CreateOpportunityInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.opportunity.findUnique({
      where: { code: input.code }
    });

    if (existing) {
      throw new ConflictError('Opportunity code already exists');
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: input.companyId }
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Convert dates if needed
    if (input.expectedCloseDate && typeof input.expectedCloseDate === 'string') {
      input.expectedCloseDate = new Date(input.expectedCloseDate);
    }
    if (input.nextActionDate && typeof input.nextActionDate === 'string') {
      input.nextActionDate = new Date(input.nextActionDate);
    }

    // Set probability based on stage if not provided
    const probability = input.probability ?? this.getStageProbability(input.stage || OpportunityStage.QUALIFYING);
    const expectedAmount = this.calculateExpectedAmount(input.amount || 0, probability);

    const opportunity = await prisma.opportunity.create({
      data: {
        ...input,
        probability,
        expectedAmount,
        accountManagerId: input.accountManagerId || userId,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        salesTeam: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        activityType: 'NOTE',
        entityType: 'OPPORTUNITY',
        entityId: opportunity.id,
        subject: `Opportunity ${opportunity.code} created`,
        description: `New opportunity "${opportunity.title}" created for ${company.name}`,
        companyId: input.companyId,
        opportunityId: opportunity.id,
        userId,
        startTime: new Date(),
      }
    });

    return opportunity;
  }

  async getOpportunities(filter: OpportunityFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.OpportunityWhereInput = {
      deletedAt: null,
    };

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }

    if (filter.stage) {
      where.stage = filter.stage;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.accountManagerId) {
      where.accountManagerId = filter.accountManagerId;
    }

    if (filter.salesTeamId) {
      where.salesTeamId = filter.salesTeamId;
    }

    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      where.amount = {};
      if (filter.minAmount !== undefined) {
        where.amount.gte = filter.minAmount;
      }
      if (filter.maxAmount !== undefined) {
        where.amount.lte = filter.maxAmount;
      }
    }

    if (filter.expectedCloseDateFrom || filter.expectedCloseDateTo) {
      where.expectedCloseDate = {};
      if (filter.expectedCloseDateFrom) {
        where.expectedCloseDate.gte = new Date(filter.expectedCloseDateFrom);
      }
      if (filter.expectedCloseDateTo) {
        where.expectedCloseDate.lte = new Date(filter.expectedCloseDateTo);
      }
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          accountManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          salesTeam: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              activities: true,
            }
          }
        },
        orderBy: [
          { expectedAmount: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      prisma.opportunity.count({ where }),
    ]);

    return {
      data: opportunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOpportunityById(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            businessNumber: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            addressStreet: true,
            addressCity: true,
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
          }
        },
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        salesTeam: {
          select: {
            id: true,
            name: true,
          }
        },
        activities: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            activities: true,
          }
        }
      },
    });

    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    return opportunity;
  }

  async updateOpportunity(id: string, input: UpdateOpportunityInput, userId: string) {
    const existing = await prisma.opportunity.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Opportunity not found');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.opportunity.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('Opportunity code already exists');
      }
    }

    // Convert dates if needed
    if (input.expectedCloseDate && typeof input.expectedCloseDate === 'string') {
      input.expectedCloseDate = new Date(input.expectedCloseDate);
    }
    if (input.nextActionDate && typeof input.nextActionDate === 'string') {
      input.nextActionDate = new Date(input.nextActionDate);
    }
    if (input.actualCloseDate && typeof input.actualCloseDate === 'string') {
      input.actualCloseDate = new Date(input.actualCloseDate);
    }

    // Update probability based on stage if stage changed
    let probability = existing.probability;
    if (input.stage && input.stage !== existing.stage) {
      probability = input.probability ?? this.getStageProbability(input.stage);
    } else if (input.probability !== undefined) {
      probability = input.probability;
    }

    // Calculate expected amount
    const amount = input.amount ?? existing.amount;
    const expectedAmount = this.calculateExpectedAmount(amount || 0, probability);

    // Handle stage changes
    let actualCloseDate = existing.actualCloseDate;
    
    if (input.stage === OpportunityStage.CLOSED_WON) {
      actualCloseDate = new Date(input.actualCloseDate || new Date());
    } else if (input.stage === OpportunityStage.CLOSED_LOST) {
      actualCloseDate = new Date(input.actualCloseDate || new Date());
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...input,
        probability,
        expectedAmount,
        actualCloseDate,
        updatedBy: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Create activity log for significant changes
    if (input.stage && input.stage !== existing.stage) {
      await prisma.activity.create({
        data: {
          activityType: 'NOTE',
          entityType: 'OPPORTUNITY',
          entityId: opportunity.id,
          subject: `Stage changed: ${existing.stage} → ${input.stage}`,
          description: `Opportunity ${opportunity.code} stage updated`,
          companyId: opportunity.companyId,
          opportunityId: opportunity.id,
          userId,
          startTime: new Date(),
        }
      });
    }

    return opportunity;
  }

  async deleteOpportunity(id: string, userId: string) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    // For now, we'll allow deletion

    // Soft delete
    await prisma.opportunity.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });
  }

  // Pipeline Analytics
  async getPipelineAnalytics(filter: { salesTeamId?: string; accountManagerId?: string; dateFrom?: Date | string; dateTo?: Date | string }) {
    const where: Prisma.OpportunityWhereInput = {
      deletedAt: null,
    };

    if (filter.salesTeamId) {
      where.salesTeamId = filter.salesTeamId;
    }

    if (filter.accountManagerId) {
      where.accountManagerId = filter.accountManagerId;
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

    const opportunities = await prisma.opportunity.groupBy({
      by: ['stage'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        expectedAmount: true,
      },
    });

    const stages = Object.values(OpportunityStage);
    const pipeline = stages.map(stage => {
      const data = opportunities.find(o => o.stage === stage);
      return {
        stage,
        count: data?._count.id || 0,
        amount: data?._sum.amount || 0,
        expectedAmount: data?._sum.expectedAmount || 0,
      };
    });

    const summary = {
      totalOpportunities: opportunities.reduce((sum, o) => sum + o._count.id, 0),
      totalValue: opportunities.reduce((sum, o) => sum + (o._sum.amount || 0), 0),
      totalExpectedValue: opportunities.reduce((sum, o) => sum + (o._sum.expectedAmount || 0), 0),
      pipeline,
    };

    return summary;
  }
}

export const opportunityService = new OpportunityService();