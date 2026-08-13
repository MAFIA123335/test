/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/db/seed';

// CLI entry point for `npm run seed` / `prisma db seed`.
const prisma = new PrismaClient();
seedDatabase(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
