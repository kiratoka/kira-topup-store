// lib/redis.ts
import { createClient, RedisClientType } from 'redis';

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
  console.error('[Redis Client Error]', err);
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
    console.error('[Redis Connection Error]', error);
    return null;
  }
}
