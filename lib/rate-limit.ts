// lib/rate-limit.ts
import '@/lib/env';
import { getRedis } from '@/lib/redis';

/**
 * Extracts client IP address from incoming request headers.
 *
 * Header precedence:
 * 1. `x-real-ip`: Set or overwritten by trusted reverse proxies (Nginx, Traefik, AWS ALB, Caddy, Vercel)
 *    representing the authentic client socket address.
 * 2. `cf-connecting-ip`: Set or overwritten by Cloudflare edge proxy.
 * 3. `x-forwarded-for`: Fallback taking the first comma-separated IP.
 *    NOTE: To prevent IP spoofing, upstream reverse proxies must sanitize or overwrite headers,
 *    or provide x-real-ip / cf-connecting-ip.
 *
 * Returns 'unknown' if no client IP headers are present.
 */
export function getClientIp(req: Request): string {
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp?.trim()) {
    return xRealIp.trim();
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded?.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

export async function rateLimit(
  ip: string,
  limit = 10,
  windowMs = 60000,
  keyPrefix = 'rate-limit'
): Promise<boolean> {
  try {
    const client = await getRedis();
    if (!client) {
      // Jika client Redis tidak dapat terhubung, jangan gagalkan alur pembayaran
      console.warn('[RateLimit] Redis tidak tersedia, permintaan diloloskan');
      return false;
    }

    const key = `${keyPrefix}:${ip}`;
    const count = await client.incr(key);

    if (count === 1) {
      const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
      await client.expire(key, ttlSeconds);
    }

    // Return true jika request melebihi limit
    return count > limit;
  } catch (error) {
    console.error('[RateLimit Error]', error);
    // Fail open: kembalikan false agar transaksi tidak terblokir saat terjadi kendala koneksi
    return false;
  }
}