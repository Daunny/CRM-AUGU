import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectSummary,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  createMilestone,
  getMilestones,
  updateMilestone,
  deleteMilestone,
} from '../controllers/project.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/summary', getProjectSummary);

// Task routes
router.post('/:projectId/tasks', createTask);
router.get('/:projectId/tasks', getTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Milestone routes
router.post('/:projectId/milestones', createMilestone);
router.get('/:projectId/milestones', getMilestones);
router.put('/milestones/:id', updateMilestone);
router.delete('/milestones/:id', deleteMilestone);

export default router;