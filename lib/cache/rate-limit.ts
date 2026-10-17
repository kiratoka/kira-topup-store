import '@/lib/env';
import { getRedis } from '@/lib/cache/redis';
import { redisLogger } from '@/lib/logging/logger';

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

/**
 * Lua script for atomic rate limiting.
 * Executes INCR and conditionally EXPIRE in a single atomic step inside Redis.
 *
 * Keys:
 * - KEYS[1]: rate limit key (e.g. `rate-limit:203.0.113.1`)
 *
 * Arguments:
 * - ARGV[1]: TTL in seconds
 *
 * Returns:
 * - current request count (integer)
 *
 * Atomicity guarantee:
 * - Redis executes Lua scripts atomically on a single thread.
 * - If key is newly created (count == 1), sets EXPIRE immediately.
 * - If key exists but has no TTL (TTL == -1 due to an earlier crash/anomaly), self-heals by setting EXPIRE.
 * - Does not reset existing TTL on subsequent requests (preserving fixed window semantics).
 */
export const RATE_LIMIT_LUA_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
else
    if redis.call('TTL', KEYS[1]) == -1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
end
return current
`.trim();

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
      redisLogger.warn('[RateLimit] Redis tidak tersedia, permintaan diloloskan');
      return false;
    }

    const key = `${keyPrefix}:${ip}`;
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    const result = await client.eval(RATE_LIMIT_LUA_SCRIPT, {
      keys: [key],
      arguments: [ttlSeconds.toString()],
    });

    const count = typeof result === 'number' ? result : Number(result) || 0;

    // Return true jika request melebihi limit
    return count > limit;
  } catch (error) {
    redisLogger.error({ err: error }, '[RateLimit Error]');
    // Fail open: kembalikan false agar transaksi tidak terblokir saat terjadi kendala koneksi
    return false;
  }
}
