import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './utils/env.js';
import { logger } from './utils/logger.js';
import prisma from './config/prisma.js';
import { notFound } from './middleware/not-found.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { registerRoutes } from './routes/index.js';
import { specs } from './docs/swagger.js';
import swaggerUi from 'swagger-ui-express';
import {
  apiRateLimiter,
  apiSlowDown,
} from './middleware/rate-limit.middleware.js';
import { securityHeaders } from './middleware/security.middleware.js';
import { requestTimeout } from './middleware/request-timeout.middleware.js';

const app = express();

app.use((req, res, next) => {
  logger.debug({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.use(helmet());
app.use(securityHeaders);

const corsOptions = {
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(requestTimeout);

app.get('/api/docs/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      env: env.NODE_ENV,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api', apiSlowDown);
app.use('/api', apiRateLimiter);

registerRoutes(app);

app.use(notFound);
app.use(errorHandler);

export default app;