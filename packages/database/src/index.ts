import { PrismaClient } from '@prisma/client';
import { getConfig } from '@openpos/config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const config = getConfig();

  return new PrismaClient({
    log:
      config.nodeEnv === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

const config = getConfig();
if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export type { Prisma } from '@prisma/client';
