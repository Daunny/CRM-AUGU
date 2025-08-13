import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.email
  });

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }

  // Handle Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: 'Duplicate entry',
          message: 'A record with this value already exists'
        });
        return;
      
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Record not found',
          message: 'The requested record does not exist'
        });
        return;
      
      case 'P2003':
        res.status(400).json({
          success: false,
          error: 'Foreign key constraint failed',
          message: 'Related record not found'
        });
        return;
      
      default:
        res.status(400).json({
          success: false,
          error: 'Database operation failed',
          message: prismaError.message
        });
        return;
    }
  }

  // Handle validation errors
  if (err.constructor.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: err.message
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Authentication failed'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Please login again'
    });
    return;
  }

  // Handle syntax errors (bad JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
    return;
  }

  // Default error response for unknown errors
  const statusCode = 'statusCode' in err 
    ? (err as any).statusCode 
    : 500;

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    message: 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Cannot ${req.method} ${req.url}`,
    path: req.url,
    method: req.method
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  // Log request
  logger.info(`Request: ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info(`Response: ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      user: (req as any).user?.email
    });
  });

  next();
};