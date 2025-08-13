import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Common validation schemas
export const schemas = {
  // ID validation
  id: Joi.string().uuid().required(),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // Auth
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    department: Joi.string().max(100),
    phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).max(20)
  }),
  
  // Customer
  createCustomer: Joi.object({
    companyName: Joi.string().min(2).max(200).required(),
    industry: Joi.string().max(100),
    size: Joi.string().valid('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'),
    website: Joi.string().uri(),
    accountManagerId: Joi.string().uuid(),
    status: Joi.string().valid('PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED')
  }),
  
  updateCustomer: Joi.object({
    companyName: Joi.string().min(2).max(200),
    industry: Joi.string().max(100),
    size: Joi.string().valid('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'),
    website: Joi.string().uri().allow(''),
    accountManagerId: Joi.string().uuid().allow(null),
    status: Joi.string().valid('PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED'),
    lifecycleStage: Joi.string().max(50),
    score: Joi.number().integer().min(0).max(100)
  }),
  
  // Contact
  createContact: Joi.object({
    customerId: Joi.string().uuid().required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).max(20),
    mobile: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).max(20),
    position: Joi.string().max(100),
    department: Joi.string().max(100),
    isPrimary: Joi.boolean()
  }),
  
  // Opportunity
  createOpportunity: Joi.object({
    customerId: Joi.string().uuid().required(),
    contactId: Joi.string().uuid(),
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000),
    stage: Joi.string().valid('QUALIFYING', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'),
    amount: Joi.number().positive(),
    probability: Joi.number().integer().min(0).max(100),
    expectedCloseDate: Joi.date().iso()
  }),
  
  // Project
  createProject: Joi.object({
    code: Joi.string().min(2).max(50).required(),
    name: Joi.string().min(2).max(200).required(),
    customerId: Joi.string().uuid().required(),
    description: Joi.string().max(2000),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    budget: Joi.number().positive(),
    status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
  }),
  
  // Task
  createTask: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(2000),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    dueDate: Joi.date().iso(),
    customerId: Joi.string().uuid(),
    opportunityId: Joi.string().uuid(),
    assignedToId: Joi.string().uuid().required()
  }),
  
  // Activity
  createActivity: Joi.object({
    type: Joi.string().valid('CALL', 'EMAIL', 'MEETING', 'DEMO', 'PROPOSAL', 'FOLLOW_UP', 'NOTE').required(),
    subject: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(2000),
    customerId: Joi.string().uuid(),
    contactId: Joi.string().uuid(),
    opportunityId: Joi.string().uuid(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')),
    outcome: Joi.string().max(500),
    nextAction: Joi.string().max(500)
  })
};

// Validation middleware factory
export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
      return;
    }
    
    next();
  };
};

// Validate query parameters
export const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        errors
      });
      return;
    }
    
    req.query = value;
    next();
  };
};

// Validate params
export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        errors
      });
      return;
    }
    
    next();
  };
};