import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../config/database';
import { UserRole, UserTier } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  userTier: UserTier;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        role: true,
        userTier: true,
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      userTier: user.userTier,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const authorizeByTier = (...allowedTiers: UserTier[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!allowedTiers.includes(req.user.userTier)) {
      return next(new ForbiddenError('Insufficient tier level'));
    }

    next();
  };
};

// Check if user can access specific resource
export const authorizeResource = (
  resourceCheck: (req: AuthRequest) => Promise<boolean>
) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Not authenticated'));
      }

      const hasAccess = await resourceCheck(req);
      
      if (!hasAccess) {
        return next(new ForbiddenError('Access denied to this resource'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
