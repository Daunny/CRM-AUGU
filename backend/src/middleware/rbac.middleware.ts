import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import logger from '../utils/logger';

// Define roles and their hierarchy
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', 
  SALES_REP = 'SALES_REP',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER'
}

// Role hierarchy - higher number means more privileges
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 80,
  [UserRole.SALES_REP]: 60,
  [UserRole.SUPPORT]: 40,
  [UserRole.VIEWER]: 20
};

// Permission definitions
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_ADMIN = 'user:admin',
  
  // Customer permissions
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_WRITE = 'customer:write',
  CUSTOMER_DELETE = 'customer:delete',
  
  // Opportunity permissions
  OPPORTUNITY_READ = 'opportunity:read',
  OPPORTUNITY_WRITE = 'opportunity:write',
  OPPORTUNITY_DELETE = 'opportunity:delete',
  
  // Project permissions
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  PROJECT_DELETE = 'project:delete',
  
  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  
  // System permissions
  SYSTEM_ADMIN = 'system:admin'
}

// Role-Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permission)
  ],
  
  [UserRole.MANAGER]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_WRITE,
    Permission.CUSTOMER_DELETE,
    Permission.OPPORTUNITY_READ,
    Permission.OPPORTUNITY_WRITE,
    Permission.OPPORTUNITY_DELETE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT
  ],
  
  [UserRole.SALES_REP]: [
    Permission.USER_READ,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_WRITE,
    Permission.OPPORTUNITY_READ,
    Permission.OPPORTUNITY_WRITE,
    Permission.PROJECT_READ,
    Permission.REPORT_VIEW
  ],
  
  [UserRole.SUPPORT]: [
    Permission.CUSTOMER_READ,
    Permission.OPPORTUNITY_READ,
    Permission.PROJECT_READ,
    Permission.REPORT_VIEW
  ],
  
  [UserRole.VIEWER]: [
    Permission.CUSTOMER_READ,
    Permission.OPPORTUNITY_READ,
    Permission.PROJECT_READ,
    Permission.REPORT_VIEW
  ]
};

/**
 * Check if user has required role
 */
export const requireRole = (requiredRole: UserRole | UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const userRole = req.user.role as UserRole;
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => {
        // Admin can access everything
        if (userRole === UserRole.ADMIN) return true;
        
        // Check exact match or higher privilege
        return roleHierarchy[userRole] >= roleHierarchy[role];
      });

      if (!hasRequiredRole) {
        logger.warn(`Access denied for user ${req.user.email}. Required role: ${requiredRoles.join(', ')}, User role: ${userRole}`);
        
        res.status(403).json({
          success: false,
          error: 'Insufficient privileges',
          message: `This action requires ${requiredRoles.join(' or ')} role`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error'
      });
    }
  };
};

/**
 * Check if user has required permission
 */
export const requirePermission = (requiredPermission: Permission | Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const userRole = req.user.role as UserRole;
      const userPermissions = rolePermissions[userRole] || [];
      const requiredPermissions = Array.isArray(requiredPermission) 
        ? requiredPermission 
        : [requiredPermission];
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn(`Permission denied for user ${req.user.email}. Required: ${requiredPermissions.join(', ')}`);
        
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: 'You do not have permission to perform this action'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error'
      });
    }
  };
};

/**
 * Check if user owns the resource or has admin privileges
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const userRole = req.user.role as UserRole;
      
      // Admins and Managers can access all resources
      if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
        next();
        return;
      }

      // Check ownership - compare user ID from token with resource owner ID
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!resourceUserId || resourceUserId !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error'
      });
    }
  };
};

/**
 * Get user permissions based on role
 */
export const getUserPermissions = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
};

/**
 * Check if role has specific permission
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};