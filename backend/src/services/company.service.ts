import { CompanySize, CustomerTier, CustomerStatus, BranchType } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';
import { QueryOptimizer, PaginatedResult } from '../utils/query-optimizer';
import { cache, CacheTTL } from '../utils/cache-manager';

interface CreateCompanyInput {
  code: string;
  name: string;
  businessNumber?: string;
  representative?: string;
  industryId?: string;
  companySize?: CompanySize;
  annualRevenue?: number;
  employeeCount?: number;
  fiscalYearEnd?: string;
  website?: string;
  description?: string;
  tier?: CustomerTier;
  status?: CustomerStatus;
  creditLimit?: number;
  paymentTerms?: number;
  tags?: string[];
  customFields?: any;
  accountManagerId?: string;
}

interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

interface CreateBranchInput {
  companyId: string;
  code: string;
  name: string;
  branchType?: BranchType;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostal?: string;
  phone?: string;
  fax?: string;
  email?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  operatingHours?: string;
  customFields?: any;
}

interface UpdateBranchInput extends Partial<Omit<CreateBranchInput, 'companyId'>> {}

interface CreateContactInput {
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary?: boolean;
  birthday?: Date | string;
  preferredContactMethod?: string;
  notes?: string;
  linkedinUrl?: string;
  branchId: string;
}

interface UpdateContactInput extends Partial<CreateContactInput> {}

interface CompanyFilter {
  search?: string;
  industryId?: string;
  companySize?: CompanySize;
  tier?: CustomerTier;
  status?: CustomerStatus;
  accountManagerId?: string;
}

export class CompanyService {
  // Company CRUD with caching and optimization
  async createCompany(input: CreateCompanyInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.company.findUnique({
      where: { code: input.code }
    });

    if (existing) {
      throw new ConflictError('Company code already exists');
    }

    // Check if business number already exists
    if (input.businessNumber) {
      const businessNumberExists = await prisma.company.findUnique({
        where: { businessNumber: input.businessNumber }
      });
      if (businessNumberExists) {
        throw new ConflictError('Business number already exists');
      }
    }

    const company = await prisma.company.create({
      data: {
        ...input,
        createdBy: userId,
        updatedBy: userId,
      },
      include: QueryOptimizer.optimizeIncludes({
        industry: true,
        accountManager: true,
        branches: {
          take: 3,
        },
        _count: {
          select: {
            branches: true,
            opportunities: true,
            projects: true,
          }
        }
      })
    });

    // Invalidate related caches
    await cache.invalidateRelated('company', company.id);
    await cache.clearPattern('query:Company:*');

    return company;
  }

  async getCompanies(filter: CompanyFilter, page: number = 1, limit: number = 20): Promise<PaginatedResult<any>> {
    // Try to get from cache
    const cached = await cache.getQueryCache<PaginatedResult<any>>('Company', { filter, page, limit });
    if (cached) {
      return cached;
    }

    // Build optimized where clause
    const where = QueryOptimizer.buildWhereClause({
      search: filter.search,
      industryId: filter.industryId,
      companySize: filter.companySize,
      tier: filter.tier,
      status: filter.status,
      accountManagerId: filter.accountManagerId,
    });

    // Get pagination params
    const paginationParams = QueryOptimizer.getPaginationParams({ page, limit });

    // Execute optimized query
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        ...paginationParams,
        include: QueryOptimizer.optimizeIncludes({
          industry: true,
          accountManager: true,
          branches: {
            take: 3,
          },
          _count: {
            select: {
              branches: true,
              opportunities: true,
              projects: true,
            }
          }
        }),
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    const result: PaginatedResult<any> = {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };

    // Cache the result
    await cache.setQueryCache('Company', { filter, page, limit }, result, CacheTTL.MEDIUM);

    return result;
  }

  async getCompanyById(id: string) {
    // Try cache first
    const cached = await cache.getCompanyCache(id);
    if (cached) {
      return cached;
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: QueryOptimizer.optimizeIncludes({
        industry: true,
        accountManager: true,
        branches: {
          orderBy: { name: 'asc' },
        },
        opportunities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            contact: true,
          }
        },
        projects: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            projectManager: true,
          }
        },
        _count: {
          select: {
            branches: true,
            opportunities: true,
            projects: true,
            activities: true,
            meetings: true,
          }
        }
      }),
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Cache the company
    await cache.setCompanyCache(id, company, undefined, CacheTTL.LONG);

    return company;
  }

  async updateCompany(id: string, input: UpdateCompanyInput, userId: string) {
    const existing = await prisma.company.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Company not found');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.company.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('Company code already exists');
      }
    }

    // Check if new business number conflicts
    if (input.businessNumber && input.businessNumber !== existing.businessNumber) {
      const businessNumberExists = await prisma.company.findUnique({
        where: { businessNumber: input.businessNumber }
      });
      if (businessNumberExists) {
        throw new ConflictError('Business number already exists');
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: QueryOptimizer.optimizeIncludes({
        industry: true,
        accountManager: true,
        branches: {
          take: 3,
        },
        _count: {
          select: {
            branches: true,
            opportunities: true,
            projects: true,
          }
        }
      })
    });

    // Invalidate caches
    await cache.invalidateRelated('company', id);
    await cache.clearPattern('query:Company:*');

    return company;
  }

  async deleteCompany(id: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            branches: true,
            opportunities: true,
            projects: true,
          }
        }
      }
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Check if company has related records
    const hasRelatedRecords = 
      company._count.branches > 0 || 
      company._count.opportunities > 0 || 
      company._count.projects > 0;

    if (hasRelatedRecords) {
      // Soft delete
      await prisma.company.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        }
      });
    } else {
      // Hard delete if no related records
      await prisma.company.delete({
        where: { id }
      });
    }

    // Invalidate caches
    await cache.invalidateRelated('company', id);
    await cache.clearPattern('query:Company:*');
  }

  // Branch CRUD with optimization
  async createBranch(input: CreateBranchInput, userId: string) {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: input.companyId }
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Check if branch code already exists
    const existingBranch = await prisma.branch.findUnique({
      where: { code: input.code }
    });

    if (existingBranch) {
      throw new ConflictError('Branch code already exists');
    }

    const branch = await prisma.branch.create({
      data: {
        ...input,
        createdBy: userId,
        updatedBy: userId,
      },
      include: QueryOptimizer.optimizeIncludes({
        company: true,
      })
    });

    // Invalidate company cache
    await cache.invalidateRelated('company', input.companyId);

    return branch;
  }

  async getBranches(companyId: string) {
    const cacheKey = `company:${companyId}:branches`;
    
    // Try cache first
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const branches = await prisma.branch.findMany({
      where: QueryOptimizer.buildWhereClause({ companyId }),
      orderBy: { name: 'asc' },
    });

    // Cache the result
    await cache.set(cacheKey, branches, CacheTTL.MEDIUM);

    return branches;
  }

  async getBranchById(id: string) {
    const cacheKey = `branch:${id}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: QueryOptimizer.optimizeIncludes({
        company: true,
      })
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // Cache the result
    await cache.set(cacheKey, branch, CacheTTL.LONG);

    return branch;
  }

  async updateBranch(id: string, input: UpdateBranchInput, userId: string) {
    const existing = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Branch not found');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.branch.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('Branch code already exists');
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: QueryOptimizer.optimizeIncludes({
        company: true,
      })
    });

    // Invalidate caches
    await cache.delete([`branch:${id}`, `company:${existing.companyId}:branches`]);
    await cache.invalidateRelated('company', existing.companyId);

    return branch;
  }

  async deleteBranch(id: string, userId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // Soft delete
    await prisma.branch.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });

    // Invalidate caches
    await cache.delete([`branch:${id}`, `company:${branch.companyId}:branches`]);
    await cache.invalidateRelated('company', branch.companyId);
  }

  // Contact CRUD with optimization
  async createContact(input: CreateContactInput, userId: string) {
    // Convert birthday string to Date if needed
    if (input.birthday && typeof input.birthday === 'string') {
      input.birthday = new Date(input.birthday);
    }

    const contact = await prisma.contact.create({
      data: {
        ...input,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      include: QueryOptimizer.optimizeIncludes({
        branch: {
          include: {
            company: true,
          }
        }
      })
    });

    // Invalidate related caches
    if (input.branchId) {
      await cache.delete(`branch:${input.branchId}:contacts`);
    }

    return contact;
  }

  async getContacts(filter: { branchId?: string; search?: string }, page: number = 1, limit: number = 20) {
    const where: any = {
      deletedAt: null,
    };

    if (filter.branchId) {
      where.branchId = filter.branchId;
    }

    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const paginationParams = QueryOptimizer.getPaginationParams({ page, limit });

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        ...paginationParams,
        include: QueryOptimizer.optimizeIncludes({
          branch: {
            include: {
              company: true,
            }
          }
        }),
        orderBy: [
          { isPrimary: 'desc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
      }),
      prisma.contact.count({ where }),
    ]);

    const result: PaginatedResult<any> = {
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };

    // Cache the result
    await cache.setQueryCache('Contact', { filter, page, limit }, result, CacheTTL.SHORT);

    return result;
  }

  async getContactById(id: string) {
    const cacheKey = `contact:${id}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: QueryOptimizer.optimizeIncludes({
        branch: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        }
      })
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Cache the result
    await cache.set(cacheKey, contact, CacheTTL.MEDIUM);

    return contact;
  }

  async updateContact(id: string, input: UpdateContactInput, userId: string) {
    const existing = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Contact not found');
    }

    // Convert birthday string to Date if needed
    if (input.birthday && typeof input.birthday === 'string') {
      input.birthday = new Date(input.birthday);
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: QueryOptimizer.optimizeIncludes({
        branch: {
          include: {
            company: true,
          }
        }
      })
    });

    // Invalidate caches
    await cache.delete(`contact:${id}`);
    await cache.clearPattern('query:Contact:*');
    if (existing.branchId) {
      await cache.delete(`branch:${existing.branchId}:contacts`);
    }

    return contact;
  }

  async deleteContact(id: string, userId: string) {
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Soft delete
    await prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });

    // Invalidate caches
    await cache.delete(`contact:${id}`);
    await cache.clearPattern('query:Contact:*');
    if (contact.branchId) {
      await cache.delete(`branch:${contact.branchId}:contacts`);
    }
  }

  // Bulk operations with optimization
  async bulkCreateCompanies(companies: CreateCompanyInput[], userId: string) {
    const results = await QueryOptimizer.batchOperation(
      companies,
      async (batch) => {
        return prisma.$transaction(
          batch.map(company => 
            prisma.company.create({
              data: {
                ...company,
                createdBy: userId,
                updatedBy: userId,
              }
            })
          )
        );
      },
      50 // Process in batches of 50
    );

    // Clear all company caches
    await cache.clearPattern('company:*');
    await cache.clearPattern('query:Company:*');

    return results.flat();
  }

  // Export companies with streaming for large datasets
  async *exportCompanies(filter: CompanyFilter) {
    const where = QueryOptimizer.buildWhereClause({
      search: filter.search,
      industryId: filter.industryId,
      companySize: filter.companySize,
      tier: filter.tier,
      status: filter.status,
      accountManagerId: filter.accountManagerId,
    });

    yield* QueryOptimizer.streamLargeDataset(
      prisma.company,
      where,
      1000 // Stream in batches of 1000
    );
  }

  // Get company statistics
  async getCompanyStats() {
    const cacheKey = 'stats:company:overview';
    
    // Try cache first
    const cached = await cache.getStats(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await prisma.$transaction([
      prisma.company.count(),
      prisma.company.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.company.groupBy({
        by: ['tier'],
        _count: true,
      }),
      prisma.company.groupBy({
        by: ['companySize'],
        _count: true,
      }),
      prisma.company.aggregate({
        _sum: {
          annualRevenue: true,
          employeeCount: true,
        },
        _avg: {
          annualRevenue: true,
          employeeCount: true,
        },
      }),
    ]);

    const result = {
      total: stats[0],
      active: stats[1],
      byTier: stats[2],
      bySize: stats[3],
      aggregates: stats[4],
    };

    // Cache for 1 hour
    await cache.setStats(cacheKey, result, CacheTTL.LONG);

    return result;
  }
}

export const companyService = new CompanyService();