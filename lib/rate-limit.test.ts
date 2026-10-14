import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClientIp, rateLimit } from "./rate-limit";

// Mock @/lib/redis
const mockIncr = vi.fn();
const mockExpire = vi.fn();

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(),
}));

import { getRedis } from "@/lib/redis";

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
    vi.mocked(getRedis).mockResolvedValue({
      incr: mockIncr.mockResolvedValue(1),
      expire: mockExpire.mockResolvedValue(1),
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
    expect(mockIncr).toHaveBeenCalledWith("rate-limit:203.0.113.1");
    expect(mockExpire).toHaveBeenCalledWith("rate-limit:203.0.113.1", 60);
  });

  it("blocks request when count exceeds limit", async () => {
    vi.mocked(getRedis).mockResolvedValue({
      incr: mockIncr.mockResolvedValue(11),
      expire: mockExpire,
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(true);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("fails open (returns false) when Redis client is null", async () => {
    vi.mocked(getRedis).mockResolvedValue(null);

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
  });

  it("fails open (returns false) when Redis throws an error", async () => {
    vi.mocked(getRedis).mockRejectedValue(new Error("Redis connection refused"));

    const isLimited = await rateLimit("203.0.113.1", 10, 60000);
    expect(isLimited).toBe(false);
  });

  it("uses custom keyPrefix when provided (e.g. rate-limit:webhook)", async () => {
    vi.mocked(getRedis).mockResolvedValue({
      incr: mockIncr.mockResolvedValue(1),
      expire: mockExpire.mockResolvedValue(1),
    } as unknown as Awaited<ReturnType<typeof getRedis>>);

    const isLimited = await rateLimit("203.0.113.1", 30, 60000, "rate-limit:webhook");
    expect(isLimited).toBe(false);
    expect(mockIncr).toHaveBeenCalledWith("rate-limit:webhook:203.0.113.1");
    expect(mockExpire).toHaveBeenCalledWith("rate-limit:webhook:203.0.113.1", 60);
  });
});
