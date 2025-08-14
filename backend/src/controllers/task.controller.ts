import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import logger from '../utils/logger';

// Create task
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const task = await taskService.createTask(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks with filters
export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      assignedToId,
      assignedById,
      status,
      priority,
      category,
      projectId,
      opportunityId,
      companyId,
      dueDateFrom,
      dueDateTo,
      search,
      isOverdue,
      parentTaskId,
    } = req.query;

    const filter = {
      assignedToId: assignedToId as string,
      assignedById: assignedById as string,
      status: status as any,
      priority: priority as any,
      category: category as any,
      projectId: projectId as string,
      opportunityId: opportunityId as string,
      companyId: companyId as string,
      dueDateFrom: dueDateFrom ? new Date(dueDateFrom as string) : undefined,
      dueDateTo: dueDateTo ? new Date(dueDateTo as string) : undefined,
      search: search as string,
      isOverdue: isOverdue === 'true',
      parentTaskId: parentTaskId as string,
    };

    const result = await taskService.getTasks(
      filter,
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get my tasks
export const getMyTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      dueDateFrom,
      dueDateTo,
      search,
      isOverdue,
    } = req.query;

    const filter = {
      assignedToId: userId,
      status: status as any,
      priority: priority as any,
      category: category as any,
      dueDateFrom: dueDateFrom ? new Date(dueDateFrom as string) : undefined,
      dueDateTo: dueDateTo ? new Date(dueDateTo as string) : undefined,
      search: search as string,
      isOverdue: isOverdue === 'true',
    };

    const result = await taskService.getTasks(
      filter,
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get task by ID
export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Update task
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const task = await taskService.updateTask(id, req.body, userId);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Update task status
export const updateTaskStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;
    
    const task = await taskService.updateTask(id, { status }, userId);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Update task progress
export const updateTaskProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionRate, actualHours } = req.body;
    const userId = (req as any).user.id;
    
    const task = await taskService.updateTask(
      id,
      { completionRate, actualHours },
      userId
    );

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Delete task
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const result = await taskService.deleteTask(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk assign tasks
export const bulkAssignTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { assignments } = req.body;
    
    const tasks = await taskService.bulkAssignTasks(assignments, userId);

    res.json({
      success: true,
      data: tasks,
      message: `${tasks.length} tasks assigned successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Add comment to task
export const addTaskComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = (req as any).user.id;
    
    const newComment = await taskService.addComment(id, comment, userId);

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

// Add attachment to task
export const addTaskAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { fileName, fileUrl, fileSize, mimeType } = req.body;
    const userId = (req as any).user.id;
    
    const attachment = await taskService.addAttachment(
      id,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      userId
    );

    res.status(201).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};

// Create recurring tasks
export const createRecurringTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const tasks = await taskService.createRecurringTasks(id);

    res.status(201).json({
      success: true,
      data: tasks,
      message: `${tasks.length} recurring tasks created`,
    });
  } catch (error) {
    next(error);
  }
};

// Get task statistics
export const getTaskStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, dateFrom, dateTo } = req.query;
    
    const dateRange = dateFrom && dateTo
      ? {
          from: new Date(dateFrom as string),
          to: new Date(dateTo as string),
        }
      : undefined;

    const statistics = await taskService.getTaskStatistics(
      userId as string,
      dateRange
    );

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

// Get my task statistics
export const getMyTaskStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { dateFrom, dateTo } = req.query;
    
    const dateRange = dateFrom && dateTo
      ? {
          from: new Date(dateFrom as string),
          to: new Date(dateTo as string),
        }
      : undefined;

    const statistics = await taskService.getTaskStatistics(userId, dateRange);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

// Get upcoming tasks
export const getUpcomingTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { days = 7 } = req.query;
    
    const tasks = await taskService.getUpcomingTasks(userId, Number(days));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get subtasks
export const getSubtasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await taskService.getTasks(
      { parentTaskId: id },
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Process task reminders (for cron job)
export const processTaskReminders = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await taskService.processTaskReminders();
    
    res.json({
      success: true,
      message: 'Task reminders processed',
    });
  } catch (error) {
    logger.error('Error processing task reminders:', error);
    next(error);
  }
};