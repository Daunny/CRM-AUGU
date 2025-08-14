import { Prisma, LeadSource, LeadStatus, AssignmentStatus, ActivityType, EntityType } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateLeadInput {
  code: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  sourceDetail?: string;
  notes?: string;
  assignedToId?: string;
  assignedTeamId?: string;
}

interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: LeadStatus;
  bantBudget?: boolean;
  bantAuthority?: boolean;
  bantNeed?: boolean;
  bantTimeline?: boolean;
}

interface LeadFilter {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedToId?: string;
  assignedTeamId?: string;
  bantScore?: number;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

interface ConvertLeadInput {
  companyId?: string;
  newCompanyData?: {
    code: string;
    name: string;
    businessNumber?: string;
    industryId?: string;
  };
  opportunityData: {
    code: string;
    title: string;
    description?: string;
    amount?: number;
    expectedCloseDate?: Date | string;
    assignedToId?: string;
    assignedTeamId?: string;
  };
}

interface LeadAssignmentInput {
  leadId: string;
  assignedToId?: string;
  assignedTeamId?: string;
  assignmentReason?: string;
}

export class LeadService {
  // Calculate BANT score
  private calculateBantScore(lead: {
    bantBudget: boolean;
    bantAuthority: boolean;
    bantNeed: boolean;
    bantTimeline: boolean;
  }): number {
    let score = 0;
    if (lead.bantBudget) score += 25;
    if (lead.bantAuthority) score += 25;
    if (lead.bantNeed) score += 25;
    if (lead.bantTimeline) score += 25;
    return score;
  }

  // Lead CRUD
  async createLead(input: CreateLeadInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.lead.findUnique({
      where: { code: input.code }
    });

    if (existing) {
      throw new ConflictError('Lead code already exists');
    }

    const lead = await prisma.lead.create({
      data: {
        ...input,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          }
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });

    // Create initial assignment if assigned
    if (input.assignedToId || input.assignedTeamId) {
      await prisma.leadAssignment.create({
        data: {
          leadId: lead.id,
          assignedToId: input.assignedToId,
          assignedTeamId: input.assignedTeamId,
          assignmentReason: 'Initial assignment',
          status: AssignmentStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
        }
      });
    }

    return lead;
  }

  async getLeads(filter: LeadFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
    };

    if (filter.search) {
      where.OR = [
        { companyName: { contains: filter.search, mode: 'insensitive' } },
        { contactName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.source) {
      where.source = filter.source;
    }

    if (filter.assignedToId) {
      where.assignedToId = filter.assignedToId;
    }

    if (filter.assignedTeamId) {
      where.assignedTeamId = filter.assignedTeamId;
    }

    if (filter.bantScore !== undefined) {
      where.bantScore = { gte: filter.bantScore };
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

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          assignedTeam: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              assignments: true,
            }
          }
        },
        orderBy: [
          { bantScore: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLeadById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          }
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            },
            assignedTeam: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    return lead;
  }

  async updateLead(id: string, input: UpdateLeadInput, userId: string) {
    const existing = await prisma.lead.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Lead not found');
    }

    if (existing.status === LeadStatus.CONVERTED) {
      throw new ValidationError('Cannot update converted lead');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.lead.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('Lead code already exists');
      }
    }

    // Calculate BANT score if BANT fields are updated
    let bantScore = existing.bantScore;
    if (
      input.bantBudget !== undefined ||
      input.bantAuthority !== undefined ||
      input.bantNeed !== undefined ||
      input.bantTimeline !== undefined
    ) {
      bantScore = this.calculateBantScore({
        bantBudget: input.bantBudget ?? existing.bantBudget,
        bantAuthority: input.bantAuthority ?? existing.bantAuthority,
        bantNeed: input.bantNeed ?? existing.bantNeed,
        bantTimeline: input.bantTimeline ?? existing.bantTimeline,
      });
    }

    // Calculate overall score (BANT + other factors)
    const score = bantScore;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...input,
        bantScore,
        score,
        updatedBy: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return lead;
  }

  async deleteLead(id: string, userId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new ValidationError('Cannot delete converted lead');
    }

    // Soft delete
    await prisma.lead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });
  }

  // Lead Assignment
  async assignLead(input: LeadAssignmentInput, _userId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId }
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new ValidationError('Cannot reassign converted lead');
    }

    // Create assignment request
    const assignment = await prisma.leadAssignment.create({
      data: {
        leadId: input.leadId,
        assignedFromId: lead.assignedToId,
        assignedToId: input.assignedToId,
        assignedTeamId: input.assignedTeamId,
        assignmentReason: input.assignmentReason,
        status: AssignmentStatus.PENDING,
      },
      include: {
        lead: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return assignment;
  }

  async approveAssignment(assignmentId: string, userId: string) {
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
      include: { lead: true }
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new ValidationError('Assignment is not pending');
    }

    // Update assignment status
    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: {
        status: AssignmentStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      }
    });

    // Update lead's assigned user/team
    await prisma.lead.update({
      where: { id: assignment.leadId },
      data: {
        assignedToId: assignment.assignedToId,
        assignedTeamId: assignment.assignedTeamId,
        updatedBy: userId,
      }
    });

    return { success: true, message: 'Assignment approved successfully' };
  }

  async rejectAssignment(assignmentId: string, reason: string, userId: string) {
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new ValidationError('Assignment is not pending');
    }

    // Update assignment status
    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: {
        status: AssignmentStatus.REJECTED,
        rejectionReason: reason,
        approvedBy: userId,
        approvedAt: new Date(),
      }
    });

    return { success: true, message: 'Assignment rejected' };
  }

  // Lead Conversion
  async convertLead(id: string, input: ConvertLeadInput, userId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new ValidationError('Lead is already converted');
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      let companyId = input.companyId;

      // Create new company if needed
      if (!companyId && input.newCompanyData) {
        const company = await tx.company.create({
          data: {
            ...input.newCompanyData,
            createdBy: userId,
            updatedBy: userId,
          }
        });
        companyId = company.id;
      }

      if (!companyId) {
        throw new ValidationError('Company ID or new company data is required');
      }

      // Convert expectedCloseDate to Date if needed
      if (input.opportunityData.expectedCloseDate && typeof input.opportunityData.expectedCloseDate === 'string') {
        input.opportunityData.expectedCloseDate = new Date(input.opportunityData.expectedCloseDate);
      }

      // Create opportunity
      const opportunity = await tx.opportunity.create({
        data: {
          ...input.opportunityData,
          companyId,
          accountManagerId: input.opportunityData.assignedToId || lead.assignedToId || userId,
          createdBy: userId,
          updatedBy: userId,
        }
      });

      // Update lead status
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          convertedToCompanyId: companyId,
          convertedToOpportunityId: opportunity.id,
          updatedBy: userId,
        }
      });

      // Create activity log
      await tx.activity.create({
        data: {
          activityType: ActivityType.CALL,
          entityType: EntityType.COMPANY,
          entityId: companyId,
          subject: `Lead ${lead.code} converted to opportunity`,
          description: `Lead ${lead.companyName} has been converted to opportunity ${opportunity.code}`,
          companyId,
          opportunityId: opportunity.id,
          userId,
          startTime: new Date(),
        }
      });

      return {
        lead: updatedLead,
        company: { id: companyId },
        opportunity,
      };
    });

    return result;
  }
}

export const leadService = new LeadService();