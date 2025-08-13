import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import leadRoutes from './routes/lead.routes';
import opportunityRoutes from './routes/opportunity.routes';
// import projectRoutes from './routes/project.routes';
// import meetingRoutes from './routes/meeting.routes';
// import kpiRoutes from './routes/kpi.routes';

export function createApp(): Application {
  const app: Application = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.app.env !== 'test') {
  app.use(morgan(config.app.env === 'development' ? 'dev' : 'combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/opportunities', opportunityRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/meetings', meetingRoutes);
// app.use('/api/kpi', kpiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
