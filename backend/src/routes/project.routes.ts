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
  createProjectRisk,
  updateProjectRisk,
  createProjectBudget,
  updateProjectBudget,
  allocateResource,
  updateResourceAllocation,
  releaseResource,
  createDeliverable,
  updateDeliverable,
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  createSession,
  getSessions,
  updateSession,
  createClass,
  getClasses,
  updateClass,
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

// Risk Management routes
router.post('/:projectId/risks', createProjectRisk);
router.put('/risks/:id', updateProjectRisk);

// Budget Management routes
router.post('/:projectId/budgets', createProjectBudget);
router.put('/budgets/:id', updateProjectBudget);

// Resource Management routes
router.post('/:projectId/resources', allocateResource);
router.put('/resources/:id', updateResourceAllocation);
router.delete('/resources/:id', releaseResource);

// Deliverables Management routes
router.post('/:projectId/deliverables', createDeliverable);
router.put('/deliverables/:id', updateDeliverable);

// Project Members routes
router.post('/members', addProjectMember);
router.get('/:projectId/members', getProjectMembers);
router.delete('/:projectId/members/:userId', removeProjectMember);

// Training Sessions routes
router.post('/sessions', createSession);
router.get('/:projectId/sessions', getSessions);
router.put('/sessions/:id', updateSession);

// Training Classes routes
router.post('/classes', createClass);
router.get('/sessions/:sessionId/classes', getClasses);
router.put('/classes/:id', updateClass);

export default router;