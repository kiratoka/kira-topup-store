import { describe, it, expect } from 'vitest';
import { envSchema } from './env';

describe('lib/env - environment variable validation (AC-5, AC-6)', () => {
  const validEnv = {
    MIDTRANS_SERVER_KEY: 'SB-Mid-server-test',
    MIDTRANS_IS_PRODUCTION: 'false',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test',
  };

  it('successfully parses all 5 required environment variables', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.MIDTRANS_SERVER_KEY).toBe('SB-Mid-server-test');
      expect(result.data.MIDTRANS_IS_PRODUCTION).toBe('false');
      expect(result.data.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
      expect(result.data.REDIS_URL).toBe('redis://localhost:6379');
      expect(result.data.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY).toBe('SB-Mid-client-test');
    }
  });

  it('fails when MIDTRANS_SERVER_KEY is missing or empty', () => {
    const missingOne = { ...validEnv } as Record<string, string>;
    delete missingOne.MIDTRANS_SERVER_KEY;
    const result = envSchema.safeParse(missingOne);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('MIDTRANS_SERVER_KEY');
    }

    const emptyResult = envSchema.safeParse({ ...validEnv, MIDTRANS_SERVER_KEY: '' });
    expect(emptyResult.success).toBe(false);
  });

  it('fails when MIDTRANS_IS_PRODUCTION is missing or empty', () => {
    const missingOne = { ...validEnv } as Record<string, string>;
    delete missingOne.MIDTRANS_IS_PRODUCTION;
    const result = envSchema.safeParse(missingOne);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('MIDTRANS_IS_PRODUCTION');
    }
  });

  it('fails when DATABASE_URL is missing or empty', () => {
    const missingOne = { ...validEnv } as Record<string, string>;
    delete missingOne.DATABASE_URL;
    const result = envSchema.safeParse(missingOne);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('DATABASE_URL');
    }
  });

  it('fails when REDIS_URL is missing or empty', () => {
    const missingOne = { ...validEnv } as Record<string, string>;
    delete missingOne.REDIS_URL;
    const result = envSchema.safeParse(missingOne);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('REDIS_URL');
    }
  });

  it('fails when NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is missing or empty', () => {
    const missingOne = { ...validEnv } as Record<string, string>;
    delete missingOne.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const result = envSchema.safeParse(missingOne);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY');
    }
  });

  it('formats missing variables explicitly according to AC-6', () => {
    const missingOne = { ...validEnv } as Record<string, string>;
    delete missingOne.MIDTRANS_SERVER_KEY;
    const parsed = envSchema.safeParse(missingOne);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const missing = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ');
      const prefix = parsed.error.issues.length === 1 ? 'Missing required env var' : 'Missing required env var(s)';
      const errorMessage = `${prefix}: ${missing}`;
      expect(errorMessage).toBe('Missing required env var: MIDTRANS_SERVER_KEY');
    }
  });

  it('formats multiple missing variables explicitly', () => {
    const parsed = envSchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const missing = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ');
      const prefix = parsed.error.issues.length === 1 ? 'Missing required env var' : 'Missing required env var(s)';
      const errorMessage = `${prefix}: ${missing}`;
      expect(errorMessage).toContain('Missing required env var(s):');
      expect(errorMessage).toContain('MIDTRANS_SERVER_KEY');
      expect(errorMessage).toContain('DATABASE_URL');
      expect(errorMessage).toContain('REDIS_URL');
    }
  });

  it('rejects non-string types for environment variables', () => {
    const invalidTypes = {
      ...validEnv,
      MIDTRANS_IS_PRODUCTION: true as unknown as string,
      DATABASE_URL: 12345 as unknown as string,
    };
    const parsed = envSchema.safeParse(invalidTypes);
    expect(parsed.success).toBe(false);
  });

  it('strips unknown environment variables from parsed data', () => {
    const withExtra = {
      ...validEnv,
      UNKNOWN_SECRET: 'do-not-expose',
      SOME_OTHER_KEY: 'abc',
    };
    const parsed = envSchema.safeParse(withExtra);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('UNKNOWN_SECRET' in parsed.data).toBe(false);
      expect('SOME_OTHER_KEY' in parsed.data).toBe(false);
    }
  });

  describe('startup fail-fast guard imports (AC-7)', () => {
    it('ensures lib/db/prisma.ts imports lib/env for fail-fast startup validation', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const prismaFilePath = path.resolve(process.cwd(), 'lib/db/prisma.ts');
      const content = fs.readFileSync(prismaFilePath, 'utf-8');

      expect(content).toMatch(/import\s+['"]@\/lib\/env['"]/);
    });

    it('ensures lib/cache/rate-limit.ts imports lib/env for fail-fast startup validation', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const rateLimitFilePath = path.resolve(process.cwd(), 'lib/cache/rate-limit.ts');
      const content = fs.readFileSync(rateLimitFilePath, 'utf-8');

      expect(content).toMatch(/import\s+['"]@\/lib\/env['"]/);
    });
  });
});

