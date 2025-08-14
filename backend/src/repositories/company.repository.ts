import { PrismaClient, Prisma, Company } from '@prisma/client';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CompanyFilters {
  search?: string;
  status?: string;
  industryId?: string;
  tier?: string;
  accountManagerId?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CompanyRepository {
  /**
   * Find all companies with filters and pagination
   */
  async findAll(filters: CompanyFilters = {}, pagination: PaginationOptions = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CompanyWhereInput = {
      deletedAt: null
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { businessNumber: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.industryId) {
      where.industryId = filters.industryId;
    }

    if (filters.tier) {
      where.tier = filters.tier;
    }

    if (filters.accountManagerId) {
      where.accountManagerId = filters.accountManagerId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Execute queries
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          industry: true,
          accountManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          branches: {
            where: { isPrimary: true },
            take: 1
          },
          _count: {
            select: {
              opportunities: true,
              projects: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Find company by ID
   */
  async findById(id: string) {
    const company = await prisma.company.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        industry: true,
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        branches: true,
        opportunities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            accountManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        projects: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return company;
  }

  /**
   * Find company by code
   */
  async findByCode(code: string) {
    const company = await prisma.company.findFirst({
      where: {
        code,
        deletedAt: null
      }
    });

    return company;
  }

  /**
   * Find company by business number
   */
  async findByBusinessNumber(businessNumber: string) {
    const company = await prisma.company.findFirst({
      where: {
        businessNumber,
        deletedAt: null
      }
    });

    return company;
  }

  /**
   * Create new company
   */
  async create(data: Prisma.CompanyCreateInput) {
    // Check for duplicate code
    if (data.code) {
      const existingCode = await this.findByCode(data.code);
      if (existingCode) {
        throw new AppError('Company code already exists', 400);
      }
    }

    // Check for duplicate business number
    if (data.businessNumber) {
      const existingBizNum = await this.findByBusinessNumber(data.businessNumber);
      if (existingBizNum) {
        throw new AppError('Business number already exists', 400);
      }
    }

    const company = await prisma.company.create({
      data,
      include: {
        industry: true,
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return company;
  }

  /**
   * Update company
   */
  async update(id: string, data: Prisma.CompanyUpdateInput) {
    // Check if company exists
    const existing = await this.findById(id);

    // Check for duplicate code if changing
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await this.findByCode(data.code as string);
      if (duplicateCode) {
        throw new AppError('Company code already exists', 400);
      }
    }

    // Check for duplicate business number if changing
    if (data.businessNumber && data.businessNumber !== existing.businessNumber) {
      const duplicateBizNum = await this.findByBusinessNumber(data.businessNumber as string);
      if (duplicateBizNum) {
        throw new AppError('Business number already exists', 400);
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data,
      include: {
        industry: true,
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return company;
  }

  /**
   * Soft delete company
   */
  async delete(id: string, deletedBy: string) {
    // Check if company exists
    await this.findById(id);

    // Check for active opportunities or projects
    const activeRelations = await prisma.company.findFirst({
      where: { id },
      select: {
        _count: {
          select: {
            opportunities: {
              where: {
                status: {
                  in: ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION']
                }
              }
            },
            projects: {
              where: {
                status: {
                  in: ['PLANNING', 'IN_PROGRESS']
                }
              }
            }
          }
        }
      }
    });

    if (activeRelations) {
      const { opportunities, projects } = activeRelations._count;
      if (opportunities > 0 || projects > 0) {
        throw new AppError(
          `Cannot delete company with ${opportunities} active opportunities and ${projects} active projects`,
          400
        );
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        isActive: false
      }
    });

    return company;
  }

  /**
   * Restore soft deleted company
   */
  async restore(id: string) {
    const company = await prisma.company.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        isActive: true
      }
    });

    return company;
  }

  /**
   * Get company statistics
   */
  async getStatistics(id: string) {
    const stats = await prisma.company.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        _count: {
          select: {
            branches: true,
            opportunities: {
              where: { deletedAt: null }
            },
            projects: {
              where: { deletedAt: null }
            },
            activities: true,
            meetings: true
          }
        },
        opportunities: {
          where: {
            deletedAt: null,
            status: 'WON'
          },
          select: {
            expectedRevenue: true
          }
        },
        projects: {
          where: {
            deletedAt: null,
            status: 'COMPLETED'
          },
          select: {
            actualRevenue: true
          }
        }
      }
    });

    if (!stats) {
      throw new AppError('Company not found', 404);
    }

    const totalExpectedRevenue = stats.opportunities.reduce(
      (sum, opp) => sum + (opp.expectedRevenue || 0),
      0
    );

    const totalActualRevenue = stats.projects.reduce(
      (sum, proj) => sum + (proj.actualRevenue || 0),
      0
    );

    return {
      totalBranches: stats._count.branches,
      totalOpportunities: stats._count.opportunities,
      totalProjects: stats._count.projects,
      totalActivities: stats._count.activities,
      totalMeetings: stats._count.meetings,
      totalExpectedRevenue,
      totalActualRevenue
    };
  }

  /**
   * Generate unique company code
   */
  async generateCode(prefix: string = 'COM'): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Find the latest code with this prefix
    const latestCompany = await prisma.company.findFirst({
      where: {
        code: {
          startsWith: `${prefix}${year}${month}`
        }
      },
      orderBy: {
        code: 'desc'
      }
    });

    let sequence = 1;
    if (latestCompany) {
      const lastSequence = parseInt(latestCompany.code.slice(-4)) || 0;
      sequence = lastSequence + 1;
    }

    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
  }
}