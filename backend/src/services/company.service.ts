import { Prisma, CompanySize, CustomerTier, CustomerStatus, BranchType } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

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
  addressZip?: string;
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
  // Company CRUD
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
      include: {
        industry: true,
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
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
      }
    });

    return company;
  }

  async getCompanies(filter: CompanyFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.CompanyWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { businessNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.industryId) {
      where.industryId = filter.industryId;
    }

    if (filter.companySize) {
      where.companySize = filter.companySize;
    }

    if (filter.tier) {
      where.tier = filter.tier;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.accountManagerId) {
      where.accountManagerId = filter.accountManagerId;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          industry: true,
          accountManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
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
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCompanyById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        industry: true,
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        branches: {
          orderBy: { name: 'asc' },
        },
        opportunities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        projects: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            projectManager: {
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
            branches: true,
            opportunities: true,
            projects: true,
            activities: true,
            meetings: true,
          }
        }
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

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
      include: {
        industry: true,
        accountManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
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
      }
    });

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
  }

  // Branch CRUD
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
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

    return branch;
  }

  async getBranches(companyId: string) {
    const branches = await prisma.branch.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return branches;
  }

  async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
      }
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

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
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

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
  }

  // Contact CRUD
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
      include: {
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
        }
      }
    });

    return contact;
  }

  async getContacts(filter: { branchId?: string; search?: string }, page: number = 1, limit: number = 20) {
    const where: Prisma.ContactWhereInput = {
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

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
          }
        },
        orderBy: [
          { isPrimary: 'desc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContactById(id: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
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
      }
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

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
      include: {
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
      }
    });

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
  }
}

export const companyService = new CompanyService();