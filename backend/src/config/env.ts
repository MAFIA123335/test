import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Centralised, validated environment configuration.
 * Fail fast at boot if anything required is missing.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Optional direct (non-pooled) connection used only for migrations.
  // Falls back to DATABASE_URL when omitted so a single URL is enough.
  DIRECT_URL: z.string().optional(),

  // Auto-run migrations + seed on boot (great for zero-config deploys).
  AUTO_MIGRATE: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),
  AUTO_SEED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),

  // Secrets are optional: if missing, safe random values are generated at boot
  // (fine for demos; set explicit secrets in production to keep sessions stable).
  JWT_ACCESS_SECRET: z.string().min(10).optional(),
  JWT_REFRESH_SECRET: z.string().min(10).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_RESET_SECRET: z.string().min(10).optional(),
  JWT_RESET_EXPIRES_IN: z.string().default('30m'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  CLIENT_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  COOKIE_SECRET: z.string().default('cookie_secret'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('beauty-center'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),

  LOG_LEVEL: z.string().default('info'),
  LOW_STOCK_THRESHOLD: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Generate strong random secrets when not provided (keeps zero-config demos working).
// A warning is logged in production so operators know sessions won't survive restarts.
import crypto from 'crypto';
const randomSecret = () => crypto.randomBytes(48).toString('hex');
const accessSecret = env.JWT_ACCESS_SECRET ?? randomSecret();
const refreshSecret = env.JWT_REFRESH_SECRET ?? randomSecret();
const resetSecret = env.JWT_RESET_SECRET ?? randomSecret();

if (env.NODE_ENV === 'production' && !env.JWT_ACCESS_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️  JWT secrets were auto-generated. Set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / JWT_RESET_SECRET ' +
      'in the environment to keep users logged in across restarts.',
  );
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  // Direct connection for migrations; falls back to the pooled URL.
  // Use || (not ??) so an empty DIRECT_URL="" also falls back to DATABASE_URL.
  directUrl: env.DIRECT_URL || env.DATABASE_URL,
  jwt: {
    accessSecret,
    refreshSecret,
    resetSecret,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    resetExpiresIn: env.JWT_RESET_EXPIRES_IN,
  },
  supabase: {
    url: env.SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
    enabled: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  },
} as const;

export type AppConfig = typeof config;
