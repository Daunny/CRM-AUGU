import { companyService } from '../../../src/services/company.service';
import { prismaMock } from '../../setup';
import { CompanySize, CustomerTier, CustomerStatus, BranchType } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../../src/utils/errors';
import { faker } from '@faker-js/faker';

describe('CompanyService', () => {
  const userId = faker.string.uuid();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    it('should successfully create a new company', async () => {
      const input = {
        code: 'COMP001',
        name: 'Test Company',
        businessNumber: '123-45-67890',
        representative: 'John Doe',
        companySize: CompanySize.MEDIUM,
        tier: CustomerTier.GOLD,
        status: CustomerStatus.ACTIVE,
      };

      const mockCompany = {
        id: faker.string.uuid(),
        ...input,
        annualRevenue: null,
        employeeCount: null,
        fiscalYearEnd: null,
        website: null,
        description: null,
        creditLimit: null,
        paymentTerms: null,
        tags: [],
        customFields: null,
        accountManagerId: null,
        industryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        deletedAt: null,
        deletedBy: null,
        industry: null,
        accountManager: null,
        branches: [],
        _count: {
          branches: 0,
          opportunities: 0,
          projects: 0,
        },
      };

      prismaMock.company.findUnique.mockResolvedValueOnce(null); // Check code
      prismaMock.company.findUnique.mockResolvedValueOnce(null); // Check business number
      prismaMock.company.create.mockResolvedValue(mockCompany);

      const result = await companyService.createCompany(input, userId);

      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { code: input.code },
      });
      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { businessNumber: input.businessNumber },
      });
      expect(prismaMock.company.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...input,
          createdBy: userId,
          updatedBy: userId,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCompany);
    });

    it('should throw ConflictError if company code already exists', async () => {
      const input = {
        code: 'EXISTING',
        name: 'Test Company',
      };

      prismaMock.company.findUnique.mockResolvedValueOnce({
        id: faker.string.uuid(),
        code: input.code,
      } as any);

      await expect(companyService.createCompany(input, userId)).rejects.toThrow(ConflictError);
      await expect(companyService.createCompany(input, userId)).rejects.toThrow('Company code already exists');
    });

    it('should throw ConflictError if business number already exists', async () => {
      const input = {
        code: 'COMP002',
        name: 'Test Company',
        businessNumber: '123-45-67890',
      };

      prismaMock.company.findUnique.mockResolvedValueOnce(null); // Code check passes
      prismaMock.company.findUnique.mockResolvedValueOnce({
        id: faker.string.uuid(),
        businessNumber: input.businessNumber,
      } as any);

      await expect(companyService.createCompany(input, userId)).rejects.toThrow(ConflictError);
      await expect(companyService.createCompany(input, userId)).rejects.toThrow('Business number already exists');
    });
  });

  describe('getCompanies', () => {
    it('should return paginated list of companies', async () => {
      const mockCompanies = [
        {
          id: faker.string.uuid(),
          code: 'COMP001',
          name: 'Company A',
          businessNumber: '123-45-67890',
        },
        {
          id: faker.string.uuid(),
          code: 'COMP002',
          name: 'Company B',
          businessNumber: '098-76-54321',
        },
      ];

      prismaMock.company.findMany.mockResolvedValue(mockCompanies as any);
      prismaMock.company.count.mockResolvedValue(2);

      const result = await companyService.getCompanies({}, 1, 20);

      expect(prismaMock.company.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
      expect(prismaMock.company.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: mockCompanies,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should filter companies by search term', async () => {
      const filter = { search: 'test' };
      
      prismaMock.company.findMany.mockResolvedValue([]);
      prismaMock.company.count.mockResolvedValue(0);

      await companyService.getCompanies(filter, 1, 20);

      expect(prismaMock.company.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { code: { contains: 'test', mode: 'insensitive' } },
            { businessNumber: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should filter companies by multiple criteria', async () => {
      const filter = {
        companySize: CompanySize.LARGE,
        tier: CustomerTier.PLATINUM,
        status: CustomerStatus.ACTIVE,
        industryId: 'industry-123',
        accountManagerId: 'manager-123',
      };

      prismaMock.company.findMany.mockResolvedValue([]);
      prismaMock.company.count.mockResolvedValue(0);

      await companyService.getCompanies(filter, 2, 10);

      expect(prismaMock.company.findMany).toHaveBeenCalledWith({
        where: {
          companySize: CompanySize.LARGE,
          tier: CustomerTier.PLATINUM,
          status: CustomerStatus.ACTIVE,
          industryId: 'industry-123',
          accountManagerId: 'manager-123',
        },
        skip: 10,
        take: 10,
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getCompanyById', () => {
    it('should return company with all relations', async () => {
      const companyId = faker.string.uuid();
      const mockCompany = {
        id: companyId,
        code: 'COMP001',
        name: 'Test Company',
        businessNumber: '123-45-67890',
        industry: { id: 'ind-1', name: 'Technology' },
        accountManager: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        branches: [],
        opportunities: [],
        projects: [],
        _count: {
          branches: 0,
          opportunities: 0,
          projects: 0,
          activities: 0,
          meetings: 0,
        },
      };

      prismaMock.company.findUnique.mockResolvedValue(mockCompany as any);

      const result = await companyService.getCompanyById(companyId);

      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { id: companyId },
        include: expect.objectContaining({
          industry: true,
          accountManager: expect.any(Object),
          branches: expect.any(Object),
          opportunities: expect.any(Object),
          projects: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundError if company does not exist', async () => {
      const companyId = faker.string.uuid();
      
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(companyService.getCompanyById(companyId)).rejects.toThrow(NotFoundError);
      await expect(companyService.getCompanyById(companyId)).rejects.toThrow('Company not found');
    });
  });

  describe('updateCompany', () => {
    const companyId = faker.string.uuid();
    const existingCompany = {
      id: companyId,
      code: 'COMP001',
      name: 'Original Company',
      businessNumber: '123-45-67890',
    };

    it('should successfully update company', async () => {
      const input = {
        name: 'Updated Company',
        companySize: CompanySize.LARGE,
      };

      const updatedCompany = {
        ...existingCompany,
        ...input,
      };

      prismaMock.company.findUnique.mockResolvedValueOnce(existingCompany as any);
      prismaMock.company.update.mockResolvedValue(updatedCompany as any);

      const result = await companyService.updateCompany(companyId, input, userId);

      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: companyId },
        data: expect.objectContaining({
          ...input,
          updatedBy: userId,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedCompany);
    });

    it('should throw NotFoundError if company does not exist', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(
        companyService.updateCompany(companyId, { name: 'New Name' }, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if new code already exists', async () => {
      const input = { code: 'EXISTING' };

      prismaMock.company.findUnique.mockResolvedValueOnce(existingCompany as any);
      prismaMock.company.findUnique.mockResolvedValueOnce({
        id: 'other-company',
        code: input.code,
      } as any);

      await expect(
        companyService.updateCompany(companyId, input, userId)
      ).rejects.toThrow(ConflictError);
      await expect(
        companyService.updateCompany(companyId, input, userId)
      ).rejects.toThrow('Company code already exists');
    });
  });

  describe('deleteCompany', () => {
    const companyId = faker.string.uuid();

    it('should soft delete company with related records', async () => {
      const mockCompany = {
        id: companyId,
        _count: {
          branches: 2,
          opportunities: 5,
          projects: 3,
        },
      };

      prismaMock.company.findUnique.mockResolvedValue(mockCompany as any);
      prismaMock.company.update.mockResolvedValue({ ...mockCompany, deletedAt: new Date() } as any);

      await companyService.deleteCompany(companyId, userId);

      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: companyId },
        data: {
          deletedAt: expect.any(Date),
          deletedBy: userId,
        },
      });
    });

    it('should hard delete company without related records', async () => {
      const mockCompany = {
        id: companyId,
        _count: {
          branches: 0,
          opportunities: 0,
          projects: 0,
        },
      };

      prismaMock.company.findUnique.mockResolvedValue(mockCompany as any);
      prismaMock.company.delete.mockResolvedValue(mockCompany as any);

      await companyService.deleteCompany(companyId, userId);

      expect(prismaMock.company.delete).toHaveBeenCalledWith({
        where: { id: companyId },
      });
    });

    it('should throw NotFoundError if company does not exist', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(companyService.deleteCompany(companyId, userId)).rejects.toThrow(NotFoundError);
      await expect(companyService.deleteCompany(companyId, userId)).rejects.toThrow('Company not found');
    });
  });

  describe('Branch operations', () => {
    describe('createBranch', () => {
      it('should successfully create a branch', async () => {
        const companyId = faker.string.uuid();
        const input = {
          companyId,
          code: 'BR001',
          name: 'Main Branch',
          branchType: BranchType.HEADQUARTER,
          addressStreet: '123 Main St',
          addressCity: 'Seoul',
        };

        const mockBranch = {
          id: faker.string.uuid(),
          ...input,
          company: { id: companyId, name: 'Test Company', code: 'COMP001' },
        };

        prismaMock.company.findUnique.mockResolvedValue({ id: companyId } as any);
        prismaMock.branch.findUnique.mockResolvedValue(null);
        prismaMock.branch.create.mockResolvedValue(mockBranch as any);

        const result = await companyService.createBranch(input, userId);

        expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
          where: { id: companyId },
        });
        expect(prismaMock.branch.findUnique).toHaveBeenCalledWith({
          where: { code: input.code },
        });
        expect(prismaMock.branch.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ...input,
            createdBy: userId,
            updatedBy: userId,
          }),
          include: expect.any(Object),
        });
        expect(result).toEqual(mockBranch);
      });

      it('should throw NotFoundError if company does not exist', async () => {
        const input = {
          companyId: 'non-existent',
          code: 'BR001',
          name: 'Branch',
        };

        prismaMock.company.findUnique.mockResolvedValue(null);

        await expect(companyService.createBranch(input, userId)).rejects.toThrow(NotFoundError);
        await expect(companyService.createBranch(input, userId)).rejects.toThrow('Company not found');
      });

      it('should throw ConflictError if branch code already exists', async () => {
        const input = {
          companyId: faker.string.uuid(),
          code: 'EXISTING',
          name: 'Branch',
        };

        prismaMock.company.findUnique.mockResolvedValue({ id: input.companyId } as any);
        prismaMock.branch.findUnique.mockResolvedValue({ id: 'existing-branch' } as any);

        await expect(companyService.createBranch(input, userId)).rejects.toThrow(ConflictError);
        await expect(companyService.createBranch(input, userId)).rejects.toThrow('Branch code already exists');
      });
    });
  });

  describe('Contact operations', () => {
    describe('createContact', () => {
      it('should successfully create a contact', async () => {
        const input = {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '010-9876-5432',
          isPrimary: true,
          branchId: faker.string.uuid(),
        };

        const mockContact = {
          id: faker.string.uuid(),
          ...input,
          isActive: true,
          branch: {
            id: input.branchId,
            name: 'Main Branch',
            company: { id: 'comp-1', name: 'Test Company' },
          },
          user: null,
        };

        prismaMock.contact.create.mockResolvedValue(mockContact as any);

        const result = await companyService.createContact(input, userId);

        expect(prismaMock.contact.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ...input,
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
          }),
          include: expect.any(Object),
        });
        expect(result).toEqual(mockContact);
      });

      it('should convert birthDate string to Date object', async () => {
        const input = {
          firstName: 'John',
          lastName: 'Doe',
          birthDate: '1990-01-15',
        };

        prismaMock.contact.create.mockResolvedValue({ id: 'contact-1' } as any);

        await companyService.createContact(input, userId);

        expect(prismaMock.contact.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            birthDate: new Date('1990-01-15'),
          }),
          include: expect.any(Object),
        });
      });
    });
  });
});