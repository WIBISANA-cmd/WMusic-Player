import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    // Skip verbose logs for health checks
    if (req.originalUrl === '/health') return;

    logger.info('HTTP Request Completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: parseFloat(durationMs),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
}
