import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import logger from '../utils/logger';
import { JwtPayload } from '../types';

// Extended Request interface with user property
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * JWT 토큰 검증 미들웨어
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Check if token is about to expire (within 5 minutes)
      const now = Date.now() / 1000;
      const timeUntilExpiry = (decoded.exp || 0) - now;
      
      if (timeUntilExpiry < 300) { // 5 minutes
        res.setHeader('X-Token-Expiry-Warning', 'true');
      }
      
      // Attach user info to request
      req.user = decoded;
      
      logger.debug(`User ${decoded.email} authenticated successfully`);
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Please login again'
        });
        return;
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Authentication failed'
        });
        return;
      }
      
      throw jwtError;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Internal server error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    } catch {
      // Ignore token errors for optional auth
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Refresh token validation
 */
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
      return;
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as JwtPayload & { sessionId: string };
      
      (req as any).refreshTokenPayload = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
      return;
    }
  } catch (error) {
    logger.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Token validation error'
    });
  }
};