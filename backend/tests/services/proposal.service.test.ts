import { proposalService } from '../../src/services/proposal.service';
import { prisma } from '../../src/config/database';
import { ProposalStatus, OpportunityStage } from '@prisma/client';
import { AppError } from '../../src/utils/errors';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    proposal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    proposalItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    proposalVersion: {
      create: jest.fn(),
    },
    proposalApproval: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    proposalTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    opportunity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('ProposalService', () => {
  const mockUserId = 'user-123';
  const mockOpportunityId = 'opp-456';
  const mockProposalId = 'prop-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProposal', () => {
    it('should create a new proposal successfully', async () => {
      const mockOpportunity = {
        id: mockOpportunityId,
        title: 'Test Opportunity',
      };

      const mockProposalData = {
        opportunityId: mockOpportunityId,
        title: 'Test Proposal',
        validUntil: new Date('2024-12-31'),
        items: [
          {
            productId: 'prod-1',
            itemType: 'PRODUCT',
            name: 'Training Service',
            quantity: 10,
            unitPrice: 100000,
            discountPercent: 10,
          },
        ],
      };

      const mockCreatedProposal = {
        id: mockProposalId,
        code: 'PROP-202401-0001',
        ...mockProposalData,
        status: ProposalStatus.DRAFT,
        version: 1,
        subtotal: 1000000,
        discountAmount: 0,
        tax: 0,
        totalAmount: 900000,
        items: mockProposalData.items,
        opportunity: mockOpportunity,
      };

      (prisma.opportunity.findUnique as any).mockResolvedValue(mockOpportunity);
      (prisma.proposal.findFirst as any).mockResolvedValue(null);
      (prisma.proposal.create as any).mockResolvedValue(mockCreatedProposal);
      (prisma.proposalVersion.create as any).mockResolvedValue({});

      const result = await proposalService.createProposal(mockProposalData, mockUserId);

      expect(result).toEqual(mockCreatedProposal);
      expect(prisma.opportunity.findUnique).toHaveBeenCalledWith({
        where: { id: mockOpportunityId },
      });
      expect(prisma.proposal.create).toHaveBeenCalled();
    });

    it('should throw error if opportunity not found', async () => {
      (prisma.opportunity.findUnique as any).mockResolvedValue(null);

      const mockProposalData = {
        opportunityId: 'invalid-id',
        title: 'Test Proposal',
        validUntil: new Date(),
        items: [],
      };

      await expect(
        proposalService.createProposal(mockProposalData, mockUserId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProposals', () => {
    it('should get proposals with filters', async () => {
      const mockProposals = [
        {
          id: 'prop-1',
          code: 'PROP-202401-0001',
          title: 'Proposal 1',
          status: ProposalStatus.DRAFT,
        },
        {
          id: 'prop-2',
          code: 'PROP-202401-0002',
          title: 'Proposal 2',
          status: ProposalStatus.APPROVED,
        },
      ];

      (prisma.proposal.findMany as any).mockResolvedValue(mockProposals);
      (prisma.proposal.count as any).mockResolvedValue(2);

      const result = await proposalService.getProposals({ status: ProposalStatus.DRAFT });

      expect(result).toEqual({
        data: mockProposals,
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('submitForApproval', () => {
    it('should submit proposal for approval', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.DRAFT,
        totalAmount: 5000000,
        opportunityId: mockOpportunityId,
      };

      const mockUpdatedProposal = {
        ...mockProposal,
        status: ProposalStatus.PENDING_APPROVAL,
        submittedAt: new Date(),
        submittedBy: mockUserId,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);
      (prisma.proposal.update as any).mockResolvedValue(mockUpdatedProposal);
      (prisma.proposalApproval.create as any).mockResolvedValue({});

      const result = await proposalService.submitForApproval(mockProposalId, mockUserId);

      expect(result.proposal).toEqual(mockUpdatedProposal);
      expect(prisma.proposal.update).toHaveBeenCalledWith({
        where: { id: mockProposalId },
        data: expect.objectContaining({
          status: ProposalStatus.PENDING_APPROVAL,
          submittedBy: mockUserId,
        }),
      });
    });

    it('should throw error if proposal not in draft status', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.APPROVED,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);

      await expect(
        proposalService.submitForApproval(mockProposalId, mockUserId)
      ).rejects.toThrow('Only draft proposals can be submitted');
    });
  });

  describe('approveProposal', () => {
    it('should approve proposal successfully', async () => {
      const mockApproval = {
        id: 'approval-1',
        proposalId: mockProposalId,
        approverId: mockUserId,
        status: 'PENDING',
      };

      (prisma.proposalApproval.findFirst as any).mockResolvedValue(mockApproval);
      (prisma.proposalApproval.update as any).mockResolvedValue({
        ...mockApproval,
        status: 'APPROVED',
        approvedAt: new Date(),
      });
      (prisma.proposalApproval.count as any).mockResolvedValue(0);
      (prisma.proposal.update as any).mockResolvedValue({});

      const result = await proposalService.approveProposal(
        mockProposalId,
        'Looks good',
        mockUserId
      );

      expect(result.message).toBe('Proposal approved successfully');
      expect(prisma.proposalApproval.update).toHaveBeenCalled();
    });
  });

  describe('sendToCustomer', () => {
    it('should send approved proposal to customer', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.APPROVED,
      };

      const mockUpdatedProposal = {
        ...mockProposal,
        status: ProposalStatus.SENT,
        sentToCustomerAt: new Date(),
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);
      (prisma.proposal.update as any).mockResolvedValue(mockUpdatedProposal);

      const result = await proposalService.sendToCustomer(mockProposalId, mockUserId);

      expect(result).toEqual(mockUpdatedProposal);
      expect(prisma.proposal.update).toHaveBeenCalledWith({
        where: { id: mockProposalId },
        data: expect.objectContaining({
          status: ProposalStatus.SENT,
        }),
      });
    });

    it('should throw error if proposal not approved', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.DRAFT,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);

      await expect(
        proposalService.sendToCustomer(mockProposalId, mockUserId)
      ).rejects.toThrow('Only approved proposals can be sent');
    });
  });

  describe('recordCustomerResponse', () => {
    it('should record customer acceptance', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.SENT,
        opportunityId: mockOpportunityId,
      };

      const mockUpdatedProposal = {
        ...mockProposal,
        status: ProposalStatus.ACCEPTED,
        customerSignedAt: new Date(),
        signedBy: 'John Doe',
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);
      (prisma.proposal.update as any).mockResolvedValue(mockUpdatedProposal);
      (prisma.opportunity.update as any).mockResolvedValue({});

      const result = await proposalService.recordCustomerResponse(
        mockProposalId,
        true,
        'John Doe',
        mockUserId
      );

      expect(result).toEqual(mockUpdatedProposal);
      expect(prisma.opportunity.update).toHaveBeenCalledWith({
        where: { id: mockOpportunityId },
        data: {
          stage: 'NEGOTIATION',
          probability: 75,
        },
      });
    });

    it('should record customer rejection', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.SENT,
        opportunityId: mockOpportunityId,
      };

      const mockUpdatedProposal = {
        ...mockProposal,
        status: ProposalStatus.DECLINED,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);
      (prisma.proposal.update as any).mockResolvedValue(mockUpdatedProposal);

      const result = await proposalService.recordCustomerResponse(
        mockProposalId,
        false,
        null,
        mockUserId
      );

      expect(result).toEqual(mockUpdatedProposal);
      expect(prisma.opportunity.update).not.toHaveBeenCalled();
    });
  });

  describe('cloneProposal', () => {
    it('should clone proposal successfully', async () => {
      const mockOriginalProposal = {
        id: 'original-id',
        code: 'PROP-202401-0001',
        title: 'Original Proposal',
        opportunityId: mockOpportunityId,
        items: [
          {
            productId: 'prod-1',
            name: 'Product 1',
            quantity: 1,
            unitPrice: 100000,
          },
        ],
      };

      const mockClonedProposal = {
        id: 'cloned-id',
        code: 'PROP-202401-0002',
        title: 'Original Proposal (Copy)',
        status: ProposalStatus.DRAFT,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockOriginalProposal);
      (prisma.proposal.findFirst as any).mockResolvedValue(null);
      (prisma.proposal.create as any).mockResolvedValue(mockClonedProposal);
      (prisma.proposalVersion.create as any).mockResolvedValue({});

      const result = await proposalService.cloneProposal('original-id', mockUserId);

      expect(result).toEqual(mockClonedProposal);
      expect(prisma.proposal.create).toHaveBeenCalled();
    });
  });

  describe('deleteProposal', () => {
    it('should delete draft proposal', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.DRAFT,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);
      (prisma.proposal.delete as any).mockResolvedValue(mockProposal);

      const result = await proposalService.deleteProposal(mockProposalId, mockUserId);

      expect(result.message).toBe('Proposal deleted successfully');
      expect(prisma.proposal.delete).toHaveBeenCalledWith({
        where: { id: mockProposalId },
      });
    });

    it('should throw error if proposal not draft', async () => {
      const mockProposal = {
        id: mockProposalId,
        status: ProposalStatus.APPROVED,
      };

      (prisma.proposal.findUnique as any).mockResolvedValue(mockProposal);

      await expect(
        proposalService.deleteProposal(mockProposalId, mockUserId)
      ).rejects.toThrow('Only draft proposals can be deleted');
    });
  });
});