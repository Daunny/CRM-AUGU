import { User } from '@prisma/client';

// Request & Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Auth Types
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  sessionId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  phone?: string;
}

// Extended User Type (without password)
export type SafeUser = Omit<User, 'password'>;

// Customer Types
export interface CreateCustomerRequest {
  companyName: string;
  industry?: string;
  size?: string;
  website?: string;
  accountManagerId?: string;
  status?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  lifecycleStage?: string;
  score?: number;
}

// Contact Types
export interface CreateContactRequest {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  isPrimary?: boolean;
}

// Opportunity Types
export interface CreateOpportunityRequest {
  customerId: string;
  contactId?: string;
  title: string;
  description?: string;
  stage?: string;
  amount?: number;
  probability?: number;
  expectedCloseDate?: Date;
}

// Project Types
export interface CreateProjectRequest {
  code: string;
  name: string;
  customerId: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  status?: string;
  priority?: string;
}

// Task Types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: Date;
  customerId?: string;
  opportunityId?: string;
  assignedToId: string;
}

// Activity Types
export interface CreateActivityRequest {
  type: string;
  subject: string;
  description?: string;
  customerId?: string;
  contactId?: string;
  opportunityId?: string;
  startTime: Date;
  endTime?: Date;
  outcome?: string;
  nextAction?: string;
}

// Filter Types
export interface CustomerFilter {
  status?: string;
  industry?: string;
  size?: string;
  accountManagerId?: string;
  search?: string;
}

export interface OpportunityFilter {
  stage?: string;
  status?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ProjectFilter {
  status?: string;
  customerId?: string;
  priority?: string;
  search?: string;
}

export interface TaskFilter {
  status?: string;
  priority?: string;
  assignedToId?: string;
  customerId?: string;
  opportunityId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

// Dashboard Types
export interface DashboardStats {
  totalCustomers: number;
  activeOpportunities: number;
  totalRevenue: number;
  conversionRate: number;
  activeProjects: number;
  pendingTasks: number;
}

export interface SalesPipeline {
  stage: string;
  count: number;
  value: number;
}

export interface RevenueMetrics {
  period: string;
  actual: number;
  target: number;
}

// Notification Types
export interface CreateNotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
}

// Error Types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(409, message);
  }
}