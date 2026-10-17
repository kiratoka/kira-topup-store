import { createClient, RedisClientType } from 'redis';
import { redisLogger } from '@/lib/logging/logger';

const globalForRedis = global as unknown as {
  redisClient?: RedisClientType;
  redisConnectPromise?: Promise<unknown> | null;
};

export const redis =
  globalForRedis.redisClient ||
  createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

redis.on('error', (err) => {
  redisLogger.error({ err }, '[Redis Client Error]');
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redis;
}

export async function getRedis(): Promise<RedisClientType | null> {
  try {
    if (!redis.isOpen) {
      if (!globalForRedis.redisConnectPromise) {
        globalForRedis.redisConnectPromise = redis.connect().finally(() => {
          globalForRedis.redisConnectPromise = null;
        });
      }
      await globalForRedis.redisConnectPromise;
    }
    return redis;
  } catch (error) {
    redisLogger.error({ err: error }, '[Redis Connection Error]');
    return null;
  }
}
