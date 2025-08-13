import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} from '../utils/helpers';
import { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse,
  AuthenticationError,
  ConflictError,
  NotFoundError
} from '../types';
import logger from '../utils/logger';
import { cache } from '../config/redis';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          department: data.department,
          phone: data.phone,
          role: 'SALES_REP' // Default role
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          phone: true,
          createdAt: true
        }
      });

      logger.info(`New user registered: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user and generate tokens
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.password);
      
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const sessionId = uuidv4();
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId
      });

      // Save session
      await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Cache user session
      await cache.set(
        `session:${sessionId}`,
        JSON.stringify({ userId: user.id, role: user.role }),
        3600 // 1 hour
      );

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          phone: user.phone,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, sessionId?: string) {
    try {
      if (sessionId) {
        // Delete specific session
        await prisma.session.delete({
          where: { id: sessionId }
        });
        
        // Remove from cache
        await cache.del(`session:${sessionId}`);
      } else {
        // Delete all user sessions
        await prisma.session.deleteMany({
          where: { userId }
        });
      }

      logger.info(`User logged out: ${userId}`);
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find session
      const session = await prisma.session.findFirst({
        where: {
          refreshToken,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      });

      // Update session with new access token
      await prisma.session.update({
        where: { id: session.id },
        data: { token: newAccessToken }
      });

      logger.info(`Token refreshed for user: ${session.user.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken // Return same refresh token
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, user.password);
      
      if (!isPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Invalidate all sessions except current
      await prisma.session.deleteMany({
        where: {
          userId,
          id: {
            not: undefined // Keep current session
          }
        }
      });

      logger.info(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string) {
    try {
      // Check cache first
      const cachedSession = await cache.get(`session:${sessionId}`);
      
      if (cachedSession) {
        return JSON.parse(cachedSession);
      }

      // Check database
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!session) {
        return null;
      }

      // Cache session
      await cache.set(
        `session:${sessionId}`,
        JSON.stringify({
          userId: session.user.id,
          role: session.user.role
        }),
        3600
      );

      return session;
    } catch (error) {
      logger.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired sessions`);
      }

      return result;
    } catch (error) {
      logger.error('Session cleanup error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();