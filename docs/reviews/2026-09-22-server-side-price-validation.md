# Review, server-side-price-validation, 2026-09-22

**Reviewed by**: Gemini (author on Gemini, reviewed inline)
**Scope**: 8 files, uncommitted changes
**Verdict**: Approve with nits

## Summary

This change secures checkout by moving price resolution entirely to server master data and validating request payloads with Zod. Price tampering through client payloads is completely eliminated, because the payment route resolves nominal amounts directly from the catalog. The implementation preserves backward compatibility for existing callers and includes an extensive test suite of 48 automated tests that all pass cleanly. A few minor polish points around input length bounds and prototype safe dictionary lookups are noted below for future hardening.

## Minor

### 🟡 Prototype property collision in catalog lookup, `lib/datas/productData.ts:422`
**Problem**: The lookup function accesses `productsData[gameId]` directly on an object dictionary. If a caller supplies a JavaScript prototype property name such as `toString` or `constructor` as the game identifier, the lookup resolves to a function on the object prototype rather than an array, causing a runtime exception when `.find()` is invoked.
**Why it matters**: A malicious or unexpected request with a prototype property name triggers an unhandled HTTP 500 error instead of a clean HTTP 400 validation response.
**Suggested fix**: Use `Object.hasOwn(productsData, gameId)` or verify `Array.isArray(gameProducts)` before searching the product array. Apply the same check in `app/api/payment/route.ts:59` for `gamesData`.

### 🟡 Missing maximum length constraints in Zod schema, `lib/validations/payment.ts:3`
**Problem**: The fields `userId`, `serverId`, `gameId`, and `productId` only enforce `.min(1)` without any upper length boundary.
**Why it matters**: Downstream services like Midtrans impose strict character limits (for example, 50 characters on customer name fields and 255 characters on custom fields). An oversized string input passes local Zod parsing, but causes Midtrans Snap to reject the transaction with an upstream failure that surfaces as an HTTP 500.
**Suggested fix**: Add reasonable upper limits such as `.max(50)` on `userId` and `serverId`, and `.max(100)` on `productId` and `gameId`.

### 🟡 Leaking internal error message in server failure responses, `app/api/payment/route.ts:161`
**Problem**: When Midtrans or database operations fail, the catch block sends `error.message` directly back in the JSON body.
**Why it matters**: Database connectivity errors or library internal messages can reveal infrastructure details to public clients.
**Suggested fix**: Return a generic friendly message in the response body while keeping the raw details solely in server logs, as planned in scope slice 4.

## Nits

* ⚪ `components/TitleGame/ClientTopUp.tsx:125`, client displays top level error message only and does not map specific field issues from the `errors` map returned by the server.
* ⚪ `app/api/payment/route.ts:89`, `midtransClient.Snap` is instantiated inside every request handler rather than reused across requests.
* ⚪ `app/api/payment/route.ts:19`, informal humorous rate limit message should be aligned with professional tone per scope item 4.

## Strengths

* Complete elimination of client price tampering by binding Midtrans gross amounts directly to authoritative catalog records.
* Well designed backward compatibility in `paymentRequestSchema` that accepts both new and legacy payloads while safely discarding any client price values.
* Whitelist filtering when persisting customer information into Prisma invoice records, preventing untrusted parameter injection into database JSON fields.
* Strong test coverage with 48 automated tests covering catalog boundaries, rate limiting precedence, input parsing, and error flows.

## Test coverage

The test suite in Vitest covers all acceptance criteria from spec 0002. Unit tests in `lib/validations/payment.test.ts` thoroughly test Zod schemas and edge cases like whitespace trimming and malformed emails. Catalog tests in `lib/datas/productData.test.ts` confirm price integrity, positive integers, and cross game identifier safety. Route integration tests in `app/api/payment/route.test.ts` verify rate limiting priority, 400 validation responses, canonical price enforcement, and invoice snapshots.
