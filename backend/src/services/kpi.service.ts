import { Prisma, KpiCategory, KpiPeriod, KpiStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateKpiDefinitionInput {
  code: string;
  name: string;
  description?: string;
  category: KpiCategory;
  formula?: string;
  unit?: string;
  targetDirection?: string;
  weight?: number;
  isActive?: boolean;
  departmentId?: string;
  teamId?: string;
  userId?: string;
  parentId?: string;
}

interface UpdateKpiDefinitionInput extends Partial<CreateKpiDefinitionInput> {}

interface KpiDefinitionFilter {
  search?: string;
  category?: KpiCategory;
  departmentId?: string;
  teamId?: string;
  userId?: string;
  isActive?: boolean;
  parentId?: string | null;
}

interface CreateKpiTargetInput {
  kpiDefinitionId: string;
  period: KpiPeriod;
  year: number;
  month?: number;
  quarter?: number;
  targetValue: number;
  minValue?: number;
  maxValue?: number;
  weight?: number;
  departmentId?: string;
  teamId?: string;
  userId?: string;
}

interface UpdateKpiTargetInput extends Partial<Omit<CreateKpiTargetInput, 'kpiDefinitionId'>> {
  status?: KpiStatus;
}

interface CreateKpiActualInput {
  kpiTargetId: string;
  actualValue: number;
  achievementRate?: number;
  recordedDate: Date | string;
  notes?: string;
  evidence?: string[];
}

interface UpdateKpiActualInput extends Partial<Omit<CreateKpiActualInput, 'kpiTargetId'>> {}

interface KpiTargetFilter {
  kpiDefinitionId?: string;
  period?: KpiPeriod;
  year?: number;
  month?: number;
  quarter?: number;
  departmentId?: string;
  teamId?: string;
  userId?: string;
  status?: KpiStatus;
}

export class KpiService {
  // Calculate achievement rate
  private calculateAchievementRate(actual: number, target: number, targetDirection?: string): number {
    if (target === 0) return 0;
    
    const rate = (actual / target) * 100;
    
    // If target direction is "lower is better" (e.g., cost reduction)
    if (targetDirection === 'DECREASE') {
      return target > 0 ? ((2 * target - actual) / target) * 100 : 0;
    }
    
    return rate;
  }

  // Calculate weighted score
  private calculateWeightedScore(achievementRate: number, weight: number = 1): number {
    return (achievementRate * weight) / 100;
  }

  // KPI Definition CRUD
  async createKpiDefinition(input: CreateKpiDefinitionInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.kpiDefinition.findUnique({
      where: { code: input.code }
    });

    if (existing) {
      throw new ConflictError('KPI code already exists');
    }

    // Validate hierarchy - can't have both department and team, or team and user
    if (input.departmentId && input.teamId && input.userId) {
      throw new ValidationError('KPI can only be assigned to one level: department, team, or user');
    }

    const kpiDefinition = await prisma.kpiDefinition.create({
      data: {
        ...input,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        _count: {
          select: {
            children: true,
            targets: true,
          }
        }
      }
    });

    return kpiDefinition;
  }

  async getKpiDefinitions(filter: KpiDefinitionFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.KpiDefinitionWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.teamId) {
      where.teamId = filter.teamId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.parentId !== undefined) {
      where.parentId = filter.parentId;
    }

    const [definitions, total] = await Promise.all([
      prisma.kpiDefinition.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          department: {
            select: {
              id: true,
              name: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          _count: {
            select: {
              children: true,
              targets: true,
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { code: 'asc' }
        ],
      }),
      prisma.kpiDefinition.count({ where }),
    ]);

    return {
      data: definitions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getKpiDefinitionById(id: string) {
    const definition = await prisma.kpiDefinition.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
          }
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            weight: true,
          }
        },
        targets: {
          orderBy: [
            { year: 'desc' },
            { month: 'desc' }
          ],
          take: 12,
          include: {
            actuals: {
              orderBy: { recordedDate: 'desc' },
            }
          }
        },
        _count: {
          select: {
            children: true,
            targets: true,
          }
        }
      },
    });

    if (!definition) {
      throw new NotFoundError('KPI definition not found');
    }

    return definition;
  }

  async updateKpiDefinition(id: string, input: UpdateKpiDefinitionInput, userId: string) {
    const existing = await prisma.kpiDefinition.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('KPI definition not found');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.kpiDefinition.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('KPI code already exists');
      }
    }

    const definition = await prisma.kpiDefinition.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return definition;
  }

  async deleteKpiDefinition(id: string) {
    const definition = await prisma.kpiDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            targets: true,
          }
        }
      }
    });

    if (!definition) {
      throw new NotFoundError('KPI definition not found');
    }

    if (definition._count.children > 0) {
      throw new ValidationError('Cannot delete KPI with child KPIs');
    }

    if (definition._count.targets > 0) {
      // Soft delete by deactivating
      await prisma.kpiDefinition.update({
        where: { id },
        data: { isActive: false }
      });
    } else {
      // Hard delete if no targets
      await prisma.kpiDefinition.delete({
        where: { id }
      });
    }
  }

  // KPI Target Management
  async createKpiTarget(input: CreateKpiTargetInput, userId: string) {
    // Verify KPI definition exists
    const definition = await prisma.kpiDefinition.findUnique({
      where: { id: input.kpiDefinitionId }
    });

    if (!definition) {
      throw new NotFoundError('KPI definition not found');
    }

    // Check for duplicate target
    const existingTarget = await prisma.kpiTarget.findFirst({
      where: {
        kpiDefinitionId: input.kpiDefinitionId,
        period: input.period,
        year: input.year,
        month: input.month,
        quarter: input.quarter,
      }
    });

    if (existingTarget) {
      throw new ConflictError('Target already exists for this period');
    }

    const target = await prisma.kpiTarget.create({
      data: {
        ...input,
        status: KpiStatus.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        kpiDefinition: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
            targetDirection: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return target;
  }

  async getKpiTargets(filter: KpiTargetFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.KpiTargetWhereInput = {};

    if (filter.kpiDefinitionId) {
      where.kpiDefinitionId = filter.kpiDefinitionId;
    }

    if (filter.period) {
      where.period = filter.period;
    }

    if (filter.year) {
      where.year = filter.year;
    }

    if (filter.month) {
      where.month = filter.month;
    }

    if (filter.quarter) {
      where.quarter = filter.quarter;
    }

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.teamId) {
      where.teamId = filter.teamId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const [targets, total] = await Promise.all([
      prisma.kpiTarget.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          kpiDefinition: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              unit: true,
              targetDirection: true,
            }
          },
          department: {
            select: {
              id: true,
              name: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          actuals: {
            orderBy: { recordedDate: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              actuals: true,
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ],
      }),
      prisma.kpiTarget.count({ where }),
    ]);

    // Calculate current achievement for each target
    const targetsWithAchievement = targets.map(target => {
      const latestActual = target.actuals[0];
      const achievementRate = latestActual 
        ? this.calculateAchievementRate(
            latestActual.actualValue, 
            target.targetValue,
            target.kpiDefinition.targetDirection
          )
        : 0;

      return {
        ...target,
        currentActual: latestActual?.actualValue || 0,
        achievementRate,
        weightedScore: this.calculateWeightedScore(achievementRate, target.weight || 1),
      };
    });

    return {
      data: targetsWithAchievement,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateKpiTarget(id: string, input: UpdateKpiTargetInput, userId: string) {
    const existing = await prisma.kpiTarget.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('KPI target not found');
    }

    const target = await prisma.kpiTarget.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        kpiDefinition: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
          }
        }
      }
    });

    return target;
  }

  // KPI Actual Management
  async recordKpiActual(input: CreateKpiActualInput, userId: string) {
    // Verify target exists
    const target = await prisma.kpiTarget.findUnique({
      where: { id: input.kpiTargetId },
      include: {
        kpiDefinition: true,
      }
    });

    if (!target) {
      throw new NotFoundError('KPI target not found');
    }

    // Convert date if needed
    if (input.recordedDate && typeof input.recordedDate === 'string') {
      input.recordedDate = new Date(input.recordedDate);
    }

    // Calculate achievement rate
    const achievementRate = this.calculateAchievementRate(
      input.actualValue,
      target.targetValue,
      target.kpiDefinition.targetDirection
    );

    const actual = await prisma.kpiActual.create({
      data: {
        ...input,
        achievementRate,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        kpiTarget: {
          select: {
            id: true,
            targetValue: true,
            period: true,
            year: true,
            month: true,
            kpiDefinition: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              }
            }
          }
        }
      }
    });

    // Update target status based on achievement
    let status = KpiStatus.IN_PROGRESS;
    if (achievementRate >= 100) {
      status = KpiStatus.ACHIEVED;
    } else if (achievementRate < 50) {
      status = KpiStatus.AT_RISK;
    }

    await prisma.kpiTarget.update({
      where: { id: input.kpiTargetId },
      data: { status }
    });

    return actual;
  }

  async getKpiActuals(targetId: string) {
    const actuals = await prisma.kpiActual.findMany({
      where: { kpiTargetId: targetId },
      orderBy: { recordedDate: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return actuals;
  }

  async updateKpiActual(id: string, input: UpdateKpiActualInput, userId: string) {
    const existing = await prisma.kpiActual.findUnique({
      where: { id },
      include: {
        kpiTarget: {
          include: {
            kpiDefinition: true,
          }
        }
      }
    });

    if (!existing) {
      throw new NotFoundError('KPI actual not found');
    }

    // Convert date if needed
    if (input.recordedDate && typeof input.recordedDate === 'string') {
      input.recordedDate = new Date(input.recordedDate);
    }

    // Recalculate achievement rate if value changed
    let achievementRate = existing.achievementRate;
    if (input.actualValue !== undefined) {
      achievementRate = this.calculateAchievementRate(
        input.actualValue,
        existing.kpiTarget.targetValue,
        existing.kpiTarget.kpiDefinition.targetDirection
      );
    }

    const actual = await prisma.kpiActual.update({
      where: { id },
      data: {
        ...input,
        achievementRate,
        updatedBy: userId,
      }
    });

    return actual;
  }

  // KPI Dashboard & Analytics
  async getKpiDashboard(filter: {
    departmentId?: string;
    teamId?: string;
    userId?: string;
    year?: number;
    month?: number;
    period?: KpiPeriod;
  }) {
    const where: Prisma.KpiTargetWhereInput = {
      status: { not: KpiStatus.INACTIVE },
    };

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.teamId) {
      where.teamId = filter.teamId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.year) {
      where.year = filter.year;
    }

    if (filter.month) {
      where.month = filter.month;
    }

    if (filter.period) {
      where.period = filter.period;
    }

    // Get targets with latest actuals
    const targets = await prisma.kpiTarget.findMany({
      where,
      include: {
        kpiDefinition: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
            targetDirection: true,
            weight: true,
          }
        },
        actuals: {
          orderBy: { recordedDate: 'desc' },
          take: 1,
        }
      }
    });

    // Group by category and calculate scores
    const categoryGroups = targets.reduce((acc, target) => {
      const category = target.kpiDefinition.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          kpis: [],
          totalWeight: 0,
          weightedScore: 0,
          averageAchievement: 0,
        };
      }

      const latestActual = target.actuals[0];
      const achievementRate = latestActual?.achievementRate || 0;
      const weight = target.weight || target.kpiDefinition.weight || 1;
      const weightedScore = this.calculateWeightedScore(achievementRate, weight);

      acc[category].kpis.push({
        kpiCode: target.kpiDefinition.code,
        kpiName: target.kpiDefinition.name,
        targetValue: target.targetValue,
        actualValue: latestActual?.actualValue || 0,
        achievementRate,
        weight,
        weightedScore,
        status: target.status,
      });

      acc[category].totalWeight += weight;
      acc[category].weightedScore += weightedScore;

      return acc;
    }, {} as Record<string, any>);

    // Calculate category averages
    Object.values(categoryGroups).forEach((group: any) => {
      group.averageAchievement = group.totalWeight > 0 
        ? (group.weightedScore / group.totalWeight) * 100
        : 0;
    });

    // Overall summary
    const summary = {
      totalKpis: targets.length,
      achievedCount: targets.filter(t => t.status === KpiStatus.ACHIEVED).length,
      inProgressCount: targets.filter(t => t.status === KpiStatus.IN_PROGRESS).length,
      atRiskCount: targets.filter(t => t.status === KpiStatus.AT_RISK).length,
      overallScore: Object.values(categoryGroups).reduce((sum: number, g: any) => 
        sum + g.weightedScore, 0
      ) / Math.max(Object.values(categoryGroups).reduce((sum: number, g: any) => 
        sum + g.totalWeight, 0
      ), 1) * 100,
    };

    return {
      summary,
      categories: Object.values(categoryGroups),
      recentUpdates: targets
        .filter(t => t.actuals.length > 0)
        .sort((a, b) => {
          const dateA = a.actuals[0]?.recordedDate || new Date(0);
          const dateB = b.actuals[0]?.recordedDate || new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map(t => ({
          kpiName: t.kpiDefinition.name,
          targetValue: t.targetValue,
          actualValue: t.actuals[0]?.actualValue || 0,
          achievementRate: t.actuals[0]?.achievementRate || 0,
          updatedAt: t.actuals[0]?.recordedDate,
        })),
    };
  }
}

export const kpiService = new KpiService();