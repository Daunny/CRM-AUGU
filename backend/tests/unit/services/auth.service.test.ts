import { authService } from '../../../src/services/auth.service';
import { prismaMock } from '../../setup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, UserTier } from '@prisma/client';
import { UnauthorizedError, ValidationError } from '../../../src/utils/errors';
import redisClient from '../../../src/config/redis';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '010-1234-5678',
      };

      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-123',
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        userTier: UserTier.STAFF,
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
        deletedAt: null,
        deletedBy: null,
        departmentId: null,
        teamId: null,
        position: null,
        lastLoginAt: null,
        failedLoginAttempts: 0,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await authService.register(input);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(input.password, 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ValidationError if email already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: input.email,
      } as any);

      await expect(authService.register(input)).rejects.toThrow(ValidationError);
      await expect(authService.register(input)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe',
      userTier: UserTier.STAFF,
      role: UserRole.USER,
      isActive: true,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
      deletedAt: null,
      deletedBy: null,
      departmentId: null,
      teamId: null,
      phone: null,
      position: null,
      lastLoginAt: null,
    };

    it('should successfully login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const accessToken = 'access.token.here';
      const refreshToken = 'refresh.token.here';

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
      });

      const result = await authService.login(credentials);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
        accessToken,
        refreshToken,
      });
    });

    it('should throw UnauthorizedError for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: mockUser.failedLoginAttempts + 1,
      });

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
      
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });
    });

    it('should throw UnauthorizedError for inactive user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      prismaMock.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('Account is disabled');
    });

    it('should throw UnauthorizedError for locked account', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const lockedUser = { ...mockUser, failedLoginAttempts: 5 };
      prismaMock.user.findUnique.mockResolvedValue(lockedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('Account is locked due to multiple failed login attempts');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid.refresh.token';
      const newAccessToken = 'new.access.token';
      const newRefreshToken = 'new.refresh.token';
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER,
        tier: UserTier.STAFF,
      };

      const mockUser = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        userTier: payload.tier,
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (redisClient.get as jest.Mock).mockResolvedValue(null); // Token not blacklisted
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(newAccessToken)
        .mockReturnValueOnce(newRefreshToken);

      const result = await authService.refreshToken(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(redisClient.get).toHaveBeenCalledWith(`blacklist:${refreshToken}`);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.userId },
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    it('should throw UnauthorizedError for blacklisted token', async () => {
      const refreshToken = 'blacklisted.token';
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER,
        tier: UserTier.STAFF,
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (redisClient.get as jest.Mock).mockResolvedValue('blacklisted');

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      const refreshToken = 'invalid.token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should successfully logout and blacklist tokens', async () => {
      const accessToken = 'access.token';
      const refreshToken = 'refresh.token';

      (redisClient.set as jest.Mock).mockResolvedValue('OK');

      await authService.logout(accessToken, refreshToken);

      expect(redisClient.set).toHaveBeenCalledTimes(2);
      expect(redisClient.set).toHaveBeenCalledWith(
        `blacklist:${accessToken}`,
        'true',
        expect.objectContaining({ EX: expect.any(Number) })
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        `blacklist:${refreshToken}`,
        'true',
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const validPasswords = [
        'Password123!',
        'SecureP@ss1',
        'MyP@ssw0rd',
        'Test123$Pass',
      ];

      validPasswords.forEach(password => {
        expect(() => authService.validatePassword(password)).not.toThrow();
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        { password: 'short', error: 'at least 8 characters' },
        { password: 'nouppercasehere1!', error: 'one uppercase letter' },
        { password: 'NOLOWERCASE123!', error: 'one lowercase letter' },
        { password: 'NoNumbers!', error: 'one number' },
        { password: 'NoSpecialChar1', error: 'one special character' },
        { password: '', error: 'at least 8 characters' },
      ];

      invalidPasswords.forEach(({ password, error }) => {
        expect(() => authService.validatePassword(password)).toThrow(ValidationError);
        expect(() => authService.validatePassword(password)).toThrow(error);
      });
    });
  });
});