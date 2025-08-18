import Joi from 'joi';

// Pipeline metrics validation
export const pipelineMetricsSchema = Joi.object({
  query: Joi.object({
    salesTeamId: Joi.string().uuid().optional(),
    accountManagerId: Joi.string().uuid().optional(),
    companyId: Joi.string().uuid().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  }),
});

// Proposal analytics validation
export const proposalAnalyticsSchema = Joi.object({
  query: Joi.object({
    salesTeamId: Joi.string().uuid().optional(),
    accountManagerId: Joi.string().uuid().optional(),
    companyId: Joi.string().uuid().optional(),
    templateId: Joi.string().uuid().optional(),
    minAmount: Joi.number().min(0).optional(),
    maxAmount: Joi.number().min(Joi.ref('minAmount')).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  }),
});

// Sales forecast validation
export const salesForecastSchema = Joi.object({
  query: Joi.object({
    salesTeamId: Joi.string().uuid().optional(),
    accountManagerId: Joi.string().uuid().optional(),
    forecastPeriod: Joi.number().integer().min(1).max(12).default(3),
    confidenceLevel: Joi.number().min(0).max(100).default(70),
  }),
});

// Funnel analysis validation
export const funnelAnalysisSchema = Joi.object({
  query: Joi.object({
    salesTeamId: Joi.string().uuid().optional(),
    accountManagerId: Joi.string().uuid().optional(),
    companyId: Joi.string().uuid().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    includeDetails: Joi.boolean().default(false),
  }),
});

// Team performance validation
export const teamPerformanceSchema = Joi.object({
  query: Joi.object({
    salesTeamId: Joi.string().uuid().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    topPerformers: Joi.number().integer().min(1).max(100).default(10),
    includeInactive: Joi.boolean().default(false),
  }),
});