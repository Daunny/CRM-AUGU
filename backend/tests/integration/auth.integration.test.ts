import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';

describe('Auth API Integration Tests', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Setup test database connection
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/crm_test';
    prisma = new PrismaClient();
    await prisma.$connect();
    
    // Create express app
    app = createApp();
  });

  afterAll(async () => {
    // Clean up
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.team.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        phone: '010-1234-5678',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        },
        message: 'Registration successful',
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(userData.email);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email'),
      });
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('password'),
      });
    });

    it('should return 400 for duplicate email', async () => {
      // Create existing user
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: hashedPassword,
          firstName: 'Existing',
          lastName: 'User',
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      const userData = {
        email: 'existing@example.com',
        password: 'NewPass123!',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email already registered',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: credentials.email,
            firstName: 'Test',
            lastName: 'User',
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify tokens are valid JWTs
      expect(response.body.data.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(response.body.data.refreshToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    it('should return 401 for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
      });
    });

    it('should return 401 for invalid password', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
      });
    });

    it('should increment failed login attempts on invalid password', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'WrongPassword123!',
      };

      // First failed attempt
      await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      // Check failed attempts count
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });
      expect(user?.failedLoginAttempts).toBe(1);

      // Second failed attempt
      await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      // Check failed attempts count again
      const userAfter = await prisma.user.findUnique({
        where: { email: credentials.email },
      });
      expect(userAfter?.failedLoginAttempts).toBe(2);
    });

    it('should reset failed attempts on successful login', async () => {
      // First, make some failed attempts
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Now login successfully
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPass123!',
        })
        .expect(200);

      // Check that failed attempts were reset
      const user = await prisma.user.findUnique({
        where: { email: 'testuser@example.com' },
      });
      expect(user?.failedLoginAttempts).toBe(0);
      expect(user?.lastLoginAt).toBeTruthy();
    });

    it('should return 401 for inactive user', async () => {
      // Create inactive user
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      await prisma.user.create({
        data: {
          email: 'inactive@example.com',
          password: hashedPassword,
          firstName: 'Inactive',
          lastName: 'User',
          isActive: false,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'TestPass123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Account is disabled',
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create user and get refresh token
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      const user = await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });
      userId = user.id;

      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPass123!',
        });
      
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: 'testuser@example.com',
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // New tokens should be different from old ones
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid refresh token',
      });
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('refreshToken'),
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and login
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPass123!',
        });
      
      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully',
      });

      // Verify tokens are blacklisted (would need Redis mock)
      // In real test, check if tokens are in Redis blacklist
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('token'),
      });
    });
  });

  describe('Protected routes', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and login to get access token
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPass123!',
        });
      
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('token'),
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });
  });
});