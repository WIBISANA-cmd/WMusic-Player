import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  mediaStoragePath: process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'media'),
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    bucket: process.env.S3_BUCKET || 'music-catalog',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    region: process.env.S3_REGION || 'us-east-1',
    isConfigured: Boolean(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY)
  },
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.pulse-music.internal/audio',
    tokenSecret: process.env.CDN_TOKEN_SECRET || 'pulse-media-secret-token',
    isConfigured: Boolean(process.env.CDN_BASE_URL)
  }
};
