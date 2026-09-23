# 0002. Server side price validation and input schema guard

**Date**: 2026-09-22
**Status**: Accepted

## Summary

This decision enforces server side price validation and input schema checks on the payment creation endpoint. The server will retrieve authoritative product prices directly from master data, ignoring any price submitted by the browser client. Request payloads will be validated strictly using Zod before any Midtrans transaction or database record is created. This change eliminates client side price tampering risks while keeping latency minimal.

## Requirements

**User stories**:
* As a store owner, I want product prices determined solely by server master data so that malicious users cannot purchase game credits below official prices.
* As a customer, I want clear and prompt feedback if my account details or selected item are invalid so that I can correct errors before paying.

**Acceptance criteria**:
* **AC-1**: When creating a payment, the server resolves the canonical price and item name from `lib/datas/productData.ts`, ignoring any client submitted price field.
* **AC-2**: The payment endpoint validates the incoming request payload using a strict Zod schema, verifying valid email syntax, non empty user identifier, valid game identifier, and product identifier.
* **AC-3**: If the requested product identifier does not exist within the specified game catalog, the server rejects the request with HTTP 400 Bad Request and an explanatory error message without calling Midtrans.
* **AC-4**: If the selected game requires a server identifier according to `gamesData` and the request lacks a valid server identifier, the server rejects the request with HTTP 400 Bad Request.
* **AC-5**: Valid transactions produce an invoice record in PostgreSQL containing the authoritative server product snapshot and create a Midtrans Snap transaction with the official price.
* **AC-6**: Existing rate limiting rules (maximum 10 requests per minute per IP via Redis Cloud) continue to execute before schema parsing and product lookup.

## Decision

**Chosen option**: Option 1: Fix in place with static product catalog lookup and Zod validation

The server will be the sole authority for product pricing by looking up items from `lib/datas/productData.ts` and validating inputs with Zod. Full rationale lives in [rationale.md](rationale.md).

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`)

## Feature design

**Data model sketch**:

The existing `Invoice` model in PostgreSQL remains unchanged. The server populates the `product` JSON field using the canonical snapshot retrieved from server data rather than raw client input.

```prisma
// Existing schema (prisma/schema.prisma) preserved without migration
model Invoice {
  id            String    @id @default(uuid())
  orderId       String    @unique
  token         String
  product       Json      // Populated with authoritative server product snapshot
  customer      Json      // Populated with validated customer details
  createdAt     DateTime  @default(now())
  status        String    @default("pending")
  paymentMethod String?
  paymentTime   DateTime?
  transactionId String?
  updatedAt     DateTime  @updatedAt

  @@map("invoices")
}
```

In memory request validation schema using Zod:

```typescript
// Target validation schema in lib/validations/payment.ts
export const paymentCustomerSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(100, "Format email maksimal 100 karakter"),
  userId: z.string().trim().min(1, "User ID wajib diisi").max(50, "User ID maksimal 50 karakter"),
  serverId: z.string().trim().max(50, "Server ID maksimal 50 karakter").optional(),
  gameId: z.string().trim().min(1, "Game ID wajib diisi").max(100, "Game ID maksimal 100 karakter")
});

export const paymentRequestSchema = z.object({
  customer: paymentCustomerSchema,
  productId: z.string().trim().min(1, "Product ID wajib diisi").max(100, "Product ID maksimal 100 karakter").optional(),
  // Backward compatibility object, price inside will be ignored by server
  product: z.object({
    id: z.string().trim().min(1, "Product ID wajib diisi").max(100, "Product ID maksimal 100 karakter")
  }).optional()
});
```

**State transitions**:

1. Client triggers checkout with account data and selected product identifier.
2. Route handler checks IP rate limit via Redis Cloud sliding window.
3. Route handler parses and validates request body with Zod schema.
4. Server verifies `customer.gameId` exists in `gamesData` with prototype safety check.
5. If `gameInfo.requiresServer` is true, server verifies `customer.serverId` is present and valid.
6. Server locates product in `productsData[customer.gameId]` matching `productId`.
7. Server constructs transaction details with official `product.price` and calls Midtrans Snap API.
8. Server saves invoice with canonical product snapshot in PostgreSQL.
9. Route handler returns Snap token and invoice URL to client.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/payment` | POST | `customer` (object), `productId` (string) | `success`, `token`, `orderId`, `invoiceUrl` | Public (rate limited) | 400 (validation), 429 (rate limit), 500 (Midtrans/DB) |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Price validation | `gross_amount` sent to Midtrans | Canonical `product.price` from `lib/datas/productData.ts` |
| Item details | Item name and ID in Snap parameter | Canonical `product.name` and `product.id` from `lib/datas/productData.ts` |
| Game validation | Server ID requirement check | Canonical `gameInfo.requiresServer` from `lib/datas/gameData.ts` |
| Order identity | `orderId` | Generated on server via `nanoid` with prefix `ORDER-` |
| Customer metadata | Snap customer details and custom fields | Validated `customer` fields from request body |
| Invoice record | `product` JSON field in database | Full canonical product object from `lib/datas/productData.ts` |

**Key invariants**:
* The transaction `gross_amount` passed to Midtrans Snap must equal the canonical price from `productsData[gameId]` for the requested item.
* Client submitted price values are completely ignored and never trusted.
* If `gameInfo.requiresServer` is true, checkout cannot proceed without a valid `serverId`.
* Requests failing schema or catalog lookup must return HTTP 400 before creating Midtrans transactions or database records.

**Security model**:
* Endpoint is public but protected by sliding window rate limiting (10 requests per minute per IP via Redis Cloud).
* Request payloads are strictly parsed and sanitized by Zod, preventing prototype pollution and invalid data types.
* Tampered prices in request bodies cannot alter transaction values because the server overrides item amounts with authoritative catalog data.
* Internal database and gateway errors are sanitized, keeping raw exception traces only in server logs.

**Configuration required**:
* No new environment variables required. Existing `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, and `DATABASE_URL` continue to be used.

**Critical test scenarios**:
* Happy path: Valid customer details and valid product identifier produce Snap token with exact catalog price, verifies **AC-1**, **AC-2**, **AC-5**.
* Tampered price attempt: Client sends request with tampered price (for example, 1 IDR), server ignores it and charges official price, verifies **AC-1**, **AC-5**.
* Invalid product identifier: Client sends non existent product identifier, server returns HTTP 400 Bad Request, verifies **AC-3**.
* Missing server identifier: Client submits order for game requiring server without serverId, server returns HTTP 400 Bad Request, verifies **AC-4**.
* Invalid email format: Client sends malformed email, server returns HTTP 400 with field error details, verifies **AC-2**.
* Rate limit enforcement: Rapid requests exceeding 10 per minute return HTTP 429 Too Many Requests, verifies **AC-6**.

## Build plan

1. [x] Install Zod dependency via npm, satisfies **AC-2**
2. [x] Create validation schema module in `lib/validations/payment.ts` for payment requests and field error formatting, satisfies **AC-2**, **AC-4**
3. [x] Implement authoritative product lookup helper in `lib/datas/productData.ts` to find products by game identifier and product identifier, satisfies **AC-1**, **AC-3**
4. [x] Refactor `app/api/payment/route.ts` to validate inputs with Zod, look up canonical product details, reject invalid games or items, and pass canonical prices to Midtrans and Prisma, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**
5. [x] Update client checkout caller in `components/TitleGame/ClientTopUp.tsx` to align with the validated request schema while keeping UI feedback smooth, satisfies **AC-1**, **AC-5**
6. [x] Verify end to end flow in browser and run validation tests against invalid and tampered payloads, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**
7. [x] Harden lookup and route handlers against prototype property collisions, apply upper length bounds, and sanitize error responses, satisfies review hardening

## Consequences

**Positive**:
* Eliminates price manipulation vulnerabilities completely.
* Rejects malformed requests before contacting Midtrans, reducing unnecessary external API calls.
* Provides consistent type safe validation schemas and clear error messages for users.

**Negative / tradeoffs**:
* Updating product prices still requires deploying code changes until dynamic database product management is implemented.
* Requires maintaining Zod as a project dependency.

**Neutral**:
* No database schema migration needed; existing invoice records remain compatible.

## Migration plan

**Strategy**: Fix in place with backward compatible request handling

**Phases**:
1. Implement Zod schema accepting either `productId` or legacy `product: { id }` structure.
2. Deploy updated server route handler with price validation active.
3. Update client component to send clean payload.
4. Remove legacy payload handling once client changes are confirmed.

**Rollback**:
* Revert route handler commit to previous version if unexpected validation issues arise.

**Risks**:
* If a product identifier in `lib/datas/productData.ts` does not match the identifier rendered by the frontend, checkout will fail with HTTP 400. Verification must confirm all product IDs match across all supported games.

## Follow up

* [ ] Verify that all product IDs across all games in `lib/datas/productData.ts` are unique and correctly mapped to storefront components.
* [ ] Evaluate introducing database backed product management with an administrative panel when dynamic pricing or seasonal discounts are needed.
