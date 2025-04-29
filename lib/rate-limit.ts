// lib/rate-limit.ts
import { Redis } from '@upstash/redis';

// Setup Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN|| '',
});

export async function rateLimit(ip: string, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const key = `rate-limit:${ip}`;

    // Dapetin request count dan last reset time
    const [count, resetTime] = await redis.pipeline()
        .get(key)
        .get(`${key}:resetTime`)
        .exec() as [number | null, number | null];

    let currentCount = count ? parseInt(count.toString()) : 0;
    const resetTimeVal = resetTime ? parseInt(resetTime.toString()) : now;

    // Reset count kalo udah lewat window time
    if (now > resetTimeVal) {
        currentCount = 0;
        await redis.pipeline()
            .set(`${key}:resetTime`, now + windowMs)
            .exec();
    }

    // Increment count
    currentCount++;
    await redis.set(key, currentCount);

    // Set TTL supaya ga makan memori
    await redis.expire(key, Math.floor(windowMs / 1000));

    // Return true kalo udah kena limit
    return currentCount > limit;
}