import { z } from 'zod';

export const envSchema = z.object({
  MIDTRANS_SERVER_KEY: z.string().min(1, 'MIDTRANS_SERVER_KEY is required'),
  MIDTRANS_IS_PRODUCTION: z.string().min(1, 'MIDTRANS_IS_PRODUCTION is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.string().min(1, 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ');
  const prefix = parsed.error.issues.length === 1 ? 'Missing required env var' : 'Missing required env var(s)';
  throw new Error(`${prefix}: ${missing}`);
}

export const env = parsed.data;
