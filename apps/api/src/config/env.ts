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
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SERVICE: z.string().optional(),
  UPLOAD_DIR: z.string().default('./uploads'),
  PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  NATS_URL: z.string().default('nats://127.0.0.1:4222'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),

  // ── Seed accounts (auto-created/promoted on startup when set) ────────────────
  // Leaving these unset in production is fine — remove after first deploy.
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SUPER_ADMIN_NAME: z.string().min(2).default('Super Admin'),

  CONTENT_MANAGER_EMAIL: z.string().email().optional(),
  CONTENT_MANAGER_PASSWORD: z.string().min(8).optional(),
  CONTENT_MANAGER_NAME: z.string().min(2).default('Content Manager'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
