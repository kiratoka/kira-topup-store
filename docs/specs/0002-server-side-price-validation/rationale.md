# 0002. Server side price validation: rationale

## Context

The checkout endpoint in `app/api/payment/route.ts` previously accepted a payment request containing both customer information and product details. The endpoint read the product price directly from the client request body and forwarded that nominal value straight to Midtrans Snap and the database invoice record.

Because the client controlled the request body, an attacker or malicious user could intercept the HTTP request and modify the price to an arbitrary number such as 1 IDR for expensive currency packages. The server conducted no check against master product data to verify that the product existed or that the price matched catalog prices.

In addition, input validation on the payment route was loose. Fields like email format, user identifier presence, and server identifier requirements were validated only inside client components. If a client bypassed the browser form, invalid or incomplete records could enter the database and fail downstream processing.

The system needed server authoritative price resolution and strict input schema validation without degrading payment checkout speed or breaking existing client checkout flows.

## Options considered

### Option 1: Fix in place with static product catalog lookup and Zod validation

Validate input payloads using Zod and look up product details from `lib/datas/productData.ts` in memory on the server. The client sends product identifier and customer details. The server verifies the product exists, attaches the official price, and rejects mismatched requests.

**Pros**:
* Zero additional database query overhead during payment creation.
* Uses existing catalog structures already present in `lib/datas/productData.ts`.
* Quick to implement with minimal risk of database migration errors.

**Cons**:
* Price updates require code commits and redeployment until a database catalog is introduced.

### Option 2: Database driven validation via Prisma Product model

Store all products in PostgreSQL and query the `Product` table via Prisma during each checkout request to validate prices dynamically.

**Pros**:
* Allows dynamic price updates in the future via an admin dashboard without redeploying code.

**Cons**:
* Adds database read latency to every checkout request.
* The `Product` table currently has no seed data or admin management tooling.
* Requires database seeding and synchronization with storefront assets before going live.

### Option 3: Hybrid validation with database priority and static fallback

Attempt to query the product price from the database first, falling back to static catalog files if the database returns no record.

**Pros**:
* Smooth migration path if transitioning gradually to database managed catalogs.

**Cons**:
* Dual sources of truth create subtle pricing discrepancies if cache or files desynchronize.
* Unnecessary operational complexity for the current application scale.

## Rationale

Option 1 provides immediate, zero latency security against price tampering. The application currently relies on static data files (`lib/datas/gameData.ts` and `lib/datas/productData.ts`) for all storefront pages. Reading prices from this same source of truth on the server ensures consistency between the display price and the charged price without adding database round trips.

Zod provides declarative, type safe schema validation that integrates cleanly with Next.js App Router route handlers. It provides structured error arrays that can be returned to the client for targeted field error highlighting.

Option 2 and Option 3 add database dependencies and synchronization risks for a catalog that changes infrequently. Moving catalog management to PostgreSQL is better deferred until an administrative back office is introduced.
