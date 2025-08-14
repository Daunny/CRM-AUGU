import prisma from '../config/database';
import { AppError } from '../utils/errors';
import {
  TaskStatus,
  TaskCategory,
  Priority,
  RecurringType,
  Prisma,
} from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import logger from '../utils/logger';

interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  category?: TaskCategory;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  projectId?: string;
  opportunityId?: string;
  companyId?: string;
  parentTaskId?: string;
  assignedToId: string;
  isRecurring?: boolean;
  recurringType?: RecurringType;
  recurringInterval?: number;
  recurringEndDate?: Date;
  reminderDate?: Date;
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  category?: TaskCategory;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  completionRate?: number;
  assignedToId?: string;
  reminderDate?: Date;
}

interface TaskFilter {
  assignedToId?: string;
  assignedById?: string;
  status?: TaskStatus;
  priority?: Priority;
  category?: TaskCategory;
  projectId?: string;
  opportunityId?: string;
  companyId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  isOverdue?: boolean;
  parentTaskId?: string | null;
}

interface TaskAssignment {
  taskId: string;
  assignedToId: string;
  assignedById: string;
  notes?: string;
}

class TaskService {
  // Check if task is overdue
  private isTaskOverdue(task: any): boolean {
    if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  }

  // Update task status to OVERDUE if needed
  private async updateOverdueStatus(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { dueDate: true, status: true },
    });

    if (task && this.isTaskOverdue(task)) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.OVERDUE },
      });
    }
  }

  // Calculate next recurring date
  private calculateNextRecurringDate(
    baseDate: Date,
    recurringType: RecurringType,
    interval: number = 1
  ): Date {
    switch (recurringType) {
      case RecurringType.DAILY:
        return addDays(baseDate, interval);
      case RecurringType.WEEKLY:
        return addWeeks(baseDate, interval);
      case RecurringType.BIWEEKLY:
        return addWeeks(baseDate, interval * 2);
      case RecurringType.MONTHLY:
        return addMonths(baseDate, interval);
      case RecurringType.QUARTERLY:
        return addMonths(baseDate, interval * 3);
      case RecurringType.YEARLY:
        return addYears(baseDate, interval);
      default:
        return baseDate;
    }
  }

  // Create a new task
  async createTask(data: CreateTaskDto, userId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validate related entities
      if (data.projectId) {
        const project = await tx.project.findUnique({
          where: { id: data.projectId },
        });
        if (!project) {
          throw new AppError('Project not found', 404);
        }
      }

      if (data.opportunityId) {
        const opportunity = await tx.opportunity.findUnique({
          where: { id: data.opportunityId },
        });
        if (!opportunity) {
          throw new AppError('Opportunity not found', 404);
        }
      }

      if (data.companyId) {
        const company = await tx.company.findUnique({
          where: { id: data.companyId },
        });
        if (!company) {
          throw new AppError('Company not found', 404);
        }
      }

      if (data.parentTaskId) {
        const parentTask = await tx.task.findUnique({
          where: { id: data.parentTaskId },
        });
        if (!parentTask) {
          throw new AppError('Parent task not found', 404);
        }
      }

      // Create the task
      const task = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority || Priority.MEDIUM,
          category: data.category || TaskCategory.GENERAL,
          status: TaskStatus.PENDING,
          dueDate: data.dueDate,
          startDate: data.startDate,
          estimatedHours: data.estimatedHours,
          projectId: data.projectId,
          opportunityId: data.opportunityId,
          companyId: data.companyId,
          parentTaskId: data.parentTaskId,
          assignedToId: data.assignedToId,
          assignedById: userId,
          isRecurring: data.isRecurring || false,
          recurringType: data.recurringType,
          recurringInterval: data.recurringInterval,
          recurringEndDate: data.recurringEndDate,
          reminderDate: data.reminderDate,
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
            },
          },
          project: true,
          opportunity: true,
          company: true,
          parentTask: true,
        },
      });

      // Create task history entry
      await tx.taskHistory.create({
        data: {
          taskId: task.id,
          userId,
          action: 'CREATED',
        },
      });

      // Create notification for assigned user
      if (data.assignedToId !== userId) {
        await tx.notification.create({
          data: {
            userId: data.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${data.title}`,
          },
        });
      }

      return task;
    });
  }

  // Get tasks with filters
  async getTasks(filter: TaskFilter, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.TaskWhereInput = {};

    if (filter.assignedToId) {
      where.assignedToId = filter.assignedToId;
    }

    if (filter.assignedById) {
      where.assignedById = filter.assignedById;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }

    if (filter.opportunityId) {
      where.opportunityId = filter.opportunityId;
    }

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }

    if (filter.parentTaskId !== undefined) {
      where.parentTaskId = filter.parentTaskId;
    }

    if (filter.dueDateFrom || filter.dueDateTo) {
      where.dueDate = {};
      if (filter.dueDateFrom) {
        where.dueDate.gte = filter.dueDateFrom;
      }
      if (filter.dueDateTo) {
        where.dueDate.lte = filter.dueDateTo;
      }
    }

    if (filter.isOverdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              title: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          subtasks: {
            where: { status: { not: TaskStatus.COMPLETED } },
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    // Check and update overdue status
    const tasksWithOverdueStatus = tasks.map((task: any) => ({
      ...task,
      isOverdue: this.isTaskOverdue(task),
    }));

    return {
      data: tasksWithOverdueStatus,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get task by ID
  async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: true,
        opportunity: {
          include: {
            company: true,
          },
        },
        company: true,
        parentTask: true,
        subtasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        taskHistory: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if overdue
    await this.updateOverdueStatus(id);

    return {
      ...task,
      isOverdue: this.isTaskOverdue(task),
    };
  }

  // Update task
  async updateTask(id: string, data: UpdateTaskDto, userId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingTask = await tx.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new AppError('Task not found', 404);
      }

      // Track changes for history
      const changes: Array<{
        fieldName: string;
        oldValue: string;
        newValue: string;
      }> = [];

      Object.entries(data).forEach(([key, value]) => {
        if (existingTask[key as keyof typeof existingTask] !== value) {
          changes.push({
            fieldName: key,
            oldValue: String(existingTask[key as keyof typeof existingTask]),
            newValue: String(value),
          });
        }
      });

      // Update task
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
          completedAt:
            data.status === TaskStatus.COMPLETED ? new Date() : undefined,
          completedById:
            data.status === TaskStatus.COMPLETED ? userId : undefined,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: true,
          opportunity: true,
          company: true,
        },
      });

      // Create history entries for changes
      if (changes.length > 0) {
        await tx.taskHistory.createMany({
          data: changes.map((change) => ({
            taskId: id,
            userId,
            action: 'UPDATED',
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
          })),
        });
      }

      // Send notification if task was reassigned
      if (data.assignedToId && data.assignedToId !== existingTask.assignedToId) {
        await tx.notification.create({
          data: {
            userId: data.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'Task Reassigned',
            message: `You have been assigned task: ${updatedTask.title}`,
          },
        });
      }

      // Send notification if task was completed
      if (data.status === TaskStatus.COMPLETED && existingTask.assignedById) {
        await tx.notification.create({
          data: {
            userId: existingTask.assignedById,
            type: 'TASK_COMPLETED',
            title: 'Task Completed',
            message: `Task "${updatedTask.title}" has been completed`,
          },
        });
      }

      return updatedTask;
    });
  }

  // Delete task
  async deleteTask(id: string, _userId: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.subtasks.length > 0) {
      throw new AppError('Cannot delete task with subtasks', 400);
    }

    await prisma.task.delete({
      where: { id },
    });

    return { message: 'Task deleted successfully' };
  }

  // Bulk assign tasks
  async bulkAssignTasks(assignments: TaskAssignment[], userId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const results = [];

      for (const assignment of assignments) {
        const task = await tx.task.update({
          where: { id: assignment.taskId },
          data: {
            assignedToId: assignment.assignedToId,
            assignedById: assignment.assignedById || userId,
            updatedBy: userId,
          },
        });

        // Create history entry
        await tx.taskHistory.create({
          data: {
            taskId: assignment.taskId,
            userId,
            action: 'REASSIGNED',
            newValue: assignment.assignedToId,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: assignment.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assignment',
            message: assignment.notes || `You have been assigned task: ${task.title}`,
          },
        });

        results.push(task);
      }

      return results;
    });
  }

  // Add comment to task
  async addComment(taskId: string, comment: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const newComment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action: 'COMMENT_ADDED',
      },
    });

    return newComment;
  }

  // Add attachment to task
  async addAttachment(
    taskId: string,
    fileName: string,
    fileUrl: string,
    fileSize: number,
    mimeType: string,
    userId: string
  ) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        uploadedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action: 'ATTACHMENT_ADDED',
        newValue: fileName,
      },
    });

    return attachment;
  }

  // Create recurring tasks
  async createRecurringTasks(originalTaskId: string) {
    const originalTask = await prisma.task.findUnique({
      where: { id: originalTaskId },
    });

    if (!originalTask || !originalTask.isRecurring) {
      throw new AppError('Task is not set as recurring', 400);
    }

    if (!originalTask.recurringType || !originalTask.recurringEndDate) {
      throw new AppError('Recurring configuration is incomplete', 400);
    }

    const tasks = [];
    let nextDate = originalTask.dueDate
      ? new Date(originalTask.dueDate)
      : new Date();
    const endDate = new Date(originalTask.recurringEndDate);

    while (nextDate <= endDate) {
      nextDate = this.calculateNextRecurringDate(
        nextDate,
        originalTask.recurringType,
        originalTask.recurringInterval || 1
      );

      if (nextDate <= endDate) {
        const newTask = await prisma.task.create({
          data: {
            title: originalTask.title,
            description: originalTask.description,
            priority: originalTask.priority,
            category: originalTask.category,
            status: TaskStatus.PENDING,
            dueDate: nextDate,
            startDate: originalTask.startDate
              ? this.calculateNextRecurringDate(
                  new Date(originalTask.startDate),
                  originalTask.recurringType,
                  originalTask.recurringInterval || 1
                )
              : undefined,
            estimatedHours: originalTask.estimatedHours,
            projectId: originalTask.projectId,
            opportunityId: originalTask.opportunityId,
            companyId: originalTask.companyId,
            assignedToId: originalTask.assignedToId,
            assignedById: originalTask.assignedById,
            originalTaskId: originalTaskId,
            createdBy: originalTask.createdBy,
          },
        });
        tasks.push(newTask);
      }
    }

    return tasks;
  }

  // Get task statistics
  async getTaskStatistics(userId?: string, dateRange?: { from: Date; to: Date }) {
    const where: Prisma.TaskWhereInput = {};

    if (userId) {
      where.assignedToId = userId;
    }

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    const [totalTasks, statusCounts, priorityCounts, overdueTasks] =
      await Promise.all([
        prisma.task.count({ where }),
        prisma.task.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.task.groupBy({
          by: ['priority'],
          where,
          _count: true,
        }),
        prisma.task.count({
          where: {
            ...where,
            dueDate: { lt: new Date() },
            status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          },
        }),
      ]);

    const completionRate = totalTasks > 0
      ? (statusCounts.find((s: any) => s.status === TaskStatus.COMPLETED)?._count || 0) /
        totalTasks
      : 0;

    return {
      totalTasks,
      statusCounts: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      priorityCounts: priorityCounts.reduce((acc: any, curr: any) => {
        acc[curr.priority] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      overdueTasks,
      completionRate: Math.round(completionRate * 100),
    };
  }

  // Get upcoming tasks
  async getUpcomingTasks(userId: string, days: number = 7) {
    const endDate = addDays(new Date(), days);

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        dueDate: {
          gte: new Date(),
          lte: endDate,
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return tasks;
  }

  // Process task reminders
  async processTaskReminders() {
    const tasksWithReminders = await prisma.task.findMany({
      where: {
        reminderDate: {
          lte: new Date(),
        },
        isReminderSent: false,
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
      include: {
        assignedTo: true,
      },
    });

    for (const task of tasksWithReminders) {
      try {
        // Create notification
        await prisma.notification.create({
          data: {
            userId: task.assignedToId,
            type: 'TASK_REMINDER',
            title: 'Task Reminder',
            message: `Reminder: ${task.title} is due on ${
              task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'
            }`,
          },
        });

        // Mark reminder as sent
        await prisma.task.update({
          where: { id: task.id },
          data: { isReminderSent: true },
        });

        logger.info(`Task reminder sent for task ${task.id}`);
      } catch (error) {
        logger.error(`Failed to send reminder for task ${task.id}:`, error);
      }
    }
  }
}

export const taskService = new TaskService();