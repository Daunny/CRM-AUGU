import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Customer360Service } from '../customer360.service';
import prisma from '../../config/database';

// Mock Prisma client
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    company: {
      findUnique: jest.fn(),
    },
    branch: {
      findMany: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
    },
    opportunity: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    note: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(prisma)),
  },
}));

describe('Customer360Service', () => {
  let service: Customer360Service;

  beforeEach(() => {
    service = new Customer360Service();
    jest.clearAllMocks();
  });

  describe('getCustomer360View', () => {
    it('should return complete customer 360 view', async () => {
      const mockCompanyId = 'test-company-id';
      const mockCompany = {
        id: mockCompanyId,
        name: 'Test Company',
        code: 'TEST001',
        businessNumber: '123-45-67890',
        representative: 'John Doe',
        industry: {
          id: 'industry-1',
          name: 'Technology',
          code: 'TECH',
        },
        companySize: 'LARGE',
        annualRevenue: 1000000000,
        employeeCount: 500,
        tier: 'GOLD',
        status: 'ACTIVE',
        accountManagerId: 'manager-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      const mockBranches = [
        {
          id: 'branch-1',
          name: 'Main Branch',
          branchType: 'HEADQUARTERS',
          addressCity: 'Seoul',
          isPrimary: true,
        },
      ];

      const mockContacts = [
        {
          id: 'contact-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          isPrimary: true,
          roleType: 'DECISION_MAKER',
        },
      ];

      const mockOpportunities = [
        {
          id: 'opp-1',
          title: 'Big Deal',
          stage: 'QUALIFICATION',
          amount: 500000,
          probability: 30,
        },
      ];

      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Implementation Project',
          status: 'IN_PROGRESS',
          progress: 45,
        },
      ];

      const mockActivities = [
        {
          id: 'activity-1',
          subject: 'Client Meeting',
          startTime: new Date('2024-01-10'),
          activityType: 'MEETING',
        },
      ];

      // Setup mocks
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.branch.findMany as jest.Mock).mockResolvedValue(mockBranches);
      (prisma.contact.findMany as jest.Mock).mockResolvedValue(mockContacts);
      (prisma.opportunity.findMany as jest.Mock).mockResolvedValue(mockOpportunities);
      (prisma.opportunity.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 500000 },
        _count: 1,
      });
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
      (prisma.activity.findMany as jest.Mock).mockResolvedValue(mockActivities);

      const result = await service.getCustomer360View(mockCompanyId);

      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('branches');
      expect(result).toHaveProperty('contacts');
      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('recentActivities');
      expect(result).toHaveProperty('metrics');

      expect(result.company).toEqual(mockCompany);
      expect(result.branches).toEqual(mockBranches);
      expect(result.contacts).toEqual(mockContacts);
      expect(result.metrics.totalOpportunityValue).toBe(500000);
      expect(result.metrics.activeOpportunities).toBe(1);
    });

    it('should throw error when company not found', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getCustomer360View('invalid-id')).rejects.toThrow(
        'Company not found'
      );
    });
  });

  describe('getInteractionHistory', () => {
    it('should return sorted interaction history', async () => {
      const mockCompanyId = 'test-company-id';
      const mockActivities = [
        {
          id: 'activity-1',
          subject: 'Meeting 1',
          description: 'First meeting',
          startTime: new Date('2024-01-10'),
          activityType: 'MEETING',
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Manager',
          },
        },
        {
          id: 'activity-2',
          subject: 'Call',
          description: 'Phone call',
          startTime: new Date('2024-01-15'),
          activityType: 'CALL',
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Manager',
          },
        },
      ];

      const mockNotes = [
        {
          id: 'note-1',
          content: 'Important note',
          createdAt: new Date('2024-01-12'),
          createdByUser: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Sales',
          },
        },
      ];

      (prisma.activity.findMany as jest.Mock).mockResolvedValue(mockActivities);
      (prisma.note.findMany as jest.Mock).mockResolvedValue(mockNotes);

      const result = await service.getInteractionHistory(mockCompanyId, { limit: 10 });

      expect(result).toHaveLength(3);
      // Should be sorted by date descending
      expect(result[0].date).toEqual(new Date('2024-01-15'));
      expect(result[1].date).toEqual(new Date('2024-01-12'));
      expect(result[2].date).toEqual(new Date('2024-01-10'));
    });

    it('should respect limit parameter', async () => {
      const mockActivities = Array(10).fill(null).map((_, i) => ({
        id: `activity-${i}`,
        subject: `Activity ${i}`,
        startTime: new Date(`2024-01-${10 + i}`),
        activityType: 'MEETING',
      }));

      (prisma.activity.findMany as jest.Mock).mockResolvedValue(mockActivities.slice(0, 5));
      (prisma.note.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getInteractionHistory('company-id', { limit: 5 });

      expect(result).toHaveLength(5);
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should calculate revenue analytics correctly', async () => {
      const mockOpportunities = [
        {
          id: 'opp-1',
          stage: 'CLOSED_WON',
          amount: 100000,
          actualCloseDate: new Date('2024-01-15'),
        },
        {
          id: 'opp-2',
          stage: 'CLOSED_WON',
          amount: 200000,
          actualCloseDate: new Date('2024-02-15'),
        },
        {
          id: 'opp-3',
          stage: 'NEGOTIATION',
          amount: 150000,
          expectedCloseDate: new Date('2024-03-15'),
          probability: 70,
        },
        {
          id: 'opp-4',
          stage: 'CLOSED_LOST',
          amount: 50000,
        },
      ];

      (prisma.opportunity.findMany as jest.Mock).mockResolvedValue(mockOpportunities);

      const result = await service.getRevenueAnalytics('company-id');

      expect(result.totalRevenue).toBe(300000); // Sum of CLOSED_WON
      expect(result.pipelineValue).toBe(150000); // Sum of open opportunities
      expect(result.weightedPipeline).toBe(105000); // 150000 * 0.7
      expect(result.averageDealSize).toBe(150000); // (100000 + 200000) / 2
      expect(result.winRate).toBe(50); // 2 won / (2 won + 2 lost) * 100
    });

    it('should handle empty opportunities', async () => {
      (prisma.opportunity.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getRevenueAnalytics('company-id');

      expect(result.totalRevenue).toBe(0);
      expect(result.pipelineValue).toBe(0);
      expect(result.weightedPipeline).toBe(0);
      expect(result.averageDealSize).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.opportunities).toEqual([]);
    });
  });

  describe('getRiskAssessment', () => {
    it('should assess low risk for active customer', async () => {
      const mockCompany = {
        id: 'company-id',
        lastHealthCheck: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        healthScore: 85,
        churnRisk: 0.1,
      };

      const mockRecentActivities = Array(5).fill(null).map((_, i) => ({
        id: `activity-${i}`,
        startTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      }));

      const mockOpenOpportunities = [
        { id: 'opp-1', stage: 'QUALIFICATION' },
        { id: 'opp-2', stage: 'PROPOSAL' },
      ];

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.activity.findMany as jest.Mock).mockResolvedValue(mockRecentActivities);
      (prisma.opportunity.findMany as jest.Mock).mockResolvedValue(mockOpenOpportunities);

      const result = await service.getRiskAssessment('company-id');

      expect(result.overallRisk).toBe('LOW');
      expect(result.riskFactors).toContain('Recent engagement: 5 activities in last 30 days');
      expect(result.riskFactors).toContain('Active opportunities in pipeline');
      expect(result.recommendations).toContain('Continue regular engagement');
    });

    it('should assess high risk for inactive customer', async () => {
      const mockCompany = {
        id: 'company-id',
        lastHealthCheck: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        healthScore: 35,
        churnRisk: 0.8,
      };

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.opportunity.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getRiskAssessment('company-id');

      expect(result.overallRisk).toBe('HIGH');
      expect(result.riskFactors).toContain('No recent activities');
      expect(result.riskFactors).toContain('No active opportunities');
      expect(result.recommendations).toContain('Schedule urgent executive meeting');
      expect(result.recommendations).toContain('Conduct satisfaction survey');
    });

    it('should throw error when company not found', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getRiskAssessment('invalid-id')).rejects.toThrow(
        'Company not found'
      );
    });
  });

  describe('getEngagementTimeline', () => {
    it('should return engagement timeline grouped by month', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          subject: 'January Meeting',
          startTime: new Date('2024-01-15'),
          activityType: 'MEETING',
        },
        {
          id: 'activity-2',
          subject: 'January Call',
          startTime: new Date('2024-01-20'),
          activityType: 'CALL',
        },
        {
          id: 'activity-3',
          subject: 'February Meeting',
          startTime: new Date('2024-02-10'),
          activityType: 'MEETING',
        },
      ];

      (prisma.activity.findMany as jest.Mock).mockResolvedValue(mockActivities);

      const result = await service.getEngagementTimeline('company-id', 90);

      expect(result).toHaveLength(2); // Two months
      expect(result[0].month).toBe('2024-02');
      expect(result[0].activities).toHaveLength(1);
      expect(result[1].month).toBe('2024-01');
      expect(result[1].activities).toHaveLength(2);
    });

    it('should handle empty activities', async () => {
      (prisma.activity.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getEngagementTimeline('company-id', 30);

      expect(result).toEqual([]);
    });
  });
});