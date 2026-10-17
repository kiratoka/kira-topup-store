import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPrismaConstructor = vi.fn();
const mockOn = vi.fn();

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor(options?: unknown) {
        mockPrismaConstructor(options);
      }
      $on = mockOn;
    },
    Prisma: {},
  };
});

const mockDbLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/lib/logging/logger', () => {
  return {
    dbLogger: mockDbLogger,
  };
});

describe('lib/db/prisma.ts logging and singleton configuration', () => {
  const globalObj = global as unknown as { prisma?: unknown };
  let eventHandlers: Record<string, (e: Record<string, unknown>) => void> = {};

  beforeEach(() => {
    vi.resetModules();
    mockPrismaConstructor.mockClear();
    mockOn.mockClear();
    mockDbLogger.error.mockClear();
    mockDbLogger.warn.mockClear();
    mockDbLogger.debug.mockClear();
    eventHandlers = {};
    mockOn.mockImplementation((event: string, handler: (e: Record<string, unknown>) => void) => {
      eventHandlers[event] = handler;
    });
    delete globalObj.prisma;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete globalObj.prisma;
  });

  it('configures error-only event logging piped to dbLogger in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { prisma } = await import('./prisma');

    expect(prisma).toBeDefined();
    expect(mockPrismaConstructor).toHaveBeenCalledWith({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // In production, query events must NOT be registered
    expect(eventHandlers['query']).toBeUndefined();
    expect(eventHandlers['error']).toBeDefined();
    expect(eventHandlers['warn']).toBeDefined();

    // Verify error routing to dbLogger
    eventHandlers['error']({ target: 'quaint::connector', message: 'connection timeout' });
    expect(mockDbLogger.error).toHaveBeenCalledWith(
      { target: 'quaint::connector', message: 'connection timeout' },
      'Database error'
    );

    // Verify warning routing to dbLogger
    eventHandlers['warn']({ target: 'pool', message: 'connection pool nearing capacity' });
    expect(mockDbLogger.warn).toHaveBeenCalledWith(
      { target: 'pool', message: 'connection pool nearing capacity' },
      'Database warning'
    );

    // In production, globalForPrisma.prisma should not be set
    expect(globalObj.prisma).toBeUndefined();
  });

  it('configures query and error event logging piped to dbLogger in development environment', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const { prisma } = await import('./prisma');

    expect(prisma).toBeDefined();
    expect(mockPrismaConstructor).toHaveBeenCalledWith({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // In development, query, error, and warn events must be registered
    expect(eventHandlers['query']).toBeDefined();
    expect(eventHandlers['error']).toBeDefined();
    expect(eventHandlers['warn']).toBeDefined();

    // Verify query routing with duration formatting to dbLogger.debug
    eventHandlers['query']({
      query: 'SELECT * FROM "Order" WHERE "id" = $1',
      params: '["order_123"]',
      duration: 18,
    });
    expect(mockDbLogger.debug).toHaveBeenCalledWith(
      {
        query: 'SELECT * FROM "Order" WHERE "id" = $1',
        params: '["order_123"]',
        duration: '18ms',
      },
      'Database query'
    );

    // In development, globalForPrisma.prisma should be cached
    expect(globalObj.prisma).toBe(prisma);
  });

  it('reuses existing global prisma instance if present', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const fakePrismaInstance = { fake: true };
    globalObj.prisma = fakePrismaInstance;

    const { prisma } = await import('./prisma');

    expect(prisma).toBe(fakePrismaInstance);
    expect(mockPrismaConstructor).not.toHaveBeenCalled();
    expect(mockOn).not.toHaveBeenCalled();
  });
});

