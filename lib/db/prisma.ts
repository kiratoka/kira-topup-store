// lib/db/prisma.ts
import '@/lib/env';
import { PrismaClient, Prisma } from '@prisma/client';
import { dbLogger } from '@/lib/logging/logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production';

  const client = new PrismaClient({
    log: isProduction
      ? [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
  });

  client.$on('error' as never, (e: Prisma.LogEvent) => {
    dbLogger.error({ target: e.target, message: e.message }, 'Database error');
  });

  client.$on('warn' as never, (e: Prisma.LogEvent) => {
    dbLogger.warn({ target: e.target, message: e.message }, 'Database warning');
  });

  if (!isProduction) {
    client.$on('query' as never, (e: Prisma.QueryEvent) => {
      dbLogger.debug(
        {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        },
        'Database query'
      );
    });
  }

  return client;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
