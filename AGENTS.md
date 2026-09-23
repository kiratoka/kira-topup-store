# Kira Topup Store

## Stack

- **Language / Runtime**: TypeScript, Node 20
- **Framework**: Next.js 16 (App Router)
- **Key dependencies**: Prisma 6 (PostgreSQL), Midtrans (payment gateway), Upstash Redis (rate limiting), Tailwind CSS v3, shadcn/ui (Radix primitives)
- **Package manager**: npm

## Build approach

Tracer Bullet (setiap fitur dibangun menyeluruh dari data hingga antarmuka).

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build (runs prisma generate first)
npm run build

# Lint
npm run lint

# Test
npm test

# Prisma: generate client
npx prisma generate

# Prisma: push schema changes
npx prisma db push
```

## Language

- **Selalu gunakan Bahasa Indonesia** untuk semua respons, dokumen yang dibuat oleh skill (`/scope`, `/architect`, `/develop`, `/check`, `/audit`, `/sync`, `/debug`, `/test`, `/document`), dan komunikasi dengan pengguna — kecuali konten teknis seperti nama variabel, kode, dan komentar kode yang harus tetap dalam bahasa Inggris.

## Interaction Style

Di **akhir setiap respons** (kecuali jika hanya menjawab pertanyaan kecil), AI wajib menyertakan blok berikut agar pengguna tahu apa yang harus dilakukan selanjutnya:

```
---
### ⏭️ Langkah Selanjutnya

**Tindakan**: [deskripsi singkat apa yang perlu dilakukan]
**Skill**: `/nama-skill` — [alasan singkat]
**Buka window baru?**: Ya / Tidak — [alasan singkat]

**Prompt siap pakai** (copy-paste):
```
[prompt lengkap dalam Bahasa Indonesia, siap dipakai langsung oleh pengguna di sesi berikutnya, termasuk mention file yang relevan jika ada]
```
```

Aturan tambahan:
- Jika langkah selanjutnya adalah tugas baru yang tidak berkaitan dengan konteks sesi ini → rekomendasikan **Buka window baru: Ya**.
- Jika langkah selanjutnya adalah iterasi/revisi kecil langsung dari apa yang baru dikerjakan → **Buka window baru: Tidak**.
- Prompt siap pakai harus cukup lengkap sehingga AI di sesi baru bisa langsung bekerja tanpa penjelasan tambahan dari pengguna (sertakan file yang relevan, tujuan, dan konteks).
- Jika ada lebih dari satu opsi langkah selanjutnya, tampilkan keduanya.

## Rules

- Use the Next.js App Router exclusively. No Pages Router.
- Prefer Server Components for data fetching; use Client Components only when interactivity is needed.
- All write API routes (`POST`) must apply the `rateLimit` helper from `lib/rate-limit.ts` before any business logic.
- Midtrans webhook signature must be verified via SHA-512 hash before processing (see `app/api/payment/notification/route.ts`).
- Shared types live in `lib/types.ts`. Game and product data live in `lib/datas/`. Never duplicate type definitions.
- Use `nanoid` for unique IDs (already a dependency). Do not use `Math.random()` or `Date.now()` for IDs.
- Prisma client is a singleton exported from `lib/prisma.ts`. Never instantiate it directly in routes.
- UI components come from `components/ui/` (shadcn wrappers). Add new shadcn components there; do not build from scratch.
- `isProduction: false` is hardcoded in `app/api/payment/route.ts` (Midtrans sandbox). Switch both instances to `true` before going live.

## Agent skills

- [nextjs-app-router-patterns](.agents/skills/nextjs-app-router-patterns/): `wshobson/agents@nextjs-app-router-patterns`, Next.js App Router conventions, data fetching patterns, and caching
- [redis-core](.agents/skills/redis-core/): `redis/agent-skills@redis-core`, Redis command conventions, data modeling, and performance patterns
- [vitest](.agents/skills/vitest/): `antfu/skills@vitest`, Vitest unit and integration test runner conventions and assertions
- [zod](.agents/skills/zod/): `pproenca/dot-skills@zod`, Zod schema validation, type parsing, and safe parsing patterns

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->
- [components/TitleGame/AGENTS.md](components/TitleGame/AGENTS.md): top-up flow UI state machine and payment orchestration
- [app/api/AGENTS.md](app/api/AGENTS.md): payment API routes, Midtrans integration, and webhook handling

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
