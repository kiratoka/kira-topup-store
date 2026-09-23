# API Routes (Payment)

## Overview

Handles payment creation and Midtrans webhook notifications. Two routes live here: one creates a Snap transaction and stores an invoice, and one receives and verifies Midtrans payment status updates. Both use the `prisma` singleton and run in the Next.js Edge-compatible runtime.

## Key files

| File | Owns |
|---|---|
| `app/api/payment/route.ts` | `POST /api/payment` — creates Midtrans Snap transaction, saves Invoice to DB |
| `app/api/payment/notification/route.ts` | `POST /api/payment/notification` — Midtrans webhook; verifies signature, updates Invoice status |
| `lib/rate-limit.ts` | Sliding window rate limiter backed by Redis Cloud, with trusted IP extraction |
| `lib/redis.ts` | Redis Cloud TCP singleton client with fallback error handling |
| `lib/validations/payment.ts` | Strict Zod validation schemas (`paymentRequestSchema`) and error formatters |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/types.ts` | `PaymentRequest`, `InvoiceData`, `SnapResponse`, `CustomerDetails`, `ProductDetails` |
| `prisma/schema.prisma` | DB schema: `Invoice`, `Game`, `Product` models |

## Conventions

- Every `POST` route calls `rateLimit(ip, 10, 60_000)` at the top before any business logic. The IP is resolved using `getClientIp(req)` from `lib/rate-limit.ts`, which prioritizes trusted reverse proxy headers (`x-real-ip`, `cf-connecting-ip`) over `x-forwarded-for` to prevent IP spoofing.
- Pricing and item details in `POST /api/payment` are resolved authoritatively from `lib/datas/productData.ts` (`getProductById`); client-submitted prices are ignored.
- Incoming request payloads to `POST /api/payment` are strictly parsed and validated using Zod (`paymentRequestSchema` from `lib/validations/payment.ts`) before creating transactions or DB records.
- Midtrans runs in **sandbox mode** (`isProduction: false`). Both payment creation and notification handling must flip this flag when going to production.
- Webhook signature verification: `SHA-512(orderId + statusCode + grossAmount + serverKey)` must match the `signature_key` in the request body. Reject with `403` on mismatch.
- After signature check, call `apiClient.transaction.notification(notification)` to get the canonical status. Do not trust raw request body for `transaction_status`.
- Invoice status mapping: `capture` or `settlement` → `success` (unless fraud challenge → `pending`); `cancel`, `deny`, `expire` → `failed`; all else → `pending`.
- Customer info stored as `Json` in DB. Access via `invoice.customer` which matches `CustomerDetails`.
- Game custom data passed to Midtrans via `custom_field1` (gameId), `custom_field2` (serverId), `custom_field3` (userId).

## Gotchas

- `isProduction: false` appears in **both** `route.ts` and `notification/route.ts`. Change both when going live.
- The rate limiter uses two Redis keys per IP (`rate-limit:<ip>` and `rate-limit:<ip>:resetTime`). The TTL is set only on the count key; if Redis restarts between the window update and the TTL set, the count key may outlive the window. This is low risk in production but worth noting.
- Automated test suite covers payment route (`app/api/payment/route.test.ts`) and schema validation with Vitest. For webhook notifications, manually verify the Midtrans sandbox flow and use Midtrans's notification tester to confirm.

## Related specs

- [0002 Server side price validation](../../docs/specs/0002-server-side-price-validation/index.md): server-side pricing authority and Zod input schema guard
- [0001 Redis Cloud migration](../../docs/specs/0001-redis-cloud-migration.md): rate limiter migration to Redis Cloud client (Assumed)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
