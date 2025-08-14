import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import {
  Proposal,
  ProposalStatus,
  ProposalItem,
  ProposalVersion,
  ProposalApproval,
  ProposalTemplate,
  Prisma,
} from '@prisma/client';

interface CreateProposalDto {
  opportunityId: string;
  title: string;
  executiveSummary?: string;
  templateId?: string;
  validUntil: Date;
  items: CreateProposalItemDto[];
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  specialTerms?: string;
}

interface CreateProposalItemDto {
  productId?: string;
  itemType: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

interface UpdateProposalDto {
  title?: string;
  executiveSummary?: string;
  validUntil?: Date;
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  specialTerms?: string;
  discountPercent?: number;
  tax?: number;
}

interface ProposalFilter {
  opportunityId?: string;
  status?: ProposalStatus;
  templateId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

class ProposalService {
  // Generate unique proposal code
  private async generateProposalCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastProposal = await prisma.proposal.findFirst({
      where: {
        code: {
          startsWith: `PROP-${year}${month}`,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    let sequence = 1;
    if (lastProposal) {
      const lastSequence = parseInt(lastProposal.code.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `PROP-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Calculate proposal totals
  private calculateTotals(
    items: { quantity: number; unitPrice: number; discountPercent: number }[],
    discountPercent: number = 0,
    tax: number = 0
  ) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = itemTotal * (item.discountPercent / 100);
      return sum + (itemTotal - itemDiscount);
    }, 0);

    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const totalAmount = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      tax: taxAmount,
      totalAmount,
    };
  }

  // Create new proposal
  async createProposal(data: CreateProposalDto, userId: string) {
    // Validate opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: data.opportunityId },
    });

    if (!opportunity) {
      throw new AppError('Opportunity not found', 404);
    }

    // Generate proposal code
    const code = await this.generateProposalCode();

    // Prepare items with calculations
    const itemsWithTotals = data.items.map((item, index) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = itemTotal * ((item.discountPercent || 0) / 100);
      const totalPrice = itemTotal - itemDiscount;

      return {
        sequence: index + 1,
        itemType: item.itemType,
        productId: item.productId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        totalPrice,
      };
    });

    // Calculate totals
    const totals = this.calculateTotals(itemsWithTotals, 0, 0);

    // Create proposal with items
    const proposal = await prisma.proposal.create({
      data: {
        code,
        opportunityId: data.opportunityId,
        title: data.title,
        executiveSummary: data.executiveSummary,
        templateId: data.templateId,
        validUntil: data.validUntil,
        subtotal: totals.subtotal,
        discountPercent: 0,
        discountAmount: 0,
        tax: 0,
        totalAmount: totals.totalAmount,
        paymentTerms: data.paymentTerms,
        deliveryTerms: data.deliveryTerms,
        warrantyTerms: data.warrantyTerms,
        specialTerms: data.specialTerms,
        createdBy: userId,
        updatedBy: userId,
        items: {
          create: itemsWithTotals,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });

    // Create initial version
    await this.createVersion(proposal.id, 'Initial version', userId);

    return proposal;
  }

  // Get proposals with filters
  async getProposals(filter: ProposalFilter, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProposalWhereInput = {};

    if (filter.opportunityId) {
      where.opportunityId = filter.opportunityId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.templateId) {
      where.templateId = filter.templateId;
    }

    if (filter.search) {
      where.OR = [
        { code: { contains: filter.search, mode: 'insensitive' } },
        { title: { contains: filter.search, mode: 'insensitive' } },
        { executiveSummary: { contains: filter.search, mode: 'insensitive' } },
      ];
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

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: {
            include: {
              company: true,
            },
          },
          items: true,
          approvals: {
            include: {
              approver: true,
            },
          },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    return {
      data: proposals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get proposal by ID
  async getProposalById(id: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            company: true,
            branch: true,
            contact: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
        approvals: {
          include: {
            approver: true,
          },
        },
        template: true,
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    return proposal;
  }

  // Update proposal
  async updateProposal(id: string, data: UpdateProposalDto, userId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new AppError('Only draft proposals can be edited', 400);
    }

    // Recalculate totals if discount or tax changed
    let totals = {
      subtotal: proposal.subtotal,
      discountAmount: proposal.discountAmount,
      tax: proposal.tax,
      totalAmount: proposal.totalAmount,
    };

    if (data.discountPercent !== undefined || data.tax !== undefined) {
      totals = this.calculateTotals(
        proposal.items,
        data.discountPercent ?? proposal.discountPercent,
        data.tax ?? proposal.tax
      );
    }

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        ...totals,
        updatedBy: userId,
        version: {
          increment: 1,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });

    // Create version record
    await this.createVersion(id, 'Updated proposal', userId);

    return updatedProposal;
  }

  // Add or update proposal items
  async updateProposalItems(
    id: string,
    items: CreateProposalItemDto[],
    userId: string
  ) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new AppError('Only draft proposals can be edited', 400);
    }

    // Delete existing items
    await prisma.proposalItem.deleteMany({
      where: { proposalId: id },
    });

    // Create new items
    const itemsWithTotals = items.map((item, index) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = itemTotal * ((item.discountPercent || 0) / 100);
      const totalPrice = itemTotal - itemDiscount;

      return {
        proposalId: id,
        sequence: index + 1,
        itemType: item.itemType,
        productId: item.productId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        totalPrice,
      };
    });

    await prisma.proposalItem.createMany({
      data: itemsWithTotals,
    });

    // Recalculate totals
    const totals = this.calculateTotals(
      itemsWithTotals,
      proposal.discountPercent,
      proposal.tax
    );

    // Update proposal totals
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...totals,
        updatedBy: userId,
        version: {
          increment: 1,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Create version record
    await this.createVersion(id, 'Updated items', userId);

    return updatedProposal;
  }

  // Submit proposal for approval
  async submitForApproval(id: string, userId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        opportunity: true,
      },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new AppError('Only draft proposals can be submitted', 400);
    }

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.PENDING_APPROVAL,
        submittedAt: new Date(),
        submittedBy: userId,
        updatedBy: userId,
      },
    });

    // Create approval workflow based on amount
    const approvalLevels = this.getApprovalLevels(proposal.totalAmount);
    
    // Create approval records
    const approvals = await Promise.all(
      approvalLevels.map((level) =>
        prisma.proposalApproval.create({
          data: {
            proposalId: id,
            approverId: level.approverId,
            level: level.level,
          },
        })
      )
    );

    return { proposal: updatedProposal, approvals };
  }

  // Approve proposal
  async approveProposal(id: string, comments: string | null, userId: string) {
    const approval = await prisma.proposalApproval.findFirst({
      where: {
        proposalId: id,
        approverId: userId,
        status: 'PENDING',
      },
    });

    if (!approval) {
      throw new AppError('No pending approval found for this user', 404);
    }

    // Update approval record
    await prisma.proposalApproval.update({
      where: { id: approval.id },
      data: {
        status: 'APPROVED',
        comments,
        approvedAt: new Date(),
      },
    });

    // Check if all approvals are complete
    const pendingApprovals = await prisma.proposalApproval.count({
      where: {
        proposalId: id,
        status: 'PENDING',
      },
    });

    // If all approved, update proposal status
    if (pendingApprovals === 0) {
      await prisma.proposal.update({
        where: { id },
        data: {
          status: ProposalStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: userId,
          updatedBy: userId,
        },
      });
    }

    return { message: 'Proposal approved successfully' };
  }

  // Reject proposal
  async rejectProposal(
    id: string,
    reason: string,
    comments: string | null,
    userId: string
  ) {
    const approval = await prisma.proposalApproval.findFirst({
      where: {
        proposalId: id,
        approverId: userId,
        status: 'PENDING',
      },
    });

    if (!approval) {
      throw new AppError('No pending approval found for this user', 404);
    }

    // Update approval record
    await prisma.proposalApproval.update({
      where: { id: approval.id },
      data: {
        status: 'REJECTED',
        comments,
        rejectedAt: new Date(),
      },
    });

    // Update proposal status
    await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: reason,
        updatedBy: userId,
      },
    });

    return { message: 'Proposal rejected' };
  }

  // Send proposal to customer
  async sendToCustomer(id: string, userId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== ProposalStatus.APPROVED) {
      throw new AppError('Only approved proposals can be sent', 400);
    }

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.SENT,
        sentToCustomerAt: new Date(),
        updatedBy: userId,
      },
    });

    // TODO: Send email to customer
    // TODO: Generate PDF document

    return updatedProposal;
  }

  // Record customer response
  async recordCustomerResponse(
    id: string,
    accepted: boolean,
    signedBy: string | null,
    userId: string
  ) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== ProposalStatus.SENT && proposal.status !== ProposalStatus.VIEWED) {
      throw new AppError('Invalid proposal status for customer response', 400);
    }

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: accepted ? ProposalStatus.ACCEPTED : ProposalStatus.DECLINED,
        customerSignedAt: accepted ? new Date() : null,
        signedBy: accepted ? signedBy : null,
        updatedBy: userId,
      },
    });

    // If accepted, update opportunity stage
    if (accepted) {
      await prisma.opportunity.update({
        where: { id: proposal.opportunityId },
        data: {
          stage: 'NEGOTIATION',
          probability: 75,
        },
      });
    }

    return updatedProposal;
  }

  // Clone proposal
  async cloneProposal(id: string, userId: string) {
    const originalProposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!originalProposal) {
      throw new AppError('Proposal not found', 404);
    }

    // Generate new code
    const code = await this.generateProposalCode();

    // Create cloned proposal
    const clonedProposal = await prisma.proposal.create({
      data: {
        code,
        opportunityId: originalProposal.opportunityId,
        title: `${originalProposal.title} (Copy)`,
        executiveSummary: originalProposal.executiveSummary,
        templateId: originalProposal.templateId,
        status: ProposalStatus.DRAFT,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subtotal: originalProposal.subtotal,
        discountPercent: originalProposal.discountPercent,
        discountAmount: originalProposal.discountAmount,
        tax: originalProposal.tax,
        totalAmount: originalProposal.totalAmount,
        paymentTerms: originalProposal.paymentTerms,
        deliveryTerms: originalProposal.deliveryTerms,
        warrantyTerms: originalProposal.warrantyTerms,
        specialTerms: originalProposal.specialTerms,
        createdBy: userId,
        updatedBy: userId,
        items: {
          create: originalProposal.items.map((item) => ({
            productId: item.productId,
            sequence: item.sequence,
            itemType: item.itemType,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Create initial version
    await this.createVersion(clonedProposal.id, 'Cloned from ' + originalProposal.code, userId);

    return clonedProposal;
  }

  // Create proposal version
  private async createVersion(proposalId: string, changes: string, userId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        items: true,
      },
    });

    if (!proposal) return;

    await prisma.proposalVersion.create({
      data: {
        proposalId,
        version: proposal.version,
        changes,
        content: proposal as any,
        createdBy: userId,
      },
    });
  }

  // Get approval levels based on amount
  private getApprovalLevels(amount: number) {
    // TODO: Implement actual approval matrix logic
    // This is a placeholder implementation
    const levels = [];

    if (amount > 10000000) {
      // Over 10M KRW - needs CEO approval
      levels.push({ level: 1, approverId: 'ceo-user-id' });
    }
    if (amount > 5000000) {
      // Over 5M KRW - needs director approval
      levels.push({ level: 2, approverId: 'director-user-id' });
    }
    if (amount > 1000000) {
      // Over 1M KRW - needs manager approval
      levels.push({ level: 3, approverId: 'manager-user-id' });
    }

    return levels;
  }

  // Template Management

  // Create proposal template
  async createTemplate(data: {
    code: string;
    name: string;
    category?: string;
    description?: string;
    content: any;
    sections?: any;
    terms?: any;
  }, userId: string) {
    const template = await prisma.proposalTemplate.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });

    return template;
  }

  // Get templates
  async getTemplates(isActive: boolean = true) {
    const templates = await prisma.proposalTemplate.findMany({
      where: { isActive },
      orderBy: { usageCount: 'desc' },
    });

    return templates;
  }

  // Update template
  async updateTemplate(id: string, data: any) {
    const template = await prisma.proposalTemplate.update({
      where: { id },
      data,
    });

    return template;
  }

  // Delete proposal
  async deleteProposal(id: string, userId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new AppError('Only draft proposals can be deleted', 400);
    }

    await prisma.proposal.delete({
      where: { id },
    });

    return { message: 'Proposal deleted successfully' };
  }
}

export const proposalService = new ProposalService();