# API Routes (Payment)

## Overview

Handles payment creation and Midtrans webhook notifications. Two routes live here: one creates a Snap transaction and stores an invoice, and one receives and verifies Midtrans payment status updates. Both use the `prisma` singleton and run in the Next.js Edge-compatible runtime.

## Key files

| File | Owns |
|---|---|
| `app/api/payment/route.ts` | `POST /api/payment` — creates Midtrans Snap transaction, saves Invoice to DB |
| `app/api/payment/notification/route.ts` | `POST /api/payment/notification` — Midtrans webhook; verifies signature, updates Invoice status |
| `app/api/invoice/[orderId]/route.ts` | `GET /api/invoice/[orderId]` — retrieves invoice details, sanitized error handling |
| `app/api/invoice/route.ts` | `GET /api/invoice` — query invoice by orderId parameter with validation |
| `lib/errors.ts` | `apiError` helper for standardized API error responses |
| `lib/env.ts` | Zod schema validation for mandatory environment variables at startup |
| `lib/rate-limit.ts` | Sliding window rate limiter backed by Redis Cloud, with trusted IP extraction |
| `lib/redis.ts` | Redis Cloud TCP singleton client with fallback error handling |
| `lib/validations/payment.ts` | Strict Zod validation schemas (`paymentRequestSchema`) and error formatters |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/types.ts` | `PaymentRequest`, `InvoiceData`, `SnapResponse`, `CustomerDetails`, `ProductDetails` |
| `prisma/schema.prisma` | DB schema: `Invoice`, `Game`, `Product` models |

## Conventions

- Every `POST` route calls `rateLimit` at the top before any business logic (`POST /api/payment` uses 10 req/min with default prefix; `POST /api/payment/notification` uses 30 req/min with `rate-limit:webhook` key prefix). The IP is resolved using `getClientIp(req)` from `lib/rate-limit.ts`, which prioritizes trusted reverse proxy headers (`x-real-ip`, `cf-connecting-ip`) over `x-forwarded-for` to prevent IP spoofing.
- Pricing and item details in `POST /api/payment` are resolved authoritatively from `lib/datas/productData.ts` (`getProductById`); client-submitted prices are ignored.
- Incoming request payloads to `POST /api/payment` are strictly parsed and validated using Zod (`paymentRequestSchema` from `lib/validations/payment.ts`) before creating transactions or DB records.
- Midtrans mode is controlled by the `MIDTRANS_IS_PRODUCTION` env var (string `"true"` = production, anything else = sandbox). Set this in your deployment platform (Vercel, Railway, etc.), never hardcode it. Both routes read this same var so they stay in sync.
- Webhook signature verification: `SHA-512(orderId + statusCode + grossAmount + serverKey)` must match the `signature_key` in the request body using constant-time comparison (`crypto.timingSafeEqual`). Reject with `403` on mismatch.
- Webhook idempotency and existence: check invoice in DB first. If order does not exist, reject with `404`. If invoice status is already terminal (`success` or `failed`), return `200 { success: true }` immediately without reprocessing.
- Concurrency protection: database status updates use atomic conditional updates (`prisma.invoice.updateMany` filtering out terminal statuses) to guard against race conditions on parallel webhook deliveries.
- After signature check, call `apiClient.transaction.notification(notification)` to get the canonical status. Do not trust raw request body for `transaction_status`.
- Invoice status mapping: `capture` or `settlement` → `success` (unless fraud challenge → `pending`); `cancel`, `deny`, `expire` → `failed`; all else → `pending`.
- Customer info stored as `Json` in DB. Access via `invoice.customer` which matches `CustomerDetails`.
- Game custom data passed to Midtrans via `custom_field1` (gameId), `custom_field2` (serverId), `custom_field3` (userId).
- Error sanitization: All API routes return standardized error responses using the `apiError(message, status, code?, extra?)` helper from `lib/errors.ts` (`{ success: false, message, ... }`) in Indonesian without leaking internal error details, stack traces, or raw exception messages.
- Environment guard: Mandatory environment variables are validated at startup via `lib/env.ts` (`envSchema.safeParse`), failing fast if any required variables are missing.

## Gotchas

- To go live: set `MIDTRANS_IS_PRODUCTION=true` in your deployment platform env vars and swap `MIDTRANS_SERVER_KEY` / `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` to production keys. No code changes needed.
- The rate limiter uses two Redis keys per IP (`rate-limit:<ip>` and `rate-limit:<ip>:resetTime`, or prefixed like `rate-limit:webhook:<ip>`). The TTL is set only on the count key; if Redis restarts between the window update and the TTL set, the count key may outlive the window. This is low risk in production but worth noting.
- Automated test suite covers payment route (`app/api/payment/route.test.ts`), webhook notification route (`app/api/payment/notification/route.test.ts`), invoice routes (`app/api/invoice/route.test.ts`, `app/api/invoice/[orderId]/route.test.ts`), and schema validation with Vitest.

## Related specs

- [0005 Error sanitization and environment guard](../../docs/specs/0005-error-sanitization-env-guard/index.md): standardized error response shape with apiError helper, Indonesian messages, and fail-fast startup env guard
- [0003 Webhook Security and Idempotency](../../docs/specs/0003-webhook-security-idempotency/index.md): timing-safe signature verification, isolated rate limiting, and idempotent notification handling
- [0002 Server side price validation](../../docs/specs/0002-server-side-price-validation/index.md): server-side pricing authority and Zod input schema guard
- [0001 Redis Cloud migration](../../docs/specs/0001-redis-cloud-migration.md): rate limiter migration to Redis Cloud client (Assumed)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
