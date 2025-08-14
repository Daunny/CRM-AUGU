import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Request ID middleware for tracking
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.headers['x-request-id'] as string || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

// Enhanced security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// Rate limiting configurations
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100,
  message: string = 'Too many requests from this IP, please try again later.'
) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // max 5 requests per window
  'Too many authentication attempts, please try again later.'
);

export const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // max 100 requests per window
  'API rate limit exceeded.'
);

export const uploadRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // max 10 uploads per hour
  'Upload limit exceeded, please try again later.'
);

// SQL Injection prevention (additional layer with Prisma)
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential SQL injection patterns
      return obj
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi, '')
        .replace(/[;'"\\]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// XSS Prevention
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\//g, "&#x2F;");
  };

  const sanitizeXss = (obj: any): any => {
    if (typeof obj === 'string') {
      return escapeHtml(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeXss);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeXss(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Only sanitize specific content types
  if (req.is('application/json') || req.is('application/x-www-form-urlencoded')) {
    req.body = sanitizeXss(req.body);
  }
  
  next();
};

// IP Whitelist/Blacklist
interface IPFilterOptions {
  whitelist?: string[];
  blacklist?: string[];
}

export const createIPFilter = (options: IPFilterOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress || '';
    
    // Check blacklist
    if (options.blacklist && options.blacklist.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }
    
    // Check whitelist (if defined, only whitelisted IPs are allowed)
    if (options.whitelist && options.whitelist.length > 0) {
      if (!options.whitelist.includes(clientIP)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }
    
    next();
  };
};

// Audit logging
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: (req as any).user?.userId,
      userAgent: req.headers['user-agent'],
      requestId: req.id,
    };
    
    // In production, send to logging service
    console.log('AUDIT:', JSON.stringify(log));
    
    next();
  };
};

// CSRF Protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req as any).session?.csrfToken;
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
    });
  }
  
  next();
};

// File upload security
export const fileUploadSecurity = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];
    
    for (const file of files.filter(Boolean)) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }
      
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        });
      }
      
      // Additional security: Check file extension matches MIME type
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      const expectedExts: Record<string, string[]> = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/gif': ['gif'],
        'application/pdf': ['pdf'],
      };
      
      if (ext && expectedExts[file.mimetype] && !expectedExts[file.mimetype].includes(ext)) {
        return res.status(400).json({
          success: false,
          error: 'File extension does not match file type',
        });
      }
    }
    
    next();
  };
};

// API Key authentication for external services
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
    });
  }
  
  // In production, validate against stored API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey as string)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
  }
  
  next();
};

// Content-Type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }
    
    const contentType = req.get('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        success: false,
        error: `Unsupported content type. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }
    
    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export default {
  requestId,
  securityHeaders,
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  sanitizeInput,
  xssProtection,
  createIPFilter,
  auditLog,
  csrfProtection,
  fileUploadSecurity,
  apiKeyAuth,
  validateContentType,
};