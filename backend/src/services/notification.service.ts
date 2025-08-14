import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

type SocketManager = any; // Type definition to avoid import issues

interface CreateNotificationDto {
  userId?: string;
  userIds?: string[];
  role?: string;
  departmentId?: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

interface NotificationFilter {
  userId?: string;
  type?: string;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class NotificationService {
  private getSocketManager(): SocketManager | null {
    return (global as any).socketManager || null;
  }

  // Create and send notification
  async createNotification(data: CreateNotificationDto) {
    const socketManager = this.getSocketManager();
    
    // Determine recipients
    let userIds: string[] = [];
    
    if (data.userId) {
      userIds = [data.userId];
    } else if (data.userIds) {
      userIds = data.userIds;
    } else if (data.role) {
      const users = await prisma.user.findMany({
        where: {
          role: data.role as any,
          isActive: true,
        },
        select: { id: true },
      });
      userIds = users.map(u => u.id);
    } else if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: {
          departmentId: data.departmentId,
          isActive: true,
        },
        select: { id: true },
      });
      userIds = users.map(u => u.id);
    }

    if (userIds.length === 0) {
      throw new AppError('No recipients specified', 400);
    }

    // Create notifications in database
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
      })),
    });

    // Send real-time notifications if socket manager is available
    if (socketManager) {
      for (const userId of userIds) {
        socketManager.sendToUser(userId, {
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
        });
      }
    }

    return { count: notifications.count, userIds };
  }

  // Get notifications for a user
  async getNotifications(
    userId: string,
    filter?: NotificationFilter,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }

    if (filter?.dateFrom || filter?.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        where.createdAt.gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        where.createdAt.lte = filter.dateTo;
      }
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      data: notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Emit real-time update if socket manager is available
    const socketManager = this.getSocketManager();
    if (socketManager) {
      socketManager.sendToUser(userId, {
        type: 'notification:read',
        notificationId,
      });
    }

    return updated;
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Emit real-time update if socket manager is available
    const socketManager = this.getSocketManager();
    if (socketManager) {
      socketManager.sendToUser(userId, {
        type: 'notification:allRead',
      });
    }

    return { count: result.count };
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  // Delete all read notifications
  async deleteReadNotifications(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return { count: result.count };
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  // Notification templates for common events

  // Task assigned notification
  async notifyTaskAssigned(taskId: string, assignedToId: string, assignedByName: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return;

    return this.createNotification({
      userId: assignedToId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${assignedByName} assigned you a new task: ${task.title}`,
      metadata: { taskId },
    });
  }

  // Task due soon notification
  async notifyTaskDueSoon(taskId: string, assignedToId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return;

    return this.createNotification({
      userId: assignedToId,
      type: 'TASK_DUE_SOON',
      title: 'Task Due Soon',
      message: `Task "${task.title}" is due in 24 hours`,
      metadata: { taskId },
    });
  }

  // Opportunity stage changed notification
  async notifyOpportunityStageChanged(
    opportunityId: string,
    accountManagerId: string,
    newStage: string,
    changedByName: string
  ) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { company: true },
    });

    if (!opportunity) return;

    return this.createNotification({
      userId: accountManagerId,
      type: 'OPPORTUNITY_STAGE_CHANGED',
      title: 'Opportunity Stage Updated',
      message: `${changedByName} moved ${opportunity.company.name} opportunity to ${newStage}`,
      metadata: { opportunityId, newStage },
    });
  }

  // Proposal approved notification
  async notifyProposalApproved(proposalId: string, createdBy: string, approverName: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) return;

    return this.createNotification({
      userId: createdBy,
      type: 'PROPOSAL_APPROVED',
      title: 'Proposal Approved',
      message: `Your proposal ${proposal.code} has been approved by ${approverName}`,
      metadata: { proposalId },
    });
  }

  // Proposal rejected notification
  async notifyProposalRejected(
    proposalId: string,
    createdBy: string,
    rejectorName: string,
    reason: string
  ) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) return;

    return this.createNotification({
      userId: createdBy,
      type: 'PROPOSAL_REJECTED',
      title: 'Proposal Rejected',
      message: `Your proposal ${proposal.code} has been rejected by ${rejectorName}. Reason: ${reason}`,
      metadata: { proposalId, reason },
    });
  }

  // Project milestone reached notification
  async notifyMilestoneReached(milestoneId: string, projectManagerId: string) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone) return;

    return this.createNotification({
      userId: projectManagerId,
      type: 'MILESTONE_REACHED',
      title: 'Milestone Reached',
      message: `Milestone "${milestone.name}" in project ${milestone.project.name} has been completed`,
      metadata: { milestoneId, projectId: milestone.projectId },
    });
  }

  // Meeting reminder notification
  async notifyMeetingReminder(meetingId: string, participantIds: string[]) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) return;

    return this.createNotification({
      userIds: participantIds,
      type: 'MEETING_REMINDER',
      title: 'Meeting Reminder',
      message: `Reminder: Meeting "${meeting.title}" starts in 15 minutes`,
      metadata: { meetingId },
    });
  }

  // Report generated notification
  async notifyReportGenerated(reportId: string, userId: string, reportName: string) {
    return this.createNotification({
      userId,
      type: 'REPORT_GENERATED',
      title: 'Report Ready',
      message: `Your report "${reportName}" has been generated successfully`,
      metadata: { reportId },
    });
  }

  // System announcement
  async sendSystemAnnouncement(title: string, message: string, targetRole?: string) {
    return this.createNotification({
      role: targetRole || 'OPERATOR', // Default to all operators
      type: 'SYSTEM_ANNOUNCEMENT',
      title,
      message,
    });
  }

  // Customer activity notification
  async notifyCustomerActivity(
    customerId: string,
    accountManagerId: string,
    activityType: string,
    activityDescription: string
  ) {
    const customer = await prisma.company.findUnique({
      where: { id: customerId },
    });

    if (!customer) return;

    return this.createNotification({
      userId: accountManagerId,
      type: 'CUSTOMER_ACTIVITY',
      title: 'Customer Activity',
      message: `${customer.name}: ${activityDescription}`,
      metadata: { customerId, activityType },
    });
  }
}

export const notificationService = new NotificationService();