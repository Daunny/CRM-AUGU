import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Duplicate field value';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  console.error({
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    },
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.name,
      message,
      ...(config.app.env === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
};
