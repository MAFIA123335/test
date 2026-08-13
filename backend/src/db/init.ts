/* eslint-disable no-console */
import { execFileSync } from 'child_process';
import path from 'path';
import { createRequire } from 'module';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { seedDatabase } from './seed';

/**
 * Resolves Prisma's CLI JS entry point so we can run it with `node` directly.
 * This avoids the Windows `.cmd` / shell issues that break execFileSync on the
 * `node_modules/.bin/prisma` shim, and works identically on Linux/macOS.
 */
function resolvePrismaCli(): string | null {
  try {
    const require = createRequire(__filename);
    const pkgPath = require.resolve('prisma/package.json');
    // prisma's package.json `bin` points at its CLI entry (e.g. "build/index.js").
    const pkg = require('prisma/package.json') as { bin?: Record<string, string> | string };
    const binRel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.prisma;
    if (!binRel) return null;
    return path.join(path.dirname(pkgPath), binRel);
  } catch {
    return null;
  }
}

/**
 * Runs `prisma migrate deploy` to bring the database schema up to date.
 * Uses DIRECT_URL (falls back to DATABASE_URL) so it works with pooled connections.
 * Best-effort: if the CLI can't be located we log and continue.
 */
function runMigrations(): void {
  const cli = resolvePrismaCli();
  if (!cli) {
    logger.error('⚠️  Could not locate Prisma CLI — skipping auto-migrate.');
    return;
  }
  logger.info('migrate deploy: applying database migrations...');
  // Prefer the direct URL for migrations, but never pass an empty string —
  // fall back to the pooled DATABASE_URL so the subprocess always has a valid URL.
  const migrateUrl = config.directUrl || config.DATABASE_URL;
  try {
    execFileSync(process.execPath, [cli, 'migrate', 'deploy'], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..', '..'),
      env: {
        ...process.env,
        // migrate deploy uses DATABASE_URL; point it at the direct connection.
        DATABASE_URL: migrateUrl,
      },
    });
    logger.info('✅ Migrations applied');
  } catch (err) {
    logger.error('⚠️  migrate deploy failed (continuing; schema may already exist)', err);
  }
}

/**
 * Seeds the database on first boot only. We detect "first boot" by checking
 * whether any users exist — if the table is empty we run the idempotent seed.
 */
async function autoSeedIfEmpty(prisma: PrismaClient): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      logger.info(`Seed skipped — database already has ${userCount} user(s).`);
      return;
    }
    logger.info('Database is empty — running initial seed...');
    await seedDatabase(prisma);
  } catch (err) {
    logger.error('⚠️  Auto-seed failed (continuing without demo data)', err);
  }
}

/**
 * One-call database initialisation used by the server bootstrap.
 * Controlled by AUTO_MIGRATE / AUTO_SEED env flags (both default to on).
 */
export async function initDatabase(prisma: PrismaClient): Promise<void> {
  if (config.AUTO_MIGRATE) {
    runMigrations();
  }
  if (config.AUTO_SEED) {
    await autoSeedIfEmpty(prisma);
  }
}
