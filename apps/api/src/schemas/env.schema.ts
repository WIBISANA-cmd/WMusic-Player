import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MEDIA_PROVIDER: z.enum(['local', 's3', 'cdn']).default('local'),
  MEDIA_STORAGE_PATH: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  CDN_BASE_URL: z.string().optional(),
  CDN_TOKEN_SECRET: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional()
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(processEnv: NodeJS.ProcessEnv): EnvConfig {
  const result = EnvSchema.safeParse(processEnv);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ FATAL: Invalid backend environment configuration:', JSON.stringify(formatted, null, 2));
    throw new Error('Environment variable validation failed during startup');
  }
  return result.data;
}

