import { companyAnalyticsService } from '../../src/services/company-analytics.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

describe('CompanyAnalyticsService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('calculateHealthScore', () => {
    it('should calculate health score correctly with all data', async () => {
      const mockCompany = {
        id: 'company-1',
        name: 'Test Company',
        opportunities: [
          { amount: 500000, stage: 'CLOSED_WON' },
          { amount: 300000, stage: 'NEGOTIATION' },
        ],
        projects: [
          { status: 'COMPLETED' },
          { status: 'IN_PROGRESS' },
          { status: 'COMPLETED' },
        ],
        meetings: [
          { startTime: new Date() },
          { startTime: new Date() },
          { startTime: new Date() },
          { startTime: new Date() },
          { startTime: new Date() },
        ],
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, healthScore: 66 });

      const score = await companyAnalyticsService.calculateHealthScore('company-1');

      expect(score).toBe(66);
      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        include: {
          opportunities: { where: { deletedAt: null } },
          projects: { where: { deletedAt: null } },
          meetings: expect.any(Object),
        },
      });
      expect(prisma.company.update).toHaveBeenCalled();
    });

    it('should throw error when company not found', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        companyAnalyticsService.calculateHealthScore('non-existent')
      ).rejects.toThrow('Company not found');
    });

    it('should handle companies with no data', async () => {
      const mockCompany = {
        id: 'company-2',
        name: 'Empty Company',
        opportunities: [],
        projects: [],
        meetings: [],
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, healthScore: 18 });

      const score = await companyAnalyticsService.calculateHealthScore('company-2');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('autoSegmentCompany', () => {
    it('should segment as ENTERPRISE for high revenue', async () => {
      const mockCompany = {
        id: 'company-1',
        opportunities: [
          { amount: 3000000 },
          { amount: 2500000 },
        ],
        projects: [],
        size: 500,
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, segment: 'ENTERPRISE' });

      const segment = await companyAnalyticsService.autoSegmentCompany('company-1');

      expect(segment).toBe('ENTERPRISE');
      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: { segment: 'ENTERPRISE' },
      });
    });

    it('should segment as KEY_ACCOUNT for medium revenue', async () => {
      const mockCompany = {
        id: 'company-2',
        opportunities: [
          { amount: 700000 },
          { amount: 500000 },
        ],
        projects: [],
        size: 200,
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, segment: 'KEY_ACCOUNT' });

      const segment = await companyAnalyticsService.autoSegmentCompany('company-2');

      expect(segment).toBe('KEY_ACCOUNT');
    });

    it('should segment as STARTER for low revenue', async () => {
      const mockCompany = {
        id: 'company-3',
        opportunities: [
          { amount: 50000 },
        ],
        projects: [],
        size: 10,
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, segment: 'STARTER' });

      const segment = await companyAnalyticsService.autoSegmentCompany('company-3');

      expect(segment).toBe('STARTER');
    });
  });

  describe('calculateChurnRisk', () => {
    it('should calculate high churn risk for inactive companies', async () => {
      const mockCompany = {
        id: 'company-1',
        meetings: [], // No recent meetings
        opportunities: [], // No active opportunities
        projects: [], // No active projects
        healthScore: 20, // Low health score
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ 
        ...mockCompany, 
        churnRisk: 1.0,
        riskLevel: 'HIGH',
      });

      const risk = await companyAnalyticsService.calculateChurnRisk('company-1');

      expect(risk).toBe(1.0);
      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: {
          churnRisk: 1.0,
          riskLevel: 'HIGH',
        },
      });
    });

    it('should calculate low churn risk for active companies', async () => {
      const mockCompany = {
        id: 'company-2',
        meetings: [
          { startTime: new Date() }, // Recent meeting
        ],
        opportunities: [
          { stage: 'NEGOTIATION' }, // Active opportunity
        ],
        projects: [
          { status: 'IN_PROGRESS' }, // Active project
        ],
        healthScore: 80, // High health score
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ 
        ...mockCompany, 
        churnRisk: 0,
        riskLevel: 'LOW',
      });

      const risk = await companyAnalyticsService.calculateChurnRisk('company-2');

      expect(risk).toBe(0);
      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-2' },
        data: {
          churnRisk: 0,
          riskLevel: 'LOW',
        },
      });
    });
  });

  describe('calculateLifetimeValue', () => {
    it('should calculate LTV based on historical revenue', async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const mockCompany = {
        id: 'company-1',
        createdAt: oneYearAgo,
        opportunities: [
          { amount: 500000, stage: 'CLOSED_WON' },
          { amount: 300000, stage: 'CLOSED_WON' },
        ],
        churnRisk: 0.2,
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ 
        ...mockCompany, 
        lifetimeValue: 3200000,
      });

      const ltv = await companyAnalyticsService.calculateLifetimeValue('company-1');

      expect(ltv).toBeGreaterThan(0);
      expect(prisma.company.update).toHaveBeenCalled();
    });

    it('should handle companies with no revenue', async () => {
      const mockCompany = {
        id: 'company-2',
        createdAt: new Date(),
        opportunities: [],
        churnRisk: 0.5,
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ 
        ...mockCompany, 
        lifetimeValue: 0,
      });

      const ltv = await companyAnalyticsService.calculateLifetimeValue('company-2');

      expect(ltv).toBe(0);
    });
  });

  describe('batchUpdateAnalytics', () => {
    it('should update analytics for specified companies', async () => {
      const mockCompanies = [
        { id: 'company-1' },
        { id: 'company-2' },
      ];

      prisma.company.findMany.mockResolvedValue(mockCompanies);
      prisma.company.findUnique.mockResolvedValue({
        id: 'company-1',
        opportunities: [],
        projects: [],
        meetings: [],
      });
      prisma.company.update.mockResolvedValue({});

      await companyAnalyticsService.batchUpdateAnalytics(['company-1', 'company-2']);

      expect(prisma.company.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['company-1', 'company-2'] },
          deletedAt: null,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const mockCompanies = [
        { id: 'company-1' },
      ];

      prisma.company.findMany.mockResolvedValue(mockCompanies);
      prisma.company.findUnique.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        companyAnalyticsService.batchUpdateAnalytics(['company-1'])
      ).resolves.not.toThrow();
    });
  });

  describe('getCompanyAnalytics', () => {
    it('should return cached analytics if recent', async () => {
      const mockCompany = {
        id: 'company-1',
        name: 'Test Company',
        segment: 'ENTERPRISE',
        healthScore: 85,
        churnRisk: 0.15,
        riskLevel: 'LOW',
        lifetimeValue: 5000000,
        engagementScore: 90,
        satisfactionScore: 80,
        lastHealthCheck: new Date(), // Recent check
      };

      prisma.company.findUnique.mockResolvedValue(mockCompany);

      const analytics = await companyAnalyticsService.getCompanyAnalytics('company-1');

      expect(analytics).toEqual(mockCompany);
      expect(prisma.company.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should refresh analytics if stale', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockCompany = {
        id: 'company-1',
        name: 'Test Company',
        lastHealthCheck: twoDaysAgo, // Stale check
        opportunities: [],
        projects: [],
        meetings: [],
      };

      prisma.company.findUnique
        .mockResolvedValueOnce(mockCompany)
        .mockResolvedValueOnce({ ...mockCompany, healthScore: 75 });
      prisma.company.update.mockResolvedValue({});

      const analytics = await companyAnalyticsService.getCompanyAnalytics('company-1');

      expect(prisma.company.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.company.update).toHaveBeenCalled();
    });

    it('should throw error when company not found', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        companyAnalyticsService.getCompanyAnalytics('non-existent')
      ).rejects.toThrow('Company not found');
    });
  });
});