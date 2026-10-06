import dotenv from 'dotenv';
import path from 'path';
import { validateEnv } from '../schemas/env.schema';

dotenv.config();

// Strict environment validation during startup
const parsedEnv = validateEnv(process.env);

export const config = {
  env: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  corsOrigin: parsedEnv.CORS_ORIGIN,
  activeProvider: parsedEnv.MEDIA_PROVIDER,
  mediaStoragePath: parsedEnv.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'media'),
  s3: {
    endpoint: parsedEnv.S3_ENDPOINT || 'http://localhost:9000',
    bucket: parsedEnv.S3_BUCKET || 'music-catalog',
    accessKey: parsedEnv.S3_ACCESS_KEY || '',
    secretKey: parsedEnv.S3_SECRET_KEY || '',
    region: parsedEnv.S3_REGION || 'us-east-1',
    isConfigured: Boolean(parsedEnv.S3_ACCESS_KEY && parsedEnv.S3_SECRET_KEY)
  },
  cdn: {
    baseUrl: parsedEnv.CDN_BASE_URL || 'https://cdn.pulse-music.internal/audio',
    tokenSecret: parsedEnv.CDN_TOKEN_SECRET || 'pulse-media-secret-token',
    isConfigured: Boolean(parsedEnv.CDN_BASE_URL)
  },
  youtube: {
    apiKey: parsedEnv.YOUTUBE_API_KEY || ''
  }
};
