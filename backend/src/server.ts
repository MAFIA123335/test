import { createApp } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase, prisma } from './config/prisma';
import { initDatabase } from './db/init';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  // Apply migrations + seed demo data on first boot (zero-config deploy).
  await initDatabase(prisma);
  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Beauty Center API running on http://localhost:${config.PORT}${config.API_PREFIX}`);
    logger.info(`   Environment: ${config.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if not closed within 10s.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection', reason));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
