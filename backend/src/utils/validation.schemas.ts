import { z } from 'zod';

// Common validation patterns
const patterns = {
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[0-9\-\+\(\)\s]+$/, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format'),
  uuid: z.string().uuid('Invalid UUID format'),
  date: z.string().datetime('Invalid date format'),
  alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed'),
  noSpecialChars: z.string().regex(/^[a-zA-Z0-9\s\-\_]+$/, 'Special characters not allowed'),
};

// Password validation with detailed requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

// User registration schema
export const userRegistrationSchema = z.object({
  email: patterns.email,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s\-']+$/, 'Invalid name format'),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s\-']+$/, 'Invalid name format'),
  phone: patterns.phone.optional(),
  departmentId: patterns.uuid.optional(),
  teamId: patterns.uuid.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User login schema
export const userLoginSchema = z.object({
  email: patterns.email,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Company schema
export const companySchema = z.object({
  code: z.string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9\-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  name: z.string().min(1).max(200),
  businessNumber: z.string()
    .regex(/^[0-9\-]+$/, 'Invalid business number format')
    .optional(),
  representative: z.string().max(100).optional(),
  industryId: patterns.uuid.optional(),
  companySize: z.enum(['STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE']).optional(),
  annualRevenue: z.number().positive().optional(),
  employeeCount: z.number().int().positive().optional(),
  website: patterns.url.optional(),
  description: z.string().max(1000).optional(),
  tier: z.enum(['VIP', 'GOLD', 'SILVER', 'BRONZE']).optional(),
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED']).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

// Contact schema
export const contactSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  email: patterns.email.optional(),
  phone: patterns.phone.optional(),
  mobile: patterns.phone.optional(),
  isPrimary: z.boolean().optional(),
  birthDate: patterns.date.optional(),
  preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'MOBILE']).optional(),
  newsletter: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  branchId: patterns.uuid.optional(),
});

// Lead schema
export const leadSchema = z.object({
  code: z.string().min(1).max(20),
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(100).optional(),
  email: patterns.email.optional(),
  phone: patterns.phone.optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EXHIBITION', 'SOCIAL_MEDIA', 'OTHER']).optional(),
  sourceDetail: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  assignedToId: patterns.uuid.optional(),
  assignedTeamId: patterns.uuid.optional(),
});

// Opportunity schema
export const opportunitySchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  companyId: patterns.uuid,
  branchId: patterns.uuid.optional(),
  contactId: patterns.uuid.optional(),
  type: z.enum(['NEW_BUSINESS', 'RENEWAL', 'UPSELL', 'CROSSSELL']).optional(),
  stage: z.enum([
    'QUALIFYING',
    'NEEDS_ANALYSIS',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST'
  ]).optional(),
  probability: z.number().min(0).max(100).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  expectedCloseDate: patterns.date.optional(),
  competitorInfo: z.string().max(500).optional(),
  nextAction: z.string().max(200).optional(),
  nextActionDate: patterns.date.optional(),
  tags: z.array(z.string()).optional(),
});

// Project schema
export const projectSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  companyId: patterns.uuid,
  opportunityId: patterns.uuid.optional(),
  type: z.enum(['FIXED_PRICE', 'TIME_MATERIAL', 'RETAINER', 'MILESTONE']).optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: patterns.date.optional(),
  endDate: patterns.date.optional(),
  budget: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  projectManagerId: patterns.uuid.optional(),
  teamId: patterns.uuid.optional(),
});

// Task schema
export const taskSchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  projectId: patterns.uuid,
  milestoneId: patterns.uuid.optional(),
  assignedToId: patterns.uuid.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  dueDate: patterns.date.optional(),
  tags: z.array(z.string()).optional(),
});

// Meeting schema
export const meetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['INTERNAL', 'CLIENT', 'SALES', 'PROJECT', 'OTHER']).optional(),
  location: z.string().max(200).optional(),
  meetingUrl: patterns.url.optional(),
  startTime: patterns.date,
  endTime: patterns.date,
  isAllDay: z.boolean().optional(),
  companyId: patterns.uuid.optional(),
  contactId: patterns.uuid.optional(),
  opportunityId: patterns.uuid.optional(),
  projectId: patterns.uuid.optional(),
  organizerId: patterns.uuid,
  attendees: z.array(patterns.uuid).optional(),
  reminder: z.number().optional(), // minutes before
});

// Activity schema
export const activitySchema = z.object({
  entityType: z.enum(['COMPANY', 'CONTACT', 'LEAD', 'OPPORTUNITY', 'PROJECT']),
  entityId: patterns.uuid,
  activityType: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']),
  subject: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: patterns.date,
  endTime: patterns.date.optional(),
  outcome: z.string().max(500).optional(),
  nextAction: z.string().max(200).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  fields: z.array(z.string()).optional(),
  exact: z.boolean().optional(),
});

// Date range schema
export const dateRangeSchema = z.object({
  from: patterns.date,
  to: patterns.date,
}).refine((data) => new Date(data.from) <= new Date(data.to), {
  message: "From date must be before or equal to To date",
  path: ["to"],
});

// File upload schema
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
});

// Batch operation schema
export const batchOperationSchema = z.object({
  ids: z.array(patterns.uuid).min(1).max(100),
  operation: z.enum(['delete', 'archive', 'restore', 'assign']),
  params: z.record(z.any()).optional(),
});

// Export schema
export const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'json']),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  dateRange: dateRangeSchema.optional(),
});

// Helper function to validate data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    throw new ValidationError('Validation failed', errors);
  }
  
  return result.data;
};

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export default {
  patterns,
  schemas: {
    password: passwordSchema,
    userRegistration: userRegistrationSchema,
    userLogin: userLoginSchema,
    company: companySchema,
    contact: contactSchema,
    lead: leadSchema,
    opportunity: opportunitySchema,
    project: projectSchema,
    task: taskSchema,
    meeting: meetingSchema,
    activity: activitySchema,
    pagination: paginationSchema,
    search: searchSchema,
    dateRange: dateRangeSchema,
    fileUpload: fileUploadSchema,
    batchOperation: batchOperationSchema,
    export: exportSchema,
  },
  validateData,
  ValidationError,
};