import { 
  Prisma, 
  ProjectStatus, 
  ProjectType, 
  ProjectPhase,
  ProjectHealth,
  SessionStatus, 
  ClassStatus,
  MilestoneStatus,
  DeliverableType,
  DeliverableStatus,
  RiskCategory,
  RiskLevel,
  RiskStatus,
  BudgetCategory,
  ResourceType,
  ResourceStatus,
  Priority
} from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { CacheService } from './cache.service';
import { EmailService } from './email.service';

const cacheService = new CacheService();
const emailService = new EmailService();

interface CreateProjectInput {
  code?: string;
  name: string;
  description?: string;
  type?: ProjectType;
  companyId: string;
  branchId?: string;
  opportunityId?: string;
  contractId?: string;
  status?: ProjectStatus;
  phase?: ProjectPhase;
  health?: ProjectHealth;
  priority?: Priority;
  startDate?: Date | string;
  endDate?: Date | string;
  budget?: number;
  revenue?: number;
  projectManagerId?: string;
  coordinatorId?: string;
  operatorId?: string;
  milestones?: CreateMilestoneInput[];
}

interface CreateMilestoneInput {
  name: string;
  description?: string;
  dueDate: Date | string;
  priority?: Priority;
  dependsOn?: string[];
  lagDays?: number;
}

interface UpdateMilestoneInput {
  name?: string;
  description?: string;
  dueDate?: Date | string;
  status?: MilestoneStatus;
  progress?: number;
  priority?: Priority;
  completedAt?: Date | string;
}

interface CreateProjectRiskInput {
  title: string;
  description?: string;
  category: RiskCategory;
  probability: RiskLevel;
  impact: RiskLevel;
  mitigation?: string;
  owner?: string;
}

interface CreateProjectBudgetInput {
  category: BudgetCategory;
  description?: string;
  plannedAmount: number;
  actualAmount?: number;
  currency?: string;
}

interface CreateProjectResourceInput {
  resourceType: ResourceType;
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  assignedFrom?: Date | string;
  assignedTo?: Date | string;
}

interface CreateProjectDeliverableInput {
  milestoneId?: string;
  name: string;
  description?: string;
  type: DeliverableType;
  dueDate?: Date | string;
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
  phase?: ProjectPhase;
  health?: ProjectHealth;
  actualStartDate?: Date | string;
  actualEndDate?: Date | string;
  actualCost?: number;
  progress?: number;
  margin?: number;
  marginPercent?: number;
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
    return await prisma.$transaction(async (tx) => {
      // Generate project code if not provided
      let code = input.code;
      if (!code) {
        const lastProject = await tx.project.findFirst({
          orderBy: { code: 'desc' },
        });
        const nextNumber = lastProject 
          ? parseInt(lastProject.code.replace('PRJ-', '')) + 1 
          : 1;
        code = `PRJ-${String(nextNumber).padStart(6, '0')}`;
      } else {
        // Check if code already exists
        const existing = await tx.project.findUnique({
          where: { code }
        });
        if (existing) {
          throw new ConflictError('Project code already exists');
        }
      }

      // Verify company exists
      const company = await tx.company.findUnique({
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

      const project = await tx.project.create({
        data: {
          code,
          name: input.name,
          description: input.description,
          type: input.type,
          companyId: input.companyId,
          branchId: input.branchId,
          opportunityId: input.opportunityId,
          contractId: input.contractId,
          status: input.status || ProjectStatus.PLANNING,
          phase: input.phase || 'INITIATION',
          health: input.health || 'GREEN',
          priority: input.priority || 'MEDIUM',
          startDate: input.startDate as Date,
          endDate: input.endDate as Date,
          budget: input.budget,
          revenue: input.revenue,
          projectManagerId: input.projectManagerId || userId,
          coordinatorId: input.coordinatorId,
          operatorId: input.operatorId,
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
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId: input.projectManagerId || userId,
            role: 'PROJECT_MANAGER',
            allocation: 100,
            startDate: input.startDate as Date,
            endDate: input.endDate as Date,
          }
        });
      }

      // Create initial milestones if provided
      if (input.milestones && input.milestones.length > 0) {
        await tx.milestone.createMany({
          data: input.milestones.map(milestone => ({
            projectId: project.id,
            name: milestone.name,
            description: milestone.description,
            dueDate: typeof milestone.dueDate === 'string' 
              ? new Date(milestone.dueDate) 
              : milestone.dueDate,
            priority: milestone.priority || 'MEDIUM',
            createdBy: userId,
          })),
        });
      }

      // Update opportunity to WON if linked
      if (input.opportunityId) {
        await tx.opportunity.update({
          where: { id: input.opportunityId },
          data: {
            stage: 'CLOSED_WON',
            closedAt: new Date(),
            wonAmount: input.revenue,
            updatedBy: userId,
          }
        });
      }

      // Send notification to project manager
      if (input.projectManagerId) {
        await emailService.sendProjectAssignmentNotification(
          input.projectManagerId,
          project
        );
      }

      // Invalidate cache
      await cacheService.invalidate('projects:*');

      return project;
    });
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

  // Milestone Management
  async createMilestone(projectId: string, input: CreateMilestoneInput, userId: string) {
    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name: input.name,
        description: input.description,
        dueDate: typeof input.dueDate === 'string' 
          ? new Date(input.dueDate) 
          : input.dueDate,
        priority: input.priority || 'MEDIUM',
        createdBy: userId,
      },
      include: {
        project: true,
      },
    });

    // Create dependencies if provided
    if (input.dependsOn && input.dependsOn.length > 0) {
      await prisma.milestoneDependency.createMany({
        data: input.dependsOn.map(depId => ({
          milestoneId: milestone.id,
          dependsOnId: depId,
          lagDays: input.lagDays || 0,
        })),
      });
    }

    await cacheService.invalidate(`project:${projectId}`);
    
    return milestone;
  }

  async updateMilestone(id: string, input: UpdateMilestoneInput, userId: string) {
    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...input,
        dueDate: input.dueDate && typeof input.dueDate === 'string' 
          ? new Date(input.dueDate) 
          : input.dueDate,
        completedAt: input.completedAt && typeof input.completedAt === 'string'
          ? new Date(input.completedAt)
          : input.completedAt,
        updatedBy: userId,
      },
      include: {
        project: true,
        deliverables: true,
      },
    });

    // Update project progress if milestone completed
    if (input.status === 'COMPLETED') {
      await this.updateProjectProgress(milestone.projectId);
    }

    await cacheService.invalidate(`project:${milestone.projectId}`);
    
    return milestone;
  }

  async deleteMilestone(id: string) {
    const milestone = await prisma.milestone.delete({
      where: { id },
    });

    await cacheService.invalidate(`project:${milestone.projectId}`);
    
    return milestone;
  }

  // Risk Management
  async createProjectRisk(projectId: string, input: CreateProjectRiskInput) {
    const risk = await prisma.projectRisk.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        category: input.category,
        probability: input.probability,
        impact: input.impact,
        score: this.calculateRiskScore(input.probability, input.impact),
        mitigation: input.mitigation,
        owner: input.owner,
      },
    });

    // Update project health if high risk
    if (risk.score && risk.score >= 15) {
      await this.updateProjectHealth(projectId, 'YELLOW');
    }

    await cacheService.invalidate(`project:${projectId}`);
    
    return risk;
  }

  async updateProjectRisk(id: string, input: any) {
    const risk = await prisma.projectRisk.update({
      where: { id },
      data: {
        ...input,
        score: input.probability && input.impact 
          ? this.calculateRiskScore(input.probability, input.impact)
          : undefined,
      },
    });

    await cacheService.invalidate(`project:${risk.projectId}`);
    
    return risk;
  }

  // Budget Management
  async createProjectBudget(projectId: string, input: CreateProjectBudgetInput) {
    const budget = await prisma.projectBudget.create({
      data: {
        projectId,
        category: input.category,
        description: input.description,
        plannedAmount: input.plannedAmount,
        actualAmount: input.actualAmount || 0,
        currency: input.currency || 'KRW',
      },
    });

    // Update project total budget
    await this.updateProjectTotalBudget(projectId);

    await cacheService.invalidate(`project:${projectId}`);
    
    return budget;
  }

  async updateProjectBudget(id: string, input: any) {
    const budget = await prisma.projectBudget.update({
      where: { id },
      data: input,
    });

    // Update project total budget and check overrun
    await this.updateProjectTotalBudget(budget.projectId);
    await this.checkBudgetOverrun(budget.projectId);

    await cacheService.invalidate(`project:${budget.projectId}`);
    
    return budget;
  }

  // Resource Management
  async allocateResource(projectId: string, input: CreateProjectResourceInput) {
    const resource = await prisma.projectResource.create({
      data: {
        projectId,
        resourceType: input.resourceType,
        name: input.name,
        description: input.description,
        quantity: input.quantity || 1,
        unit: input.unit,
        cost: input.cost,
        status: 'ALLOCATED',
        assignedFrom: input.assignedFrom && typeof input.assignedFrom === 'string'
          ? new Date(input.assignedFrom)
          : input.assignedFrom,
        assignedTo: input.assignedTo && typeof input.assignedTo === 'string'
          ? new Date(input.assignedTo)
          : input.assignedTo,
      },
    });

    await cacheService.invalidate(`project:${projectId}`);
    
    return resource;
  }

  async updateResourceAllocation(id: string, input: any) {
    const resource = await prisma.projectResource.update({
      where: { id },
      data: input,
    });

    await cacheService.invalidate(`project:${resource.projectId}`);
    
    return resource;
  }

  async releaseResource(id: string) {
    const resource = await prisma.projectResource.update({
      where: { id },
      data: {
        status: 'AVAILABLE',
        assignedTo: new Date(),
      },
    });

    await cacheService.invalidate(`project:${resource.projectId}`);
    
    return resource;
  }

  // Deliverables Management
  async createDeliverable(projectId: string, input: CreateProjectDeliverableInput) {
    const deliverable = await prisma.projectDeliverable.create({
      data: {
        projectId,
        milestoneId: input.milestoneId,
        name: input.name,
        description: input.description,
        type: input.type,
        dueDate: input.dueDate && typeof input.dueDate === 'string'
          ? new Date(input.dueDate)
          : input.dueDate,
      },
    });

    await cacheService.invalidate(`project:${projectId}`);
    
    return deliverable;
  }

  async updateDeliverable(id: string, input: any) {
    const deliverable = await prisma.projectDeliverable.update({
      where: { id },
      data: input,
    });

    // Update milestone progress if deliverable is delivered
    if (input.status === 'DELIVERED' && deliverable.milestoneId) {
      await this.updateMilestoneProgress(deliverable.milestoneId);
    }

    await cacheService.invalidate(`project:${deliverable.projectId}`);
    
    return deliverable;
  }

  // Helper Methods
  private calculateRiskScore(probability: string, impact: string): number {
    const levelScores: any = {
      VERY_LOW: 1,
      LOW: 2,
      MEDIUM: 3,
      HIGH: 4,
      VERY_HIGH: 5,
    };

    return levelScores[probability] * levelScores[impact];
  }

  private async updateProjectHealth(projectId: string, health: string) {
    await prisma.project.update({
      where: { id: projectId },
      data: { health: health as any },
    });
  }

  private async updateProjectProgress(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        tasks: true,
      },
    });

    if (!project) return;

    const completedMilestones = project.milestones.filter(
      m => m.status === 'COMPLETED'
    ).length;
    const totalMilestones = project.milestones.length;
    
    const completedTasks = project.tasks.filter(
      t => t.status === 'COMPLETED'
    ).length;
    const totalTasks = project.tasks.length;

    const milestoneProgress = totalMilestones > 0 
      ? (completedMilestones / totalMilestones) * 100
      : 0;
    
    const taskProgress = totalTasks > 0 
      ? (completedTasks / totalTasks) * 100
      : 0;

    const overallProgress = Math.round(
      (milestoneProgress * 0.6) + (taskProgress * 0.4)
    );

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: overallProgress },
    });
  }

  private async updateMilestoneProgress(milestoneId: string) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        deliverables: true,
      },
    });

    if (!milestone) return;

    const completedDeliverables = milestone.deliverables.filter(
      d => d.status === 'DELIVERED'
    ).length;
    const totalDeliverables = milestone.deliverables.length;
    
    const progress = totalDeliverables > 0 
      ? Math.round((completedDeliverables / totalDeliverables) * 100)
      : 0;

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { 
        progress,
        status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: progress === 100 ? new Date() : null,
      },
    });
  }

  private async updateProjectTotalBudget(projectId: string) {
    const budgets = await prisma.projectBudget.findMany({
      where: { projectId },
    });

    const totalPlanned = budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
    const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        budget: totalPlanned,
        actualCost: totalActual,
      },
    });
  }

  private async checkBudgetOverrun(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return;

    if (project.actualCost && project.budget && project.actualCost > project.budget) {
      // Update project health to yellow or red based on overrun percentage
      const overrunPercent = ((project.actualCost - project.budget) / project.budget) * 100;
      const health = overrunPercent > 20 ? 'RED' : 'YELLOW';
      
      await this.updateProjectHealth(projectId, health);
      
      // Send notification to project manager
      if (project.projectManagerId) {
        await emailService.sendBudgetOverrunAlert(
          project.projectManagerId,
          project,
          overrunPercent
        );
      }
    }
  }
}

export const projectService = new ProjectService();