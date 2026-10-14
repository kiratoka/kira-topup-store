/**
 * Integration tests for POST /api/payment route handler.
 *
 * Mocking boundaries:
 *   - midtrans-client  → mocked at module level (external payment gateway)
 *   - @/lib/prisma     → mocked at module level (database)
 *   - @/lib/rate-limit → mocked at module level (Redis, tested separately)
 *   - nanoid           → mocked to return deterministic order IDs
 *
 * The product catalog (lib/datas/productData) and game data (lib/datas/gameData)
 * are NOT mocked: we want the real catalog lookup to run.
 *
 * covers: AC-1 (server resolves canonical price, ignores client price)
 * covers: AC-2 (Zod validation — email, userId, gameId)
 * covers: AC-3 (invalid product → 400 before Midtrans call)
 * covers: AC-4 (missing serverId for requiresServer game → 400)
 * covers: AC-5 (invoice created with authoritative product snapshot)
 * covers: AC-6 (rate limiter executes first, returns 429)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock boundaries ──────────────────────────────────────────────────────────
// vi.mock factories are hoisted to the top of the file by Vitest.
// We use vi.hoisted() to declare the spy functions before any mock factory runs,
// which avoids the "Cannot access before initialization" ReferenceError.

const { mockCreateTransaction, mockPrismaCreate, mockRateLimit } = vi.hoisted(() => ({
  mockCreateTransaction: vi.fn(),
  mockPrismaCreate: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("midtrans-client", () => {
  return {
    default: {
      Snap: vi.fn(function (this: unknown) {
        (this as Record<string, unknown>).createTransaction = mockCreateTransaction;
      }),
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: {
      create: mockPrismaCreate,
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

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "TEST_NANO_ID"),
}));


// ── Import route after mocks are set up ──────────────────────────────────────
import { POST } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/payment", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const validBody = {
  customer: {
    email: "user@example.com",
    userId: "123456",
    gameId: "genshin-impact",
    serverId: "asia",
  },
  productId: "crystal-300",
};

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: not rate limited
  mockRateLimit.mockResolvedValue(false);
  // Default: Midtrans returns a token
  mockCreateTransaction.mockResolvedValue({ token: "snap-token-abc" });
  // Default: Prisma create succeeds
  mockPrismaCreate.mockResolvedValue({ id: "invoice-uuid" });
});

// ── AC-6: rate limiting runs first ───────────────────────────────────────────

describe("rate limiting (AC-6)", () => {
  it("returns 429 when the rate limit is exceeded before any other logic", async () => {
    mockRateLimit.mockResolvedValue(true);

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.");
    // Midtrans must NOT have been called
    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(mockPrismaCreate).not.toHaveBeenCalled();
  });

  it("prioritizes trusted x-real-ip over spoofed x-forwarded-for header", async () => {
    mockRateLimit.mockResolvedValue(false);

    await POST(
      makeRequest(validBody, {
        "x-real-ip": "203.0.113.50",
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
      })
    );

    // x-real-ip from trusted infrastructure wins, spoofed 1.2.3.4 is ignored
    expect(mockRateLimit).toHaveBeenCalledWith("203.0.113.50", 10, 60000);
  });

  it("prioritizes cf-connecting-ip over spoofed x-forwarded-for header", async () => {
    mockRateLimit.mockResolvedValue(false);

    await POST(
      makeRequest(validBody, {
        "cf-connecting-ip": "198.51.100.99",
        "x-forwarded-for": "1.2.3.4",
      })
    );

    expect(mockRateLimit).toHaveBeenCalledWith("198.51.100.99", 10, 60000);
  });

  it("extracts the client IP from x-real-ip header when present alone", async () => {
    mockRateLimit.mockResolvedValue(false);

    await POST(makeRequest(validBody, { "x-real-ip": "203.0.113.25" }));

    expect(mockRateLimit).toHaveBeenCalledWith("203.0.113.25", 10, 60000);
  });

  it("extracts the client IP from x-forwarded-for header when x-real-ip is absent", async () => {
    mockRateLimit.mockResolvedValue(false);

    await POST(makeRequest(validBody, { "x-forwarded-for": "203.0.113.1, 10.0.0.1" }));

    expect(mockRateLimit).toHaveBeenCalledWith("203.0.113.1", 10, 60000);
  });

  it("falls back to 'unknown' IP when IP headers are absent", async () => {
    await POST(makeRequest(validBody));
    expect(mockRateLimit).toHaveBeenCalledWith("unknown", 10, 60000);
  });
});

// ── AC-2: Zod schema validation ───────────────────────────────────────────────

describe("input validation (AC-2)", () => {
  it("returns 400 with field errors when the email is malformed", async () => {
    const response = await POST(
      makeRequest({ ...validBody, customer: { ...validBody.customer, email: "not-an-email" } })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors?.["customer.email"]).toBeTruthy();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when userId is empty", async () => {
    const response = await POST(
      makeRequest({ ...validBody, customer: { ...validBody.customer, userId: "" } })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors?.["customer.userId"]).toBeTruthy();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when gameId is empty", async () => {
    const response = await POST(
      makeRequest({ ...validBody, customer: { ...validBody.customer, gameId: "" } })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors?.["customer.gameId"]).toBeTruthy();
  });

  it("returns 400 when neither productId nor product.id is provided", async () => {
    const bodyWithoutProduct = { ...validBody };
    delete (bodyWithoutProduct as Record<string, unknown>).productId;
    const response = await POST(makeRequest(bodyWithoutProduct));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const req = new Request("http://localhost:3000/api/payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ invalid json",
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });
});

// ── Game validation ───────────────────────────────────────────────────────────

describe("game validation", () => {
  it("returns 400 when the gameId does not exist in the catalog", async () => {
    const response = await POST(
      makeRequest({ ...validBody, customer: { ...validBody.customer, gameId: "fake-game", serverId: "x" } })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/tidak ditemukan/i);
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when gameId is a prototype property name like toString", async () => {
    const response = await POST(
      makeRequest({ ...validBody, customer: { ...validBody.customer, gameId: "toString", serverId: "x" } })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/tidak ditemukan/i);
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });
});

// ── AC-4: server ID requirement ───────────────────────────────────────────────

describe("server ID requirement (AC-4)", () => {
  it("returns 400 when genshin-impact order has no serverId", async () => {
    const response = await POST(
      makeRequest({
        customer: {
          email: "user@example.com",
          userId: "123456",
          gameId: "genshin-impact",
          // serverId omitted
        },
        productId: "crystal-300",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors?.["customer.serverId"]).toBeTruthy();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when mobile-legends order has an empty serverId string", async () => {
    const response = await POST(
      makeRequest({
        customer: {
          email: "user@example.com",
          userId: "999",
          gameId: "mobile-legends",
          serverId: "",
        },
        productId: "diamond-50",
      })
    );

    expect(response.status).toBe(400);
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("does NOT require serverId for love-and-deepspace (requiresServer = false)", async () => {
    const response = await POST(
      makeRequest({
        customer: {
          email: "user@example.com",
          userId: "654321",
          gameId: "love-and-deepspace",
          // serverId intentionally absent
        },
        productId: "crystal-100",
      })
    );
    // Should reach Midtrans, not fail at server validation
    expect(response.status).toBe(200);
    expect(mockCreateTransaction).toHaveBeenCalledOnce();
  });
});

// ── AC-3: invalid product → 400 before Midtrans ──────────────────────────────

describe("product not found (AC-3)", () => {
  it("returns 400 when the productId does not exist in the game catalog", async () => {
    const response = await POST(
      makeRequest({ ...validBody, productId: "nonexistent-product" })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/tidak ditemukan/i);
    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(mockPrismaCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a product that belongs to a different game (cross-game lookup guard)", async () => {
    // diamond-50 is a mobile-legends product; using it in genshin-impact should 400
    const response = await POST(
      makeRequest({ ...validBody, productId: "diamond-50" })
    );

    expect(response.status).toBe(400);
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });
});

// ── AC-1 + AC-5: canonical price and invoice snapshot ────────────────────────

describe("canonical price and invoice (AC-1, AC-5)", () => {
  it("calls Midtrans with the catalog price, ignoring any client-submitted price", async () => {
    // Client sends a tampered price of 1 IDR
    const bodyWithTamperedPrice = {
      customer: validBody.customer,
      productId: "crystal-300",
      product: { id: "crystal-300", price: 1, name: "tampered" },
    };

    const response = await POST(makeRequest(bodyWithTamperedPrice));
    expect(response.status).toBe(200);

    const [[callArg]] = mockCreateTransaction.mock.calls;
    // Catalog price for genshin-impact/crystal-300 is 75000
    expect(callArg.transaction_details.gross_amount).toBe(75000);
    expect(callArg.item_details[0].price).toBe(75000);
    expect(callArg.item_details[0].id).toBe("crystal-300");
  });

  it("saves the invoice with the canonical product snapshot, not the client payload", async () => {
    await POST(makeRequest(validBody));

    expect(mockPrismaCreate).toHaveBeenCalledOnce();
    const [[prismaArg]] = mockPrismaCreate.mock.calls;

    // Product snapshot must carry the real catalog price
    expect(prismaArg.data.product.price).toBe(75000);
    expect(prismaArg.data.product.gameId).toBe("genshin-impact");
    expect(prismaArg.data.product.id).toBe("crystal-300");
  });

  it("generates the orderId with the ORDER- prefix using nanoid", async () => {
    await POST(makeRequest(validBody));

    const [[prismaArg]] = mockPrismaCreate.mock.calls;
    expect(prismaArg.data.orderId).toBe("ORDER-TEST_NANO_ID");
  });

  it("returns success with token, orderId, and invoiceUrl on a valid request", async () => {
    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe("snap-token-abc");
    expect(data.orderId).toBe("ORDER-TEST_NANO_ID");
    expect(data.invoiceUrl).toBe("/invoice/ORDER-TEST_NANO_ID");
  });

  it("returns 500 when Midtrans createTransaction throws", async () => {
    mockCreateTransaction.mockRejectedValue(new Error("Midtrans network error"));

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Gagal membuat permohonan transaksi pembayaran");
    // Internal error details must not be leaked to the client
    expect(data.error).toBeUndefined();
    // Invoice must NOT be saved when Midtrans fails
    expect(mockPrismaCreate).not.toHaveBeenCalled();
  });

  it("accepts the legacy product object payload and still uses catalog price (AC-1, backward compat)", async () => {
    const legacyBody = {
      customer: validBody.customer,
      product: { id: "crystal-300", price: 1 }, // tampered price in legacy field
    };

    const response = await POST(makeRequest(legacyBody));
    expect(response.status).toBe(200);

    const [[callArg]] = mockCreateTransaction.mock.calls;
    expect(callArg.transaction_details.gross_amount).toBe(75000);
  });

  // ── Error sanitization and standardization (AC-1, AC-3) ───────────────────
  describe("error sanitization (AC-1, AC-3)", () => {
    it("returns 400 with Indonesian message without leaking details on malformed JSON", async () => {
      const req = new Request("http://localhost:3000/api/payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ malformed: json",
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Payload JSON tidak valid");
      expect(data.error).toBeUndefined();
      expect(data.stack).toBeUndefined();
    });

    it("returns 429 with Indonesian message when rate limit is exceeded", async () => {
      mockRateLimit.mockResolvedValue(true);

      const response = await POST(makeRequest(validBody));
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.");
      expect(data.error).toBeUndefined();
      expect(mockCreateTransaction).not.toHaveBeenCalled();
    });

    it("returns 500 with Indonesian message without leaking details on unhandled server error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { nanoid } = await import("nanoid");
      vi.mocked(nanoid).mockImplementationOnce(() => {
        throw new Error("Fatal ID generation crash");
      });

      const response = await POST(makeRequest(validBody));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Terjadi kesalahan internal pada server");
      expect(data.error).toBeUndefined();
      expect(data.stack).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it("returns 400 with sanitized message when gameId does not exist", async () => {
      const bodyWithUnknownGame = {
        customer: {
          ...validBody.customer,
          gameId: "unknown-game-id",
        },
        productId: "crystal-300",
      };

      const response = await POST(makeRequest(bodyWithUnknownGame));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Game dengan ID "unknown-game-id" tidak ditemukan');
      expect(data.error).toBeUndefined();
      expect(data.stack).toBeUndefined();
    });

    it("returns 400 with sanitized message when productId does not exist for the game", async () => {
      const bodyWithUnknownProduct = {
        ...validBody,
        productId: "invalid-product-id",
      };

      const response = await POST(makeRequest(bodyWithUnknownProduct));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Produk dengan ID "invalid-product-id" tidak ditemukan');
      expect(data.error).toBeUndefined();
      expect(data.stack).toBeUndefined();
    });

    it("returns 400 with formatted validation errors without leaking stack", async () => {
      const response = await POST(makeRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Data permohonan pembayaran tidak valid");
      expect(data.errors).toBeDefined();
      expect(data.error).toBeUndefined();
      expect(data.stack).toBeUndefined();
    });
  });
});

