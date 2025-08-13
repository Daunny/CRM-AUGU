import { Prisma, MeetingType, MeetingStatus, MeetingCategory, ActionItemStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateMeetingInput {
  code: string;
  title: string;
  type: MeetingType;
  category: MeetingCategory;
  companyId?: string;
  opportunityId?: string;
  projectId?: string;
  scheduledAt: Date | string;
  duration?: number;
  location?: string;
  isOnline?: boolean;
  onlineLink?: string;
  agenda?: string;
  objectives?: string;
  organizerId: string;
  attendeeIds?: string[];
  externalAttendees?: {
    name: string;
    email?: string;
    company?: string;
    position?: string;
  }[];
}

interface UpdateMeetingInput extends Partial<Omit<CreateMeetingInput, 'organizerId'>> {
  status?: MeetingStatus;
  actualStartTime?: Date | string;
  actualEndTime?: Date | string;
  summary?: string;
  keyDecisions?: string;
  nextSteps?: string;
}

interface MeetingFilter {
  search?: string;
  type?: MeetingType;
  category?: MeetingCategory;
  status?: MeetingStatus;
  companyId?: string;
  projectId?: string;
  organizerId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

interface CreateMeetingMinutesInput {
  meetingId: string;
  content: string;
  keyPoints?: string[];
  decisions?: string[];
  attendees?: string[];
  absentees?: string[];
  attachments?: string[];
}

interface CreateActionItemInput {
  meetingId: string;
  title: string;
  description?: string;
  assignedToId: string;
  dueDate?: Date | string;
  priority?: string;
}

interface UpdateActionItemInput extends Partial<Omit<CreateActionItemInput, 'meetingId'>> {
  status?: ActionItemStatus;
  completedAt?: Date | string;
  completionNotes?: string;
}

interface CreateMeetingProductInput {
  meetingId: string;
  productName: string;
  category?: string;
  quantity?: number;
  price?: number;
  discount?: number;
  notes?: string;
}

export class MeetingService {
  // Meeting CRUD
  async createMeeting(input: CreateMeetingInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.meeting.findUnique({
      where: { code: input.code }
    });

    if (existing) {
      throw new ConflictError('Meeting code already exists');
    }

    // Convert date if needed
    if (input.scheduledAt && typeof input.scheduledAt === 'string') {
      input.scheduledAt = new Date(input.scheduledAt);
    }

    // Prepare data without attendeeIds and externalAttendees
    const { attendeeIds, externalAttendees, ...meetingData } = input;

    const meeting = await prisma.$transaction(async (tx) => {
      // Create meeting
      const newMeeting = await tx.meeting.create({
        data: {
          ...meetingData,
          status: MeetingStatus.SCHEDULED,
          createdBy: userId,
          updatedBy: userId,
        }
      });

      // Add internal participants
      if (attendeeIds && attendeeIds.length > 0) {
        const participantData = attendeeIds.map(attendeeId => ({
          meetingId: newMeeting.id,
          userId: attendeeId,
          isRequired: true,
          createdBy: userId,
          updatedBy: userId,
        }));

        await tx.meetingParticipant.createMany({
          data: participantData,
        });
      }

      // Add organizer as participant
      await tx.meetingParticipant.create({
        data: {
          meetingId: newMeeting.id,
          userId: input.organizerId,
          isRequired: true,
          isOrganizer: true,
          createdBy: userId,
          updatedBy: userId,
        }
      });

      // Add external participants (store in customFields or separate handling)
      if (externalAttendees && externalAttendees.length > 0) {
        // Store external attendees in customFields for now
        await tx.meeting.update({
          where: { id: newMeeting.id },
          data: {
            customFields: {
              externalAttendees,
            }
          }
        });
      }

      // Get complete meeting with relations
      const completeMeeting = await tx.meeting.findUnique({
        where: { id: newMeeting.id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          opportunity: {
            select: {
              id: true,
              code: true,
              title: true,
            }
          },
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          }
        }
      });

      return completeMeeting;
    });

    // Create activity log
    if (input.companyId) {
      await prisma.activity.create({
        data: {
          type: 'MEETING_SCHEDULED',
          subject: `Meeting ${meeting.code} scheduled`,
          description: `Meeting "${meeting.title}" scheduled for ${input.scheduledAt}`,
          companyId: input.companyId,
          meetingId: meeting.id,
          performedBy: userId,
          activityDate: new Date(),
          createdBy: userId,
          updatedBy: userId,
        }
      });
    }

    return meeting;
  }

  async getMeetings(filter: MeetingFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.MeetingWhereInput = {
      deletedAt: null,
    };

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { location: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }

    if (filter.organizerId) {
      where.organizerId = filter.organizerId;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.scheduledAt = {};
      if (filter.dateFrom) {
        where.scheduledAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.scheduledAt.lte = new Date(filter.dateTo);
      }
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              participants: true,
              actionItems: true,
            }
          }
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      data: meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMeetingById(id: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            businessNumber: true,
          }
        },
        opportunity: {
          select: {
            id: true,
            code: true,
            title: true,
            stage: true,
          }
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          }
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                position: true,
              }
            }
          }
        },
        minutes: {
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        actionItems: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        products: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            participants: true,
            actionItems: true,
            products: true,
          }
        }
      },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found');
    }

    return meeting;
  }

  async updateMeeting(id: string, input: UpdateMeetingInput, userId: string) {
    const existing = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Meeting not found');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.meeting.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('Meeting code already exists');
      }
    }

    // Convert dates if needed
    if (input.scheduledAt && typeof input.scheduledAt === 'string') {
      input.scheduledAt = new Date(input.scheduledAt);
    }
    if (input.actualStartTime && typeof input.actualStartTime === 'string') {
      input.actualStartTime = new Date(input.actualStartTime);
    }
    if (input.actualEndTime && typeof input.actualEndTime === 'string') {
      input.actualEndTime = new Date(input.actualEndTime);
    }

    // Prepare data without attendeeIds and externalAttendees
    const { attendeeIds, externalAttendees, ...meetingData } = input;

    const meeting = await prisma.$transaction(async (tx) => {
      // Update meeting
      const updatedMeeting = await tx.meeting.update({
        where: { id },
        data: {
          ...meetingData,
          updatedBy: userId,
        }
      });

      // Update participants if provided
      if (attendeeIds) {
        // Remove existing non-organizer participants
        await tx.meetingParticipant.deleteMany({
          where: {
            meetingId: id,
            isOrganizer: false,
          }
        });

        // Add new participants
        if (attendeeIds.length > 0) {
          const participantData = attendeeIds.map(attendeeId => ({
            meetingId: id,
            userId: attendeeId,
            isRequired: true,
            createdBy: userId,
            updatedBy: userId,
          }));

          await tx.meetingParticipant.createMany({
            data: participantData,
          });
        }
      }

      // Update external attendees if provided
      if (externalAttendees !== undefined) {
        await tx.meeting.update({
          where: { id },
          data: {
            customFields: {
              ...(existing.customFields as any || {}),
              externalAttendees,
            }
          }
        });
      }

      // Get complete meeting with relations
      const completeMeeting = await tx.meeting.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      return completeMeeting;
    });

    // Create activity log for status changes
    if (input.status && input.status !== existing.status) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          subject: `Meeting status changed: ${existing.status} → ${input.status}`,
          description: `Meeting ${meeting.code} status updated`,
          companyId: meeting.companyId,
          meetingId: meeting.id,
          performedBy: userId,
          activityDate: new Date(),
          createdBy: userId,
          updatedBy: userId,
        }
      });
    }

    return meeting;
  }

  async deleteMeeting(id: string, userId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found');
    }

    if (meeting.status === MeetingStatus.COMPLETED) {
      throw new ValidationError('Cannot delete completed meeting');
    }

    // Soft delete
    await prisma.meeting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });
  }

  // Meeting Minutes
  async createMeetingMinutes(input: CreateMeetingMinutesInput, userId: string) {
    // Verify meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: input.meetingId }
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found');
    }

    // Check if minutes already exist
    const existingMinutes = await prisma.meetingMinutes.findFirst({
      where: { meetingId: input.meetingId }
    });

    if (existingMinutes) {
      throw new ConflictError('Meeting minutes already exist for this meeting');
    }

    const minutes = await prisma.meetingMinutes.create({
      data: {
        ...input,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        meeting: {
          select: {
            id: true,
            code: true,
            title: true,
          }
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Update meeting status to COMPLETED
    await prisma.meeting.update({
      where: { id: input.meetingId },
      data: {
        status: MeetingStatus.COMPLETED,
        updatedBy: userId,
      }
    });

    return minutes;
  }

  async updateMeetingMinutes(id: string, input: Partial<CreateMeetingMinutesInput>, userId: string) {
    const existing = await prisma.meetingMinutes.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Meeting minutes not found');
    }

    const minutes = await prisma.meetingMinutes.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        meeting: {
          select: {
            id: true,
            code: true,
            title: true,
          }
        }
      }
    });

    return minutes;
  }

  // Action Items
  async createActionItem(input: CreateActionItemInput, userId: string) {
    // Verify meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: input.meetingId }
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found');
    }

    // Convert date if needed
    if (input.dueDate && typeof input.dueDate === 'string') {
      input.dueDate = new Date(input.dueDate);
    }

    const actionItem = await prisma.meetingActionItem.create({
      data: {
        ...input,
        status: ActionItemStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        meeting: {
          select: {
            id: true,
            code: true,
            title: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return actionItem;
  }

  async getActionItems(filter: { meetingId?: string; assignedToId?: string; status?: ActionItemStatus }) {
    const where: Prisma.MeetingActionItemWhereInput = {};

    if (filter.meetingId) {
      where.meetingId = filter.meetingId;
    }

    if (filter.assignedToId) {
      where.assignedToId = filter.assignedToId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const actionItems = await prisma.meetingActionItem.findMany({
      where,
      include: {
        meeting: {
          select: {
            id: true,
            code: true,
            title: true,
            scheduledAt: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ],
    });

    return actionItems;
  }

  async updateActionItem(id: string, input: UpdateActionItemInput, userId: string) {
    const existing = await prisma.meetingActionItem.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Action item not found');
    }

    // Convert dates if needed
    if (input.dueDate && typeof input.dueDate === 'string') {
      input.dueDate = new Date(input.dueDate);
    }
    if (input.completedAt && typeof input.completedAt === 'string') {
      input.completedAt = new Date(input.completedAt);
    }

    // Auto-set completedAt when status changes to COMPLETED
    if (input.status === ActionItemStatus.COMPLETED && !input.completedAt) {
      input.completedAt = new Date();
    }

    const actionItem = await prisma.meetingActionItem.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return actionItem;
  }

  // Meeting Products (for sales meetings)
  async addMeetingProduct(input: CreateMeetingProductInput, userId: string) {
    // Verify meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: input.meetingId }
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found');
    }

    const product = await prisma.meetingProduct.create({
      data: {
        ...input,
        finalPrice: input.price && input.discount 
          ? input.price - (input.price * input.discount / 100)
          : input.price,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        meeting: {
          select: {
            id: true,
            code: true,
            title: true,
          }
        }
      }
    });

    return product;
  }

  async getMeetingProducts(meetingId: string) {
    const products = await prisma.meetingProduct.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });

    return products;
  }

  // Analytics
  async getMeetingAnalytics(filter: { 
    dateFrom?: Date | string; 
    dateTo?: Date | string;
    teamId?: string;
    userId?: string;
  }) {
    const where: Prisma.MeetingWhereInput = {
      deletedAt: null,
    };

    if (filter.dateFrom || filter.dateTo) {
      where.scheduledAt = {};
      if (filter.dateFrom) {
        where.scheduledAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.scheduledAt.lte = new Date(filter.dateTo);
      }
    }

    if (filter.userId) {
      where.organizerId = filter.userId;
    }

    const [byType, byCategory, byStatus] = await Promise.all([
      // Meetings by type
      prisma.meeting.groupBy({
        by: ['type'],
        where,
        _count: {
          id: true,
        },
      }),
      // Meetings by category
      prisma.meeting.groupBy({
        by: ['category'],
        where,
        _count: {
          id: true,
        },
      }),
      // Meetings by status
      prisma.meeting.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      }),
    ]);

    // Action items summary
    const actionItemsWhere: Prisma.MeetingActionItemWhereInput = {};
    
    if (filter.userId) {
      actionItemsWhere.assignedToId = filter.userId;
    }

    const actionItemsSummary = await prisma.meetingActionItem.groupBy({
      by: ['status'],
      where: actionItemsWhere,
      _count: {
        id: true,
      },
    });

    return {
      meetings: {
        byType: byType.map(item => ({
          type: item.type,
          count: item._count.id,
        })),
        byCategory: byCategory.map(item => ({
          category: item.category,
          count: item._count.id,
        })),
        byStatus: byStatus.map(item => ({
          status: item.status,
          count: item._count.id,
        })),
      },
      actionItems: {
        total: actionItemsSummary.reduce((sum, item) => sum + item._count.id, 0),
        byStatus: actionItemsSummary.map(item => ({
          status: item.status,
          count: item._count.id,
        })),
      },
    };
  }
}

export const meetingService = new MeetingService();