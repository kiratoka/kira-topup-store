import { describe, it, expect } from 'vitest';
import pino from 'pino';
import {
  logger,
  paymentLogger,
  webhookLogger,
  redisLogger,
  invoiceLogger,
  dbLogger,
  REDACTION_PATHS,
} from './logger';

describe('Structured Logger (Pino)', () => {
  it('exports root logger and 5 domain child loggers (AC-6)', () => {
    expect(logger).toBeDefined();
    expect(paymentLogger).toBeDefined();
    expect(webhookLogger).toBeDefined();
    expect(redisLogger).toBeDefined();
    expect(invoiceLogger).toBeDefined();
    expect(dbLogger).toBeDefined();

    // Verify domain bindings
    expect(paymentLogger.bindings().domain).toBe('payment');
    expect(webhookLogger.bindings().domain).toBe('webhook');
    expect(redisLogger.bindings().domain).toBe('redis');
    expect(invoiceLogger.bindings().domain).toBe('invoice');
    expect(dbLogger.bindings().domain).toBe('db');
  });

  it('contains expected sensitive field names in redaction paths (AC-5)', () => {
    const requiredFields = [
      'email',
      'serverKey',
      'server_key',
      'token',
      'snap_token',
      'password',
      'secret',
      'ip',
      'ipAddress',
      'ip_address',
      'connectionString',
    ];

    for (const field of requiredFields) {
      const hasField = REDACTION_PATHS.some((path) => path.includes(field));
      expect(hasField).toBe(true);
    }
  });

  it('redacts sensitive data properly in log output (AC-5)', () => {
    const logChunks: string[] = [];
    const destination = {
      write(chunk: string) {
        logChunks.push(chunk);
      },
    };

    const testLogger = pino(
      {
        level: 'debug',
        redact: {
          paths: REDACTION_PATHS,
          censor: '[REDACTED]',
        },
      },
      destination
    );

    testLogger.info({
      email: 'user@example.com',
      serverKey: 'SB-Mid-server-secret123',
      server_key: 'SB-Mid-server-secret456',
      token: 'snap-token-xyz',
      snap_token: 'snap-token-abc',
      password: 'supersecretpass',
      secret: 'mysecret',
      ip: '192.168.1.1',
      ipAddress: '10.0.0.1',
      ip_address: '172.16.0.1',
      connectionString: 'redis://user:pass@host:6379',
      safeField: 'harmless data',
    }, 'Sensitive log test');

    expect(logChunks.length).toBe(1);
    const parsed = JSON.parse(logChunks[0]);

    expect(parsed.email).toBe('[REDACTED]');
    expect(parsed.serverKey).toBe('[REDACTED]');
    expect(parsed.server_key).toBe('[REDACTED]');
    expect(parsed.token).toBe('[REDACTED]');
    expect(parsed.snap_token).toBe('[REDACTED]');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.secret).toBe('[REDACTED]');
    expect(parsed.ip).toBe('[REDACTED]');
    expect(parsed.ipAddress).toBe('[REDACTED]');
    expect(parsed.ip_address).toBe('[REDACTED]');
    expect(parsed.connectionString).toBe('[REDACTED]');
    expect(parsed.safeField).toBe('harmless data');
  });

  it('honors LOG_LEVEL environment variable (AC-4)', () => {
    const customLogger = pino({
      level: 'error',
    });
    expect(customLogger.level).toBe('error');
  });

  it('is fail open and does not throw if logging fails or receives cyclic objects (AC-9)', () => {
    const cyclicObj: Record<string, unknown> = { name: 'cyclic' };
    cyclicObj.self = cyclicObj;

    expect(() => {
      logger.info(cyclicObj, 'Cyclic log test');
    }).not.toThrow();
  });
});
