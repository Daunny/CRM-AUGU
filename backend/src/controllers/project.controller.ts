import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { AuthRequest } from '../middlewares/auth';

// Project Controllers
export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await projectService.createProject(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: project,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      companyId,
      status,
      projectType,
      projectManagerId,
      teamId,
      startDateFrom,
      startDateTo,
    } = req.query;

    const filter = {
      search: search as string,
      companyId: companyId as string,
      status: status as any,
      projectType: projectType as any,
      projectManagerId: projectManagerId as string,
      teamId: teamId as string,
      startDateFrom: startDateFrom as string,
      startDateTo: startDateTo as string,
    };

    const result = await projectService.getProjects(
      filter,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);

    res.json({
      success: true,
      data: project,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectService.updateProject(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: project,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await projectService.deleteProject(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Project deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Training Session Controllers
export const createSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await projectService.createSession(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: session,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const sessions = await projectService.getSessions(projectId);

    res.json({
      success: true,
      data: sessions,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const session = await projectService.updateSession(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: session,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Training Class Controllers
export const createClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const trainingClass = await projectService.createClass(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: trainingClass,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const classes = await projectService.getClasses(sessionId);

    res.json({
      success: true,
      data: classes,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const trainingClass = await projectService.updateClass(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: trainingClass,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Project Member Controllers
export const addProjectMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const member = await projectService.addProjectMember(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: member,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const members = await projectService.getProjectMembers(projectId);

    res.json({
      success: true,
      data: members,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId, userId } = req.params;
    const result = await projectService.removeProjectMember(
      projectId,
      userId,
      req.user!.userId
    );

    res.json({
      success: true,
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Milestone Controllers
export const createMilestone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const milestone = await projectService.createMilestone(
      projectId,
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: milestone,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const milestone = await projectService.updateMilestone(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: milestone,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMilestone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await projectService.deleteMilestone(id);

    res.json({
      success: true,
      message: 'Milestone deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Risk Management Controllers
export const createProjectRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const risk = await projectService.createProjectRisk(projectId, req.body);

    res.status(201).json({
      success: true,
      data: risk,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const risk = await projectService.updateProjectRisk(id, req.body);

    res.json({
      success: true,
      data: risk,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Budget Management Controllers
export const createProjectBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const budget = await projectService.createProjectBudget(projectId, req.body);

    res.status(201).json({
      success: true,
      data: budget,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const budget = await projectService.updateProjectBudget(id, req.body);

    res.json({
      success: true,
      data: budget,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resource Management Controllers
export const allocateResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const resource = await projectService.allocateResource(projectId, req.body);

    res.status(201).json({
      success: true,
      data: resource,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateResourceAllocation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const resource = await projectService.updateResourceAllocation(id, req.body);

    res.json({
      success: true,
      data: resource,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const releaseResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const resource = await projectService.releaseResource(id);

    res.json({
      success: true,
      data: resource,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Deliverables Management Controllers
export const createDeliverable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const deliverable = await projectService.createDeliverable(projectId, req.body);

    res.status(201).json({
      success: true,
      data: deliverable,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliverable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deliverable = await projectService.updateDeliverable(id, req.body);

    res.json({
      success: true,
      data: deliverable,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};