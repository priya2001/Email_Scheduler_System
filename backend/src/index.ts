import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { environment } from './config/environment';
import { prismaClient, disconnectPrisma } from './config/database';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/logger';
import { errorHandler, AppError } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import emailRoutes from './routes/emails';
import { serverAdapter as bullBoardAdapter } from './bullmq/bullBoard';
import { createEmailWorker } from './workers/emailWorker';
import { emailQueue } from './queues/emailQueue';

const app = express();
const worker = createEmailWorker();

// ========================
// Middleware Setup
// ========================

// CORS configuration
app.use(cors({
  origin: environment.frontendUrl,
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use(requestLogger);

// ========================
// Routes
// ========================

// Health check routes
app.use('/', healthRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Email routes
app.use('/api/emails', emailRoutes);

// Bull Board dashboard
app.use('/admin/queues', bullBoardAdapter.getRouter());

// API routes will be added here
app.use('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Email Scheduler API v1',
    status: 'running',
  });
});

// ========================
// 404 Handler
// ========================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      status: 404,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ========================
// Error Handler (Must be last)
// ========================

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  errorHandler.handle(err, req, res, next);
});

// ========================
// Database Connection
// ========================

async function testDatabaseConnection(): Promise<void> {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database connection failed', error);
    // Don't exit - allow the server to keep running for health checks
    if (environment.nodeEnv === 'production') {
      logger.warn('Running in production mode but database connection failed');
    }
  }
}

// ========================
// Server Startup
// ========================

const PORT = environment.port;

const server = app.listen(PORT, async () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: environment.nodeEnv,
  });

  // Test database connection
  await testDatabaseConnection();
});

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} signal received: closing app services`);
  server.close(async () => {
    logger.info('HTTP server closed');

    await worker.close();
    await emailQueue.close();

    // Disconnect from database
    await disconnectPrisma();

    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

logger.info('BullMQ worker started', {
  queue: 'email-queue',
});

export default app;
