/**
 * Common type definitions to replace 'any' types throughout the codebase
 * This file provides type safety improvements for the entire application
 */

import { Prisma } from '@prisma/client';

// ============================================
// Database Query Types
// ============================================

/**
 * Generic query options for database operations
 */
export interface QueryOptions {
  where?: WhereClause;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  skip?: number;
  take?: number;
}

/**
 * Where clause for database queries
 */
export type WhereClause = Record<string, unknown>;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================
// Filter Types
// ============================================

/**
 * Base filter interface for list queries
 */
export interface BaseFilter {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Company filter options
 */
export interface CompanyFilter extends BaseFilter {
  industry?: string;
  size?: number;
  segment?: string;
  healthScore?: number;
  riskLevel?: string;
}

/**
 * Lead filter options
 */
export interface LeadFilter extends BaseFilter {
  status?: string;
  source?: string;
  assignedToId?: string;
  assignedTeamId?: string;
  bantScore?: number;
}

/**
 * Opportunity filter options
 */
export interface OpportunityFilter extends BaseFilter {
  companyId?: string;
  stage?: string;
  type?: string;
  accountManagerId?: string;
  salesTeamId?: string;
  minAmount?: number;
  maxAmount?: number;
  expectedCloseDateFrom?: string;
  expectedCloseDateTo?: string;
}

/**
 * Contact filter options
 */
export interface ContactFilter extends BaseFilter {
  companyId?: string;
  branchId?: string;
  roleType?: string;
  isActive?: boolean;
}

/**
 * Pipeline analytics filter options
 */
export interface PipelineAnalyticsFilter {
  salesTeamId?: string;
  accountManagerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// Data Transfer Objects (DTOs)
// ============================================

/**
 * Company creation DTO
 */
export interface CreateCompanyDto {
  name: string;
  registrationNumber?: string;
  industryId?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  size?: number;
  annualRevenue?: number;
  description?: string;
}

/**
 * Company update DTO
 */
export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {
  segment?: string;
  healthScore?: number;
  riskLevel?: string;
  churnRisk?: number;
  lifetimeValue?: number;
}

/**
 * Lead creation DTO
 */
export interface CreateLeadDto {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source: string;
  status: string;
  estimatedValue?: number;
  description?: string;
  assignedToId?: string;
  assignedTeamId?: string;
}

/**
 * Lead update DTO
 */
export interface UpdateLeadDto extends Partial<CreateLeadDto> {
  bantScore?: number;
  convertedToOpportunityId?: string;
}

/**
 * Opportunity creation DTO
 */
export interface CreateOpportunityDto {
  name: string;
  companyId: string;
  stage: string;
  type: string;
  amount?: number;
  probability?: number;
  expectedCloseDate?: Date | string;
  description?: string;
  accountManagerId?: string;
  salesTeamId?: string;
}

/**
 * Opportunity update DTO
 */
export interface UpdateOpportunityDto extends Partial<CreateOpportunityDto> {
  closedAt?: Date | string;
  closedReason?: string;
}

/**
 * Contact creation DTO
 */
export interface CreateContactDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  companyId: string;
  branchId?: string;
  roleType?: string;
  position?: string;
  department?: string;
  isActive?: boolean;
}

/**
 * Contact update DTO
 */
export interface UpdateContactDto extends Partial<CreateContactDto> {
  preferences?: string;
  lastContactedAt?: Date | string;
}

// ============================================
// Service Response Types
// ============================================

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * Service operation result
 */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error | string;
}

// ============================================
// Analytics Types
// ============================================

/**
 * Company analytics data
 */
export interface CompanyAnalytics {
  id: string;
  name: string;
  segment?: string;
  healthScore?: number;
  churnRisk?: number;
  riskLevel?: string;
  lifetimeValue?: number;
  engagementScore?: number;
  satisfactionScore?: number;
  lastHealthCheck?: Date | string;
}

/**
 * Pipeline analytics data
 */
export interface PipelineAnalytics {
  totalOpportunities: number;
  totalValue: number;
  averageDealSize: number;
  conversionRate: number;
  averageSalesCycle: number;
  stageDistribution: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}

/**
 * Customer 360 view data
 */
export interface Customer360View {
  company: {
    id: string;
    name: string;
    industry?: string;
    segment?: string;
    healthScore?: number;
    lifetimeValue?: number;
  };
  contacts: Array<{
    id: string;
    name: string;
    role?: string;
    email: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amount?: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    startTime: Date | string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date | string;
  }>;
  metrics: {
    totalRevenue: number;
    activeOpportunities: number;
    completedProjects: number;
    upcomingMeetings: number;
    lastActivity?: Date | string;
  };
}

// ============================================
// Authentication & Authorization Types
// ============================================

/**
 * User payload in JWT token
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  userTier?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated user context
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  userTier?: string;
}

// ============================================
// Meeting & Activity Types
// ============================================

/**
 * Meeting creation DTO
 */
export interface CreateMeetingDto {
  title: string;
  type: string;
  companyId?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  description?: string;
  attendees?: string[];
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  userId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
}

// ============================================
// Error Types
// ============================================

/**
 * Application error structure
 */
export interface AppError {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}

// ============================================
// Utility Types
// ============================================

/**
 * Make all properties optional except the specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make specified properties optional
 */
export type PartialOnly<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract non-nullable type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================
// Enum Types (matching Prisma schema)
// ============================================

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export enum OpportunityStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST'
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

export enum CustomerTier {
  VIP = 'VIP',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BRONZE = 'BRONZE',
  BASIC = 'BASIC'
}