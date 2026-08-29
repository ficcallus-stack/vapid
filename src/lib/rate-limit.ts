import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn("⚠️  Upstash Redis credentials not set — rate limiting disabled");
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

/**
 * Pre-configured rate limiters for different use cases.
 * Uses sliding window algorithm for fair, distributed rate limiting.
 */
const limiters = {
  /** General API actions: 10 requests per 60s */
  standard: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "rl:std" })
    : null,

  /** Sensitive actions (payments, withdrawals): 5 requests per 60s */
  strict: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "rl:strict" })
    : null,

  /** High-frequency actions (messages): 30 requests per 60s */
  relaxed: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "rl:relaxed" })
    : null,
};

type LimiterType = keyof typeof limiters;

const inMemoryCache = new Map<string, { count: number; resetAt: number }>();

const IN_MEMORY_LIMITS: Record<LimiterType, { limit: number; windowMs: number }> = {
  standard: { limit: 10, windowMs: 60000 },
  strict: { limit: 5, windowMs: 60000 },
  relaxed: { limit: 30, windowMs: 60000 },
};

function inMemoryRateLimit(
  identifier: string,
  type: LimiterType
): { success: boolean; remaining: number } {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const config = IN_MEMORY_LIMITS[type];

  let record = inMemoryCache.get(key);
  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + config.windowMs };
    inMemoryCache.set(key, record);
  }

  // Basic cleanup mechanism (approx. 1 in 100 requests)
  if (Math.random() < 0.01) {
    inMemoryCache.forEach((value, key) => {
      if (value.resetAt < now) {
        inMemoryCache.delete(key);
      }
    });
  }

  record.count += 1;
  const success = record.count <= config.limit;
  const remaining = Math.max(0, config.limit - record.count);

  return { success, remaining };
}

/**
 * Rate limit a request by identifier (usually userId or IP).
 * Falls back to in-memory rate limiting if Redis is not configured or fails.
 */
export async function rateLimit(
  identifier: string,
  type: LimiterType = "standard"
): Promise<{ success: boolean; remaining: number }> {
  const limiter = limiters[type];

  if (!limiter) {
    // Redis not configured — use in-memory fallback
    return inMemoryRateLimit(identifier, type);
  }

  try {
    const { success, remaining } = await limiter.limit(identifier);
    return { success, remaining };
  } catch (error) {
    console.warn("⚠️  Upstash Redis rate limiting failed, falling back to in-memory:", error);
    return inMemoryRateLimit(identifier, type);
  }
}
