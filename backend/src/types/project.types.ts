import {
  ProjectStatus,
  ProjectType,
  ProjectPhase,
  ProjectHealth,
  Priority,
  MilestoneStatus,
  DeliverableType,
  DeliverableStatus,
  RiskCategory,
  RiskLevel,
  RiskStatus,
  BudgetCategory,
  ResourceType,
  ResourceStatus,
} from '@prisma/client';

// Project DTOs
export interface CreateProjectDto {
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
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  revenue?: number;
  projectManagerId?: string;
  coordinatorId?: string;
  operatorId?: string;
  milestones?: CreateMilestoneDto[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  phase?: ProjectPhase;
  health?: ProjectHealth;
  priority?: Priority;
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  budget?: number;
  actualCost?: number;
  revenue?: number;
  margin?: number;
  marginPercent?: number;
  progress?: number;
  projectManagerId?: string;
  coordinatorId?: string;
  operatorId?: string;
}

export interface UpdateProjectHealthDto {
  health: ProjectHealth;
  reason?: string;
}

// Milestone DTOs
export interface CreateMilestoneDto {
  name: string;
  description?: string;
  dueDate: Date;
  priority?: Priority;
  dependsOn?: string[];
  lagDays?: number;
}

export interface UpdateMilestoneDto {
  name?: string;
  description?: string;
  dueDate?: Date;
  status?: MilestoneStatus;
  progress?: number;
  priority?: Priority;
  completedAt?: Date;
}

// Project Member DTOs
export interface CreateProjectMemberDto {
  userId: string;
  role: string;
  allocation?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateProjectMemberDto {
  role?: string;
  allocation?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

// Risk Management DTOs
export interface CreateProjectRiskDto {
  title: string;
  description?: string;
  category: RiskCategory;
  probability: RiskLevel;
  impact: RiskLevel;
  mitigation?: string;
  owner?: string;
}

export interface UpdateProjectRiskDto {
  title?: string;
  description?: string;
  category?: RiskCategory;
  probability?: RiskLevel;
  impact?: RiskLevel;
  mitigation?: string;
  owner?: string;
  status?: RiskStatus;
  resolvedAt?: Date;
}

// Budget Management DTOs
export interface CreateProjectBudgetDto {
  category: BudgetCategory;
  description?: string;
  plannedAmount: number;
  actualAmount?: number;
  currency?: string;
}

export interface UpdateProjectBudgetDto {
  category?: BudgetCategory;
  description?: string;
  plannedAmount?: number;
  actualAmount?: number;
  currency?: string;
}

// Resource Management DTOs
export interface CreateProjectResourceDto {
  resourceType: ResourceType;
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  assignedFrom?: Date;
  assignedTo?: Date;
}

export interface UpdateProjectResourceDto {
  resourceType?: ResourceType;
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  status?: ResourceStatus;
  assignedFrom?: Date;
  assignedTo?: Date;
}

// Deliverable DTOs
export interface CreateProjectDeliverableDto {
  milestoneId?: string;
  name: string;
  description?: string;
  type: DeliverableType;
  dueDate?: Date;
}

export interface UpdateProjectDeliverableDto {
  milestoneId?: string;
  name?: string;
  description?: string;
  type?: DeliverableType;
  status?: DeliverableStatus;
  dueDate?: Date;
  deliveredAt?: Date;
  fileUrl?: string;
  notes?: string;
}

// Filter DTOs
export interface ProjectFilterDto {
  search?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  health?: ProjectHealth;
  priority?: Priority;
  companyId?: string;
  projectManagerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface MilestoneFilterDto {
  projectId?: string;
  status?: MilestoneStatus;
  priority?: Priority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

// Dashboard DTOs
export interface ProjectDashboardDto {
  project: any;
  taskStats: any;
  milestoneStats: any;
  budgetStats: any;
  riskStats: any;
  memberStats: any;
  timeline: any[];
  criticalPath: any[];
  burndownChart: any[];
}

export interface PortfolioDashboardDto {
  projects: any[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byHealth: Record<string, number>;
    byType: Record<string, number>;
    totalBudget: number;
    totalRevenue: number;
    averageProgress: number;
    atRisk: number;
    onTrack: number;
  };
  timeline: any[];
  resourceUtilization: any[];
}

// Response DTOs
export interface ProjectResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  type?: ProjectType;
  status: ProjectStatus;
  phase?: ProjectPhase;
  health?: ProjectHealth;
  priority: Priority;
  progress: number;
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  budget?: number;
  actualCost?: number;
  revenue?: number;
  margin?: number;
  marginPercent?: number;
  company: any;
  projectManager?: any;
  coordinator?: any;
  operator?: any;
  metrics?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface MilestoneResponseDto {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate: Date;
  status: MilestoneStatus;
  progress: number;
  priority: Priority;
  completedAt?: Date;
  deliverables?: any[];
  dependencies?: any[];
  createdAt: Date;
  updatedAt: Date;
}