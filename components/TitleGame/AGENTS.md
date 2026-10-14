# TitleGame (Top-Up Flow)

## Overview

This is the main user-facing top-up flow. It lives under `components/TitleGame/` and is composed from three parts: the product picker and customer form, the dialogs for validation and confirmation, and the orchestration layer that calls the payment API.

## Key files

| File | Owns |
|---|---|
| `components/TitleGame/ClientTopUp.tsx` | Product selection, state management, layout shell |
| `components/TitleGame/FormTopUp.tsx` | Customer input form (userId, serverId, email), validation logic |
| `components/TitleGame/TitleGameAlertDialog.tsx` | Validation dialog, confirm dialog, success dialog |
| `app/topup/[titleGame]/page.tsx` | Server Component entry point; loads game data and renders ClientTopUp |
| `lib/datas/gameData.ts` | Static game catalog (id, name, image, requiresServer, serverOptions, instructions) |
| `lib/datas/productData.ts` | Static product catalog (price, currency amounts, featured/popular flags) |

## Conventions

- `ClientTopUp.tsx` is a Client Component that holds all mutable state for the flow (selected product, form values, dialog visibility).
- Server ID (`serverId`) is optional. Show the server selector only when `gameInfo.requiresServer` is `true`.
- Validation happens locally in `FormTopUp.tsx` before any network call. The confirm dialog shows only after all local validation passes.
- The payment call hits `POST /api/payment` passing `productId` and customer details. On `400` validation error, specific field errors are surfaced in the error dialog. On success, the Midtrans Snap popup opens with the returned `token`. The `invoiceUrl` from the response is the fallback redirect if Snap closes early.
- After a successful payment callback from Snap, the user lands on `/invoice/[orderId]`.
- Game and product data currently come from static files in `lib/datas/`. If you move to DB-driven data, update the server component in `app/topup/[titleGame]/page.tsx` to query Prisma instead.

## Gotchas

- Midtrans mode is driven by the `MIDTRANS_IS_PRODUCTION` env var. When going live, set it to `"true"` in the deployment platform and verify the Midtrans client key is the production one.
- `gameInfo.requiresServer` controls whether `serverId` is collected. If a game that does not require a server later gets one added in `gameData.ts`, no code changes are needed in the components.
- The type for AlertDialog props is `TitleGameAlertDialogProps` in `lib/types.ts`. It is large; prefer narrowing it if you add a new dialog rather than expanding the shared interface.

## Related specs

- [0002 Server side price validation](../../docs/specs/0002-server-side-price-validation/index.md): payment request contract and client error handling

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
