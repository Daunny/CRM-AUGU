import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  updateTaskProgress,
  deleteTask,
  bulkAssignTasks,
  addTaskComment,
  addTaskAttachment,
  createRecurringTasks,
  getTaskStatistics,
  getMyTaskStatistics,
  getUpcomingTasks,
  getSubtasks,
  processTaskReminders,
} from '../controllers/task.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Task CRUD
router.post('/', createTask);
router.get('/', getTasks);
router.get('/my-tasks', getMyTasks);
router.get('/upcoming', getUpcomingTasks);
router.get('/statistics', getTaskStatistics);
router.get('/my-statistics', getMyTaskStatistics);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/progress', updateTaskProgress);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteTask);

// Subtasks
router.get('/:id/subtasks', getSubtasks);

// Task operations
router.post('/bulk-assign', authorize('ADMIN', 'MANAGER'), bulkAssignTasks);
router.post('/:id/comments', addTaskComment);
router.post('/:id/attachments', addTaskAttachment);
router.post('/:id/recurring', createRecurringTasks);

// Admin operations
router.post('/process-reminders', authorize('ADMIN'), processTaskReminders);

export default router;