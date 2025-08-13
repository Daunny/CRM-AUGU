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