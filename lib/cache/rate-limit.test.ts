import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClientIp, rateLimit, RATE_LIMIT_LUA_SCRIPT } from "./rate-limit";

// Mock @/lib/cache/redis
const mockEval = vi.fn();

vi.mock("@/lib/cache/redis", () => ({
  getRedis: vi.fn(),
}));

import { getRedis } from "@/lib/cache/redis";

describe("getClientIp", () => {
  it("extracts IP from x-real-ip when present", () => {
    const req = new Request("http://localhost/api/payment", {
      headers: {
        "x-real-ip": "203.0.113.195",
      },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("prioritizes x-real-ip over spoofed x-forwarded-for", () => {
    const req = new Request("http://localhost/api/payment", {
      headers: {
        "x-real-ip": "203.0.113.195",
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
      },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("extracts IP from cf-connecting-ip when x-real-ip is not present", () => {
    const req = new Request("http://localhost/api/payment", {
      headers: {
        "cf-connecting-ip": "198.51.100.42",
        "x-forwarded-for": "1.2.3.4",
      },
    });
    expect(getClientIp(req)).toBe("198.51.100.42");
  });

  it("falls back to first IP of x-forwarded-for when trusted headers are absent", () => {
    const req = new Request("http://localhost/api/payment", {
      headers: {
        "x-forwarded-for": "203.0.113.1, 10.0.0.1, 192.168.1.1",
      },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("trims whitespace from IP headers", () => {
    const req = new Request("http://localhost/api/payment", {
      headers: {
        "x-real-ip": "  203.0.113.88  ",
      },
    });
    expect(getClientIp(req)).toBe("203.0.113.88");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const req = new Request("http://localhost/api/payment");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("returns 'unknown' when IP headers contain only empty strings", () => {
    const req = new Request("http://localhost/api/payment", {
      headers: {
        "x-real-ip": "   ",
        "cf-connecting-ip": "",
        "x-forwarded-for": "",
      },
    });
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows request when rate limit is not exceeded", async () => {
    mockEval.mockResolvedValue(1);
    vi.mocked(getRedis).mockResolvedValue({
      eval: mockEval,
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
    expect(mockEval).toHaveBeenCalledWith(RATE_LIMIT_LUA_SCRIPT, {
      keys: ["rate-limit:203.0.113.1"],
      arguments: ["60"],
    });
  });

  it("blocks request when count exceeds limit", async () => {
    mockEval.mockResolvedValue(11);
    vi.mocked(getRedis).mockResolvedValue({
      eval: mockEval,
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(true);
    expect(mockEval).toHaveBeenCalledWith(RATE_LIMIT_LUA_SCRIPT, {
      keys: ["rate-limit:203.0.113.1"],
      arguments: ["60"],
    });
  });

  it("allows request when count equals limit", async () => {
    mockEval.mockResolvedValue(10);
    vi.mocked(getRedis).mockResolvedValue({
      eval: mockEval,
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
  });

  it("fails open (returns false) when Redis client is null", async () => {
    vi.mocked(getRedis).mockResolvedValue(null);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
    expect(mockEval).not.toHaveBeenCalled();
  });

  it("fails open (returns false) when Redis throws an error", async () => {
    vi.mocked(getRedis).mockRejectedValue(new Error("Redis connection refused"));

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
  });

  it("uses custom keyPrefix when provided (e.g. rate-limit:webhook)", async () => {
    mockEval.mockResolvedValue(1);
    vi.mocked(getRedis).mockResolvedValue({
      eval: mockEval,
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 30, 60000, "rate-limit:webhook");
    expect(isLimited).toBe(false);
    expect(mockEval).toHaveBeenCalledWith(RATE_LIMIT_LUA_SCRIPT, {
      keys: ["rate-limit:webhook:203.0.113.1"],
      arguments: ["60"],
    });
  });

  it("calculates TTL seconds correctly with Math.ceil and minimum 1 second", async () => {
    mockEval.mockResolvedValue(1);
    vi.mocked(getRedis).mockResolvedValue({
      eval: mockEval,
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    // 500ms should ceil to 1 second
    await rateLimit("203.0.113.1", 10, 500);
    expect(mockEval).toHaveBeenCalledWith(RATE_LIMIT_LUA_SCRIPT, {
      keys: ["rate-limit:203.0.113.1"],
      arguments: ["1"],
    });

    // 65400ms should ceil to 66 seconds
    await rateLimit("203.0.113.1", 10, 65400);
    expect(mockEval).toHaveBeenCalledWith(RATE_LIMIT_LUA_SCRIPT, {
      keys: ["rate-limit:203.0.113.1"],
      arguments: ["66"],
    });
  });

  it("contains atomic INCR and conditional EXPIRE with self-healing in Lua script", () => {
    expect(RATE_LIMIT_LUA_SCRIPT).toContain("redis.call('INCR', KEYS[1])");
    expect(RATE_LIMIT_LUA_SCRIPT).toContain("if current == 1 then");
    expect(RATE_LIMIT_LUA_SCRIPT).toContain("redis.call('EXPIRE', KEYS[1], ARGV[1])");
    expect(RATE_LIMIT_LUA_SCRIPT).toContain("redis.call('TTL', KEYS[1]) == -1");
    expect(RATE_LIMIT_LUA_SCRIPT).toContain("return current");
  });
});
