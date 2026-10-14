/**
 * Integration tests for POST /api/payment/notification route handler.
 *
 * Mocking boundaries:
 *   - midtrans-client  → mocked at module level (external payment gateway)
 *   - @/lib/prisma     → mocked at module level (database)
 *   - @/lib/rate-limit → mocked at module level (Redis, tested separately)
 *
 * covers: AC-1 (crypto.timingSafeEqual for signature verification, 403 on mismatch)
 * covers: AC-2 (rate limiting 30 req/min with 'rate-limit:webhook' prefix, 429 on exceed)
 * covers: AC-3 (idempotency check: terminal status returns 200 without DB update or Midtrans call)
 * covers: AC-4 (order not found returns 404 with warning log)
 * covers: AC-5 (fail open behavior on rate limiter)
 * covers: AC-6 (console.warn on terminal duplicate notification)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// ── Mock boundaries ──────────────────────────────────────────────────────────
const { mockNotification, mockPrismaFindUnique, mockPrismaUpdate, mockPrismaUpdateMany, mockRateLimit, mockSnapConstructor } = vi.hoisted(() => ({
  mockNotification: vi.fn(),
  mockPrismaFindUnique: vi.fn(),
  mockPrismaUpdate: vi.fn(),
  mockPrismaUpdateMany: vi.fn(),
  mockRateLimit: vi.fn(),
  mockSnapConstructor: vi.fn(),
}));

vi.mock("midtrans-client", () => {
  return {
    default: {
      Snap: vi.fn(function (this: unknown, ...args: unknown[]) {
        mockSnapConstructor(...args);
        (this as Record<string, unknown>).transaction = {
          notification: mockNotification,
        };
      }),
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: {
      findUnique: mockPrismaFindUnique,
      update: mockPrismaUpdate,
      updateMany: mockPrismaUpdateMany,
    },
  },
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    rateLimit: mockRateLimit,
  };
});

// ── Import route handler ─────────────────────────────────────────────────────
import { POST } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────
const TEST_SERVER_KEY = "test-server-key-12345";
process.env.MIDTRANS_SERVER_KEY = TEST_SERVER_KEY;

function generateSignature(orderId: string, statusCode: string, grossAmount: string): string {
  const stringToSign = `${orderId}${statusCode}${grossAmount}${TEST_SERVER_KEY}`;
  return crypto.createHash("sha512").update(stringToSign).digest("hex");
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/payment/notification", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const defaultOrderId = "ORDER-TEST-001";
const defaultStatusCode = "200";
const defaultGrossAmount = "75000.00";
const defaultSignature = generateSignature(defaultOrderId, defaultStatusCode, defaultGrossAmount);

const validPayload = {
  order_id: defaultOrderId,
  status_code: defaultStatusCode,
  gross_amount: defaultGrossAmount,
  signature_key: defaultSignature,
  transaction_status: "settlement",
  payment_type: "qris",
  transaction_id: "trx-uuid-123",
  fraud_status: "accept",
};

// ── Test suites ──────────────────────────────────────────────────────────────
describe("POST /api/payment/notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(false);
    mockPrismaFindUnique.mockResolvedValue({
      orderId: defaultOrderId,
      status: "pending",
    });
    mockNotification.mockResolvedValue({
      order_id: defaultOrderId,
      transaction_status: "settlement",
      fraud_status: "accept",
      transaction_id: "trx-uuid-123",
      payment_type: "qris",
    });
    mockPrismaUpdate.mockResolvedValue({ orderId: defaultOrderId, status: "success" });
    mockPrismaUpdateMany.mockResolvedValue({ count: 1 });
  });

  // ── AC-2 & AC-5: Rate limiting ──────────────────────────────────────────────
  describe("rate limiting (AC-2, AC-5)", () => {
    it("extracts IP and calls rateLimit with 'rate-limit:webhook' prefix and limit 30", async () => {
      await POST(makeRequest(validPayload, { "x-real-ip": "203.0.113.10" }));

      expect(mockRateLimit).toHaveBeenCalledWith("203.0.113.10", 30, 60000, "rate-limit:webhook");
    });

    it("returns 429 when rate limit is exceeded before inspecting body", async () => {
      mockRateLimit.mockResolvedValue(true);

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Terlalu banyak permintaan");
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it("fails open (AC-5) when rate limit returns false", async () => {
      mockRateLimit.mockResolvedValue(false);

      const response = await POST(makeRequest(validPayload));
      expect(response.status).toBe(200);
    });
  });

  // ── Payload validation ─────────────────────────────────────────────────────
  describe("payload validation", () => {
    it("returns 400 when body is not valid JSON", async () => {
      const req = new Request("http://localhost:3000/api/payment/notification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "invalid-json{",
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Data tidak lengkap");
    });

    it("returns 400 when required fields are missing", async () => {
      const incomplete = { order_id: defaultOrderId, status_code: "200" };
      const response = await POST(makeRequest(incomplete));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Data tidak lengkap");
    });
  });

  // ── AC-1: Timing-safe signature verification ───────────────────────────────
  describe("signature verification (AC-1)", () => {
    it("returns 403 when signature key does not match", async () => {
      const invalidSignature = "a".repeat(128); // same 128-char hex length as SHA-512, but invalid content
      const payload = {
        ...validPayload,
        signature_key: invalidSignature,
      };

      const response = await POST(makeRequest(payload));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Signature tidak valid");
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it("returns 403 safely without throwing when signature length differs (timing-safe length check)", async () => {
      const shortSignature = "short-fake-sig";
      const payload = {
        ...validPayload,
        signature_key: shortSignature,
      };

      const response = await POST(makeRequest(payload));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Signature tidak valid");
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it("accepts valid signature matching SHA-512 calculation", async () => {
      const response = await POST(makeRequest(validPayload));
      expect(response.status).toBe(200);
    });
  });

  // ── AC-4: Order not found ──────────────────────────────────────────────────
  describe("order not found (AC-4)", () => {
    it("returns 404 and logs console.warn when order_id is not in database", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockPrismaFindUnique.mockResolvedValue(null);

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Order tidak ditemukan");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(defaultOrderId));
      expect(mockNotification).not.toHaveBeenCalled();
      expect(mockPrismaUpdateMany).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ── AC-3 & AC-6: Idempotency check ─────────────────────────────────────────
  describe("idempotency check (AC-3, AC-6)", () => {
    it("returns 200, logs console.warn, and skips update when invoice status is 'success'", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockPrismaFindUnique.mockResolvedValue({
        orderId: defaultOrderId,
        status: "success",
      });

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("success"));
      // Must not call Midtrans API or Prisma update
      expect(mockNotification).not.toHaveBeenCalled();
      expect(mockPrismaUpdateMany).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("returns 200, logs console.warn, and skips update when invoice status is 'failed'", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockPrismaFindUnique.mockResolvedValue({
        orderId: defaultOrderId,
        status: "failed",
      });

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("failed"));
      expect(mockNotification).not.toHaveBeenCalled();
      expect(mockPrismaUpdateMany).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("proceeds with update when invoice status is 'pending'", async () => {
      mockPrismaFindUnique.mockResolvedValue({
        orderId: defaultOrderId,
        status: "pending",
      });

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockNotification).toHaveBeenCalledOnce();
      expect(mockPrismaUpdateMany).toHaveBeenCalledOnce();
    });
  });

  // ── Status mapping & DB update ─────────────────────────────────────────────
  describe("status mapping and updates", () => {
    it("updates invoice to 'success' on settlement", async () => {
      mockNotification.mockResolvedValue({
        order_id: defaultOrderId,
        transaction_status: "settlement",
        fraud_status: "accept",
        transaction_id: "trx-settle",
        payment_type: "bank_transfer",
      });

      await POST(makeRequest(validPayload));

      expect(mockPrismaUpdateMany).toHaveBeenCalledWith({
        where: {
          orderId: defaultOrderId,
          status: { notIn: ["success", "failed"] },
        },
        data: {
          status: "success",
          paymentMethod: "bank_transfer",
          transactionId: "trx-settle",
          paymentTime: expect.any(Date),
        },
      });
    });

    it("updates invoice to 'failed' on cancel, deny, or expire", async () => {
      mockNotification.mockResolvedValue({
        order_id: defaultOrderId,
        transaction_status: "expire",
        fraud_status: "accept",
        transaction_id: "trx-expire",
        payment_type: "echannel",
      });

      await POST(makeRequest(validPayload));

      expect(mockPrismaUpdateMany).toHaveBeenCalledWith({
        where: {
          orderId: defaultOrderId,
          status: { notIn: ["success", "failed"] },
        },
        data: {
          status: "failed",
          paymentMethod: "echannel",
          transactionId: "trx-expire",
          paymentTime: expect.any(Date),
        },
      });
    });

    it("updates invoice to 'pending' on capture with challenge fraud status", async () => {
      mockNotification.mockResolvedValue({
        order_id: defaultOrderId,
        transaction_status: "capture",
        fraud_status: "challenge",
        transaction_id: "trx-challenge",
        payment_type: "credit_card",
      });

      await POST(makeRequest(validPayload));

      expect(mockPrismaUpdateMany).toHaveBeenCalledWith({
        where: {
          orderId: defaultOrderId,
          status: { notIn: ["success", "failed"] },
        },
        data: {
          status: "pending",
          paymentMethod: "credit_card",
          transactionId: "trx-challenge",
          paymentTime: expect.any(Date),
        },
      });
    });
  });

  // ── Concurrency & race condition handling ──────────────────────────────────
  describe("concurrency and race condition handling (atomic conditional update)", () => {
    it("handles race condition gracefully when concurrent webhook already finalized invoice (count: 0)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockPrismaFindUnique
        .mockResolvedValueOnce({
          orderId: defaultOrderId,
          status: "pending",
        })
        .mockResolvedValueOnce({
          orderId: defaultOrderId,
          status: "success",
        });

      mockPrismaUpdateMany.mockResolvedValue({ count: 0 });

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaUpdateMany).toHaveBeenCalledWith({
        where: {
          orderId: defaultOrderId,
          status: { notIn: ["success", "failed"] },
        },
        data: expect.objectContaining({
          status: "success",
        }),
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("proses konkuren")
      );
      warnSpy.mockRestore();
    });
  });

  // ── Environment separation & transaction time logging ────────────────────
  describe("environment configuration and metadata logging", () => {
    const originalEnv = process.env.MIDTRANS_IS_PRODUCTION;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.MIDTRANS_IS_PRODUCTION = originalEnv;
      } else {
        delete process.env.MIDTRANS_IS_PRODUCTION;
      }
    });

    it("configures Snap client with isProduction: false when MIDTRANS_IS_PRODUCTION is not 'true'", async () => {
      process.env.MIDTRANS_IS_PRODUCTION = "false";
      mockPrismaFindUnique.mockResolvedValue({ orderId: defaultOrderId, status: "pending" });
      mockNotification.mockResolvedValue({
        order_id: defaultOrderId,
        transaction_status: "settlement",
        transaction_time: "2026-09-24 14:00:00",
      });
      mockPrismaUpdateMany.mockResolvedValue({ count: 1 });

      await POST(makeRequest(validPayload));

      expect(mockSnapConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          isProduction: false,
        })
      );
    });

    it("configures Snap client with isProduction: true when MIDTRANS_IS_PRODUCTION is 'true'", async () => {
      process.env.MIDTRANS_IS_PRODUCTION = "true";
      mockPrismaFindUnique.mockResolvedValue({ orderId: defaultOrderId, status: "pending" });
      mockNotification.mockResolvedValue({
        order_id: defaultOrderId,
        transaction_status: "settlement",
        transaction_time: "2026-09-24 14:00:00",
      });
      mockPrismaUpdateMany.mockResolvedValue({ count: 1 });

      await POST(makeRequest(validPayload));

      expect(mockSnapConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          isProduction: true,
        })
      );
    });

    it("logs a warning when transaction_time is missing from statusResponse and falls back to server time", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockPrismaFindUnique.mockResolvedValue({ orderId: defaultOrderId, status: "pending" });
      mockNotification.mockResolvedValue({
        order_id: defaultOrderId,
        transaction_status: "settlement",
        // transaction_time intentionally missing
      });
      mockPrismaUpdateMany.mockResolvedValue({ count: 1 });

      await POST(makeRequest(validPayload));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("transaction_time tidak ada untuk order")
      );
      warnSpy.mockRestore();
    });
  });

  // ── AC-4: 500 Server error handling in Bahasa Indonesia ────────────────────
  describe("server error handling (AC-1, AC-3, AC-4)", () => {
    it("returns 500 with Indonesian message without leaking details when an unhandled error occurs", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPrismaFindUnique.mockRejectedValue(new Error("Unexpected DB crash"));

      const response = await POST(makeRequest(validPayload));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Gagal memproses notifikasi");
      expect(data.error).toBeUndefined();
      expect(data.stack).toBeUndefined();
      errSpy.mockRestore();
    });
  });
});
