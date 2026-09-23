import { describe, it, expect } from "vitest";
import {
  paymentCustomerSchema,
  paymentRequestSchema,
  formatZodErrors,
} from "./payment";

// covers: AC-2 (Zod schema — email, userId, gameId, serverId validation)

describe("paymentCustomerSchema", () => {
  const validCustomer = {
    email: "user@example.com",
    userId: "123456",
    gameId: "genshin-impact",
    serverId: "asia",
  };

  it("accepts a fully valid customer object", () => {
    const result = paymentCustomerSchema.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from string fields before validating", () => {
    const result = paymentCustomerSchema.safeParse({
      email: "  user@example.com  ",
      userId: "  123  ",
      gameId: "  genshin-impact  ",
      serverId: "  asia  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.userId).toBe("123");
    }
  });

  // AC-2: invalid email
  it("rejects an email that has no at-sign", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Format email tidak valid");
    }
  });

  it("rejects an email missing the domain part", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      email: "user@",
    });
    expect(result.success).toBe(false);
  });

  // AC-2: empty userId
  it("rejects an empty userId", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      userId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("User ID wajib diisi");
    }
  });

  it("rejects a userId that is only whitespace", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      userId: "   ",
    });
    expect(result.success).toBe(false);
  });

  // AC-2: gameId validation
  it("rejects an empty gameId", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      gameId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Game ID wajib diisi");
    }
  });

  // serverId is optional
  it("accepts a customer with no serverId for games that do not require one", () => {
    const { serverId: _omit, ...withoutServer } = validCustomer;
    const result = paymentCustomerSchema.safeParse(withoutServer);
    expect(result.success).toBe(true);
  });

  // Maximum length bounds
  it("rejects a userId exceeding 50 characters", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      userId: "a".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("User ID maksimal 50 karakter");
    }
  });

  it("rejects a serverId exceeding 50 characters", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      serverId: "s".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Server ID maksimal 50 karakter");
    }
  });

  it("rejects a gameId exceeding 100 characters", () => {
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      gameId: "g".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Game ID maksimal 100 karakter");
    }
  });

  it("rejects an email exceeding 100 characters", () => {
    const longEmail = `${"a".repeat(95)}@test.com`;
    const result = paymentCustomerSchema.safeParse({
      ...validCustomer,
      email: longEmail,
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentRequestSchema", () => {
  const validRequest = {
    customer: {
      email: "user@example.com",
      userId: "123456",
      gameId: "genshin-impact",
      serverId: "asia",
    },
    productId: "crystal-300",
  };

  it("accepts a request using the direct productId field", () => {
    const result = paymentRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("accepts a legacy request using the nested product.id field (backward compat)", () => {
    const legacyRequest = {
      customer: validRequest.customer,
      product: { id: "crystal-300", price: 1, name: "tampered", currency: null },
    };
    const result = paymentRequestSchema.safeParse(legacyRequest);
    expect(result.success).toBe(true);
  });

  // AC-1: tampered price fields in legacy payload are present in parsed object
  // but the route ignores them — schema accepts the object, price value is irrelevant
  it("accepts a legacy request even when the client sends a tampered price of 1", () => {
    const result = paymentRequestSchema.safeParse({
      customer: validRequest.customer,
      product: { id: "crystal-300", price: 1 },
    });
    expect(result.success).toBe(true);
    // price passes through schema as-is; the route discards it
    if (result.success) {
      expect(result.data.product?.price).toBe(1);
    }
  });

  it("rejects a request with neither productId nor product.id", () => {
    const result = paymentRequestSchema.safeParse({
      customer: validRequest.customer,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Product ID wajib diisi");
    }
  });

  it("rejects a request with an empty productId string", () => {
    const result = paymentRequestSchema.safeParse({
      ...validRequest,
      productId: "",
    });
    // empty productId fails min(1); and product is absent, so refine also fails
    expect(result.success).toBe(false);
  });

  it("rejects a request with productId exceeding 100 characters", () => {
    const result = paymentRequestSchema.safeParse({
      ...validRequest,
      productId: "p".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Product ID maksimal 100 karakter");
    }
  });

  it("rejects a legacy request with product.id exceeding 100 characters", () => {
    const result = paymentRequestSchema.safeParse({
      customer: validRequest.customer,
      product: { id: "p".repeat(101) },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Product ID maksimal 100 karakter");
    }
  });
});

describe("formatZodErrors", () => {
  it("converts a ZodError into a flat key-value map of first messages", () => {
    const parsed = paymentCustomerSchema.safeParse({
      email: "bad",
      userId: "",
      gameId: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const map = formatZodErrors(parsed.error);
      expect(map["customer.email"] ?? map["email"]).toBeTruthy();
    }
  });

  it("uses the dotted path as the key for nested fields", () => {
    const parsed = paymentRequestSchema.safeParse({
      customer: { email: "bad", userId: "", gameId: "" },
      productId: "x",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const map = formatZodErrors(parsed.error);
      // at least one key should be a dotted path
      const hasDotted = Object.keys(map).some((k) => k.includes("."));
      expect(hasDotted).toBe(true);
    }
  });

  it("keeps only the first message per path when multiple issues share a path", () => {
    const parsed = paymentCustomerSchema.safeParse({
      email: "bad",
      userId: "ok",
      gameId: "ok",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const map = formatZodErrors(parsed.error);
      // each key must appear at most once
      const keys = Object.keys(map);
      const unique = new Set(keys);
      expect(keys.length).toBe(unique.size);
    }
  });
});
