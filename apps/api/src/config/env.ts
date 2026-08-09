import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/mahatest'),
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
  JWT_ACCESS_SECRET: z.string().min(32).default('dev-access-secret-change-me-32chars!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev-refresh-secret-change-me-32chars!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(32).default('dev-cookie-secret-change-me-32chars!!'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  APP_NAME: z.string().default('MahaTest'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('MahaTest <onboarding@resend.dev>'),
  UPLOAD_DIR: z.string().default('./uploads'),
  PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  NATS_URL: z.string().default('nats://127.0.0.1:4222'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
