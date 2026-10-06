import rateLimit from 'express-rate-limit';

// Standard API rate limiter (300 requests per 15 minutes per IP)
export const standardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

// Audio streaming limiter with higher threshold to allow frequent chunk requests
export const audioStreamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200, // 200 chunk range requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'STREAM_RATE_LIMIT_EXCEEDED',
      message: 'Too many streaming requests, please slow down.'
    }
  }
});
