import { Prisma, ProjectStatus, ProjectType, SessionStatus, ClassStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateProjectInput {
  code: string;
  name: string;
  description?: string;
  opportunityId?: string;
  companyId: string;
  branchId?: string;
  projectType?: ProjectType;
  startDate?: Date | string;
  endDate?: Date | string;
  contractAmount?: number;
  currency?: string;
  projectManagerId?: string;
  teamId?: string;
  objectives?: string;
  deliverables?: string;
  constraints?: string;
  assumptions?: string;
  risks?: string;
  customFields?: any;
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
  actualStartDate?: Date | string;
  actualEndDate?: Date | string;
  actualAmount?: number;
  completionRate?: number;
}

interface ProjectFilter {
  search?: string;
  companyId?: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
  projectManagerId?: string;
  teamId?: string;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
}

interface CreateSessionInput {
  projectId: string;
  sessionNumber: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  maxParticipants?: number;
  objectives?: string;
  instructorId?: string;
  coordinatorId?: string;
}

interface UpdateSessionInput extends Partial<Omit<CreateSessionInput, 'projectId' | 'sessionNumber'>> {
  status?: SessionStatus;
  actualStartDate?: Date | string;
  actualEndDate?: Date | string;
  actualParticipants?: number;
  completionNotes?: string;
}

interface CreateClassInput {
  sessionId: string;
  classNumber: number;
  name: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  room?: string;
  instructorId?: string;
  assistantId?: string;
  maxParticipants?: number;
  materials?: string[];
}

interface UpdateClassInput extends Partial<Omit<CreateClassInput, 'sessionId' | 'classNumber'>> {
  status?: ClassStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  actualParticipants?: number;
  attendanceRate?: number;
  feedback?: string;
}

interface AddProjectMemberInput {
  projectId: string;
  userId: string;
  role: string;
  responsibilities?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export class ProjectService {
  // Project CRUD
  async createProject(input: CreateProjectInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.project.findUnique({
      where: { code: input.code }
    });

    if (existing) {
      throw new ConflictError('Project code already exists');
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: input.companyId }
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Convert dates if needed
    if (input.startDate && typeof input.startDate === 'string') {
      input.startDate = new Date(input.startDate);
    }
    if (input.endDate && typeof input.endDate === 'string') {
      input.endDate = new Date(input.endDate);
    }

    const project = await prisma.project.create({
      data: {
        ...input,
        status: ProjectStatus.PLANNING,
        projectManagerId: input.projectManagerId || userId,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        },
        opportunity: {
          select: {
            id: true,
            code: true,
            title: true,
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Add project manager as a member
    if (input.projectManagerId || userId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: input.projectManagerId || userId,
          role: 'PROJECT_MANAGER',
          responsibilities: 'Overall project management and delivery',
          startDate: input.startDate as Date,
          createdBy: userId,
          updatedBy: userId,
        }
      });
    }

    // Update opportunity to WON if linked
    if (input.opportunityId) {
      await prisma.opportunity.update({
        where: { id: input.opportunityId },
        data: {
          stage: 'CLOSED_WON',
          closedAt: new Date(),
          wonAmount: input.contractAmount,
          updatedBy: userId,
        }
      });
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PROJECT_CREATED',
        subject: `Project ${project.code} created`,
        description: `New project "${project.name}" created for ${company.name}`,
        companyId: input.companyId,
        projectId: project.id,
        performedBy: userId,
        activityDate: new Date(),
        createdBy: userId,
        updatedBy: userId,
      }
    });

    return project;
  }

  async getProjects(filter: ProjectFilter, page: number = 1, limit: number = 20) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.projectType) {
      where.projectType = filter.projectType;
    }

    if (filter.projectManagerId) {
      where.projectManagerId = filter.projectManagerId;
    }

    if (filter.teamId) {
      where.teamId = filter.teamId;
    }

    if (filter.startDateFrom || filter.startDateTo) {
      where.startDate = {};
      if (filter.startDateFrom) {
        where.startDate.gte = new Date(filter.startDateFrom);
      }
      if (filter.startDateTo) {
        where.startDate.lte = new Date(filter.startDateTo);
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
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
          projectManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              trainingSessions: true,
              projectMembers: true,
              documents: true,
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { startDate: 'desc' }
        ],
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
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
        branch: {
          select: {
            id: true,
            name: true,
          }
        },
        opportunity: {
          select: {
            id: true,
            code: true,
            title: true,
            amount: true,
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        projectMembers: {
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
        trainingSessions: {
          orderBy: { sessionNumber: 'asc' },
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                specialties: true,
              }
            },
            coordinator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            },
            _count: {
              select: {
                trainingClasses: true,
              }
            }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            trainingSessions: true,
            projectMembers: true,
            documents: true,
            activities: true,
          }
        }
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }

  async updateProject(id: string, input: UpdateProjectInput, userId: string) {
    const existing = await prisma.project.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    // Check if new code conflicts
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.project.findUnique({
        where: { code: input.code }
      });
      if (codeExists) {
        throw new ConflictError('Project code already exists');
      }
    }

    // Convert dates if needed
    if (input.startDate && typeof input.startDate === 'string') {
      input.startDate = new Date(input.startDate);
    }
    if (input.endDate && typeof input.endDate === 'string') {
      input.endDate = new Date(input.endDate);
    }
    if (input.actualStartDate && typeof input.actualStartDate === 'string') {
      input.actualStartDate = new Date(input.actualStartDate);
    }
    if (input.actualEndDate && typeof input.actualEndDate === 'string') {
      input.actualEndDate = new Date(input.actualEndDate);
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Create activity log for status changes
    if (input.status && input.status !== existing.status) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          subject: `Project status changed: ${existing.status} → ${input.status}`,
          description: `Project ${project.code} status updated`,
          companyId: project.companyId,
          projectId: project.id,
          performedBy: userId,
          activityDate: new Date(),
          createdBy: userId,
          updatedBy: userId,
        }
      });
    }

    return project;
  }

  async deleteProject(id: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            trainingSessions: true,
            documents: true,
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.status === ProjectStatus.IN_PROGRESS || project.status === ProjectStatus.COMPLETED) {
      throw new ValidationError('Cannot delete project that is in progress or completed');
    }

    // Soft delete
    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });
  }

  // Training Session Management
  async createSession(input: CreateSessionInput, userId: string) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: input.projectId }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if session number already exists for this project
    const existingSession = await prisma.trainingSession.findUnique({
      where: {
        projectId_sessionNumber: {
          projectId: input.projectId,
          sessionNumber: input.sessionNumber,
        }
      }
    });

    if (existingSession) {
      throw new ConflictError('Session number already exists for this project');
    }

    // Convert dates if needed
    if (input.startDate && typeof input.startDate === 'string') {
      input.startDate = new Date(input.startDate);
    }
    if (input.endDate && typeof input.endDate === 'string') {
      input.endDate = new Date(input.endDate);
    }

    const session = await prisma.trainingSession.create({
      data: {
        ...input,
        status: SessionStatus.SCHEDULED,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        instructor: {
          select: {
            id: true,
            name: true,
          }
        },
        coordinator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return session;
  }

  async getSessions(projectId: string) {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      orderBy: { sessionNumber: 'asc' },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            specialties: true,
          }
        },
        coordinator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        trainingClasses: {
          orderBy: { classNumber: 'asc' },
        },
        _count: {
          select: {
            trainingClasses: true,
          }
        }
      }
    });

    return sessions;
  }

  async updateSession(id: string, input: UpdateSessionInput, userId: string) {
    const existing = await prisma.trainingSession.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Training session not found');
    }

    // Convert dates if needed
    if (input.startDate && typeof input.startDate === 'string') {
      input.startDate = new Date(input.startDate);
    }
    if (input.endDate && typeof input.endDate === 'string') {
      input.endDate = new Date(input.endDate);
    }
    if (input.actualStartDate && typeof input.actualStartDate === 'string') {
      input.actualStartDate = new Date(input.actualStartDate);
    }
    if (input.actualEndDate && typeof input.actualEndDate === 'string') {
      input.actualEndDate = new Date(input.actualEndDate);
    }

    const session = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          }
        },
        coordinator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return session;
  }

  // Training Class Management
  async createClass(input: CreateClassInput, userId: string) {
    // Verify session exists
    const session = await prisma.trainingSession.findUnique({
      where: { id: input.sessionId }
    });

    if (!session) {
      throw new NotFoundError('Training session not found');
    }

    // Check if class number already exists for this session
    const existingClass = await prisma.trainingClass.findUnique({
      where: {
        sessionId_classNumber: {
          sessionId: input.sessionId,
          classNumber: input.classNumber,
        }
      }
    });

    if (existingClass) {
      throw new ConflictError('Class number already exists for this session');
    }

    // Convert date if needed
    if (input.date && typeof input.date === 'string') {
      input.date = new Date(input.date);
    }

    const trainingClass = await prisma.trainingClass.create({
      data: {
        ...input,
        status: ClassStatus.SCHEDULED,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
            name: true,
          }
        },
        instructor: {
          select: {
            id: true,
            name: true,
          }
        },
        assistant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return trainingClass;
  }

  async getClasses(sessionId: string) {
    const classes = await prisma.trainingClass.findMany({
      where: {
        sessionId,
        deletedAt: null,
      },
      orderBy: { classNumber: 'asc' },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            specialties: true,
          }
        },
        assistant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return classes;
  }

  async updateClass(id: string, input: UpdateClassInput, userId: string) {
    const existing = await prisma.trainingClass.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Training class not found');
    }

    // Convert date if needed
    if (input.date && typeof input.date === 'string') {
      input.date = new Date(input.date);
    }

    const trainingClass = await prisma.trainingClass.update({
      where: { id },
      data: {
        ...input,
        updatedBy: userId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          }
        },
        assistant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return trainingClass;
  }

  // Project Member Management
  async addProjectMember(input: AddProjectMemberInput, userId: string) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: input.projectId }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if member already exists
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: input.userId,
        }
      }
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this project');
    }

    // Convert dates if needed
    if (input.startDate && typeof input.startDate === 'string') {
      input.startDate = new Date(input.startDate);
    }
    if (input.endDate && typeof input.endDate === 'string') {
      input.endDate = new Date(input.endDate);
    }

    const member = await prisma.projectMember.create({
      data: {
        ...input,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          }
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        }
      }
    });

    return member;
  }

  async getProjectMembers(projectId: string) {
    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    return members;
  }

  async removeProjectMember(projectId: string, userId: string, removedBy: string) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        }
      }
    });

    if (!member) {
      throw new NotFoundError('Project member not found');
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        }
      }
    });

    return { success: true, message: 'Project member removed successfully' };
  }
}

export const projectService = new ProjectService();