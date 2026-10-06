import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, AppError } from './middlewares/errorHandler';
import { standardApiLimiter } from './middlewares/rateLimiter';
import { apiRoutes } from './routes';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows audio streaming cross-origin
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    config.corsOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, audio tags)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev, can restrict in production
        }
      },
      credentials: true,
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'x-request-id']
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Structured Request Logging
  app.use(requestLogger);

  // Root Health Endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'music-api', timestamp: new Date().toISOString() });
  });

  // API Routes with rate limiting
  app.use('/api', standardApiLimiter, apiRoutes);

  // 404 Catch-All
  app.use((req, res, next) => {
    next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`, 'NOT_FOUND'));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
