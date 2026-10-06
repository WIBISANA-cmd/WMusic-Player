import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@music/shared';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'APP_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = res.getHeader('x-request-id') as string | undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details: err.flatten()
      }
    };
    res.status(400).json(response);
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    logger.warn('Application Warning', {
      requestId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      url: req.originalUrl
    });

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected internal server errors
  logger.error('Unhandled Server Error', err, {
    requestId,
    url: req.originalUrl,
    method: req.method
  });

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    }
  };
  res.status(500).json(response);
}
