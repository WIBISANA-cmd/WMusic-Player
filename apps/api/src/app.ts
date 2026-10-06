import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { requestLogger, errorHandler, standardApiLimiter, AppError } from './middleware';
import { apiRoutes } from './routes';

export function createApp() {
  const app = express();

  // Trust reverse proxy (Nginx, Docker, Cloudflare, AWS ALB)
  app.set('trust proxy', 1);

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
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (same-origin, server-to-server, mobile curl)
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin) || config.env === 'development') {
          return callback(null, true);
        }
        return callback(
          new AppError(403, `Origin '${origin}' is not permitted by CORS policy`, 'CORS_ERROR')
        );
      },
      credentials: true,
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'x-request-id']
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Structured Request Logging with Pino
  app.use(requestLogger);

  // Root Health Endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'music-api',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Versioned API v1 Routes with rate limiting
  app.use('/api/v1', standardApiLimiter, apiRoutes);
  // Backward compatibility alias
  app.use('/api', standardApiLimiter, apiRoutes);

  // 404 Catch-All
  app.use((req, res, next) => {
    next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`, 'NOT_FOUND'));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
