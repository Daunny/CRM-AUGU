import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment variables validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8080'),
  
  // Database
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  
  // Redis
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
  SESSION_SECRET: z.string().min(32).optional(),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // API Keys
  VALID_API_KEYS: z.string().optional(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

// Security configuration
export const securityConfig = {
  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    bcryptRounds: env.BCRYPT_ROUNDS,
  },
  
  // JWT Configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256' as const,
  },
  
  // Session Configuration
  session: {
    secret: env.SESSION_SECRET || env.JWT_SECRET,
    name: 'crm.sid',
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
  
  // CORS Configuration
  cors: {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    },
  },
  
  // File Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
    uploadDir: 'uploads/',
  },
  
  // API Keys
  apiKeys: env.VALID_API_KEYS?.split(',') || [],
  
  // Security Headers
  headers: {
    frameOptions: 'DENY',
    xssProtection: true,
    noSniff: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
  
  // Account Security
  account: {
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    passwordResetTokenExpiry: 60 * 60 * 1000, // 1 hour
    emailVerificationTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Data Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 64,
  },
};

// Helper functions
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

// Validate critical security settings
export const validateSecuritySettings = () => {
  const warnings: string[] = [];
  
  if (isDevelopment()) {
    warnings.push('Running in development mode - some security features may be relaxed');
  }
  
  if (env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    warnings.push('Using default JWT_SECRET - please change in production!');
  }
  
  if (!env.SESSION_SECRET) {
    warnings.push('SESSION_SECRET not set - using JWT_SECRET as fallback');
  }
  
  if (env.BCRYPT_ROUNDS < 10) {
    warnings.push('BCRYPT_ROUNDS is less than 10 - consider increasing for better security');
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Security warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  return warnings;
};

export default securityConfig;