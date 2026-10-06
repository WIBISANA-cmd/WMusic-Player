export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private service: string;

  constructor(service: string = 'music-api') {
    this.service = service;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, err?: Error): void {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      context
    };

    if (err) {
      payload.error = {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      };
    }

    const output = JSON.stringify(payload);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, err?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = err instanceof Error ? err : typeof err === 'string' ? new Error(err) : undefined;
    this.log('error', message, context, errorObj);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  }
}

export const logger = new StructuredLogger('music-api');
