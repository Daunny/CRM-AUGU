import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'Registration successful'
    });
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    
    // Set refresh token as httpOnly cookie (optional)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user
   */
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const sessionId = req.body.sessionId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    await authService.logout(userId, sessionId);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from body or cookie
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
      return;
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      data: result,
      message: 'Token refreshed successfully'
    });
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    const user = await authService.getCurrentUser(userId);
    
    res.json({
      success: true,
      data: user
    });
  });

  /**
   * PUT /api/auth/change-password
   * Change user password
   */
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
      return;
    }
    
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
      return;
    }
    
    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * POST /api/auth/validate
   * Validate access token
   */
  validateToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    // If we reach here, token is valid (middleware already validated)
    res.json({
      success: true,
      data: {
        valid: true,
        user: req.user
      }
    });
  });

  /**
   * GET /api/auth/sessions
   * Get user sessions (admin only)
   */
  getUserSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId || req.user?.userId;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID required'
      });
      return;
    }
    
    // This would typically be an admin-only endpoint
    // Add role check here
    
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: sessions
    });
  });

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Revoke a specific session
   */
  revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId || !sessionId) {
      res.status(400).json({
        success: false,
        error: 'Invalid request'
      });
      return;
    }
    
    // Check if user owns the session or is admin
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }
    
    await prisma.session.delete({
      where: { id: sessionId }
    });
    
    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  });
}

export const authController = new AuthController();