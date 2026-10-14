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
**Buka window baru?**: [Ya ✦ / Tidak] — [alasan 1 kalimat berdasarkan sinyal di bawah]

**Prompt siap pakai** (copy-paste):
```
[prompt lengkap dalam Bahasa Indonesia, siap dipakai langsung oleh pengguna di sesi berikutnya, termasuk mention file yang relevan jika ada]
```
```

### Kerangka Keputusan: Buka Window Baru?

AI **wajib mengevaluasi 5 sinyal** sebelum memberi rekomendasi. Jawab setiap sinyal, lalu ambil keputusan dari mayoritas sinyal yang aktif.

#### Sinyal 1 — Beban Konteks Saat Ini 🔴 Berat → Buka Baru
Buka window baru jika **salah satu** kondisi berikut terpenuhi:
- Sesi sudah melewati **3+ tool call besar** (file baca/tulis, command, browser) — konteks sudah berat, respons berikutnya akan lebih lambat dan kurang fokus.
- Sesi sudah membahas **2+ topik berbeda** (misal: debug lalu planning lalu implementasi) — konteks tercampur, model sulit fokus pada topik baru.
- Percakapan sudah **panjang dan berulang** — ada risiko model "lupa" konteks awal dan mengulang pekerjaan.
- Sebaliknya: sesi baru dimulai, konteks masih bersih → **Tidak perlu buka baru**.

#### Sinyal 2 — Ganti Skill / Domain 🔴 Beda → Buka Baru
Buka window baru jika langkah selanjutnya **menggunakan skill berbeda** dari yang dipakai di sesi ini:
- `/scope` → `/architect` → Buka Baru (dari planning ke design, domain berbeda)
- `/architect` → `/develop` → Buka Baru (dari design ke build, model perlu fokus baru)
- `/develop` → `/check` → Buka Baru (dari build ke review, perspektif harus segar)
- `/develop` → `/test` → Buka Baru (dari build ke test, konteks implementasi tidak dibutuhkan)
- `/debug` → `/develop` → Buka Baru setelah fix dikonfirmasi (agar sesi develop bersih)
- Skill **sama, objek sama** (misal: masih `/develop` fitur yang sama) → **Tidak perlu buka baru**.

#### Sinyal 3 — Lanjutan Langsung vs Tugas Baru 🟡 Pertimbangkan
Tetap di sesi yang sama jika:
- Pengguna minta **revisi atau koreksi** dari output yang baru saja dibuat (misal: "ubah wording ini", "tambah satu field").
- Pengguna bertanya **follow-up question** tentang apa yang baru dijelaskan.
- Langkah selanjutnya adalah **lanjutan alami satu alur** tanpa ganti domain (misal: `/scope` plan → `/scope` add satu fitur lagi).

Buka window baru jika:
- Tugas berikutnya adalah **fitur atau area baru** yang tidak punya kaitan langsung dengan apa yang baru dikerjakan.
- Skill sama tapi **objek/fitur berbeda** (misal: `/develop` fitur A selesai → `/develop` fitur B).

#### Sinyal 4 — Kualitas Output yang Dibutuhkan 🔴 Kritis → Buka Baru
Buka window baru jika pekerjaan berikutnya membutuhkan **fokus penuh model tanpa noise**:
- `/check review` — harus dilakukan di sesi baru dengan model "segar" yang belum pernah melihat kode tersebut, agar review tidak bias.
- `/architect` untuk keputusan besar — model perlu membaca spec dan kode tanpa distraksi dari percakapan panjang sebelumnya.
- Debugging pelik dengan banyak file — sesi bersih membantu model melakukan root cause analysis lebih akurat.
- Output rutin seperti `/scope add` atau revisi kecil — tidak perlu sesi baru.

#### Sinyal 5 — Efisiensi Token 🟡 Pertimbangkan
- Jika prompt siap pakai bisa merangkum semua konteks yang dibutuhkan dalam **< 5 kalimat** → Buka Baru lebih hemat (model tidak perlu membaca seluruh riwayat).
- Jika konteks yang dibutuhkan sangat panjang dan sulit dirangkum → **Tetap di sesi ini** lebih efisien daripada membuat prompt transfer yang panjang.
- Gunakan `@[nama-file]` di prompt siap pakai untuk menyertakan file spesifik tanpa perlu copy-paste isi file.

### Tabel Keputusan Cepat

| Situasi | Sinyal Dominan | Rekomendasi |
|---|---|---|
| Sesi baru dimulai, langsung ke langkah berikutnya | 1 (bersih) | Tidak buka baru |
| Selesai `/scope`, mau `/architect` | 2 (ganti skill) | **Buka baru** ✦ |
| Selesai `/architect`, mau `/develop` | 2 (ganti skill) | **Buka baru** ✦ |
| Selesai `/develop`, mau `/check verify` | 2 (ganti skill) | **Buka baru** ✦ |
| Selesai `/check verify`, mau `/test` | 2 (ganti skill) | **Buka baru** ✦ |
| `/develop` fitur A selesai, mau `/develop` fitur B | 3 (objek baru) | **Buka baru** ✦ |
| Revisi kecil dari output barusan | 3 (lanjutan langsung) | Tidak buka baru |
| Follow-up question tentang topik yang sama | 3 (lanjutan langsung) | Tidak buka baru |
| Mau `/check review` (review harus segar) | 4 (kualitas kritis) | **Buka baru** ✦ |
| Sesi sudah 3+ topik berbeda | 1 (konteks berat) | **Buka baru** ✦ |
| `/scope` add satu fitur lagi, konteks masih bersih | 1+3 (ringan+lanjutan) | Tidak buka baru |
| Debug kecil, fix 1 file, selesai dalam 1 langkah | 1+3 (ringan+lanjutan) | Tidak buka baru |

### Aturan Format Tambahan
- Prompt siap pakai harus cukup lengkap sehingga AI di sesi baru bisa langsung bekerja tanpa penjelasan tambahan dari pengguna. Sertakan: tujuan, file relevan (gunakan `@[nama-file]`), dan konteks singkat hasil sesi ini.
- Jika ada lebih dari satu opsi langkah selanjutnya yang sama-sama masuk akal, tampilkan keduanya dengan rekomendasi yang mana lebih baik dikerjakan lebih dulu.
- Jika rekomendasi adalah **Buka baru**, tandai dengan simbol **✦** agar mudah dikenali.
- Jika rekomendasi adalah **Tidak buka baru**, cukup tulis "Tidak" tanpa simbol tambahan.

## Rules

- Use the Next.js App Router exclusively. No Pages Router.
- Prefer Server Components for data fetching; use Client Components only when interactivity is needed.
- All write API routes (`POST`) must apply the `rateLimit` helper from `lib/rate-limit.ts` before any business logic.
- Midtrans webhook signature must be verified via SHA-512 hash using timing-safe comparison before processing (see `app/api/payment/notification/route.ts`).
- Shared types live in `lib/types.ts`. Game and product data live in `lib/datas/`. Never duplicate type definitions.
- Use `nanoid` for unique IDs (already a dependency). Do not use `Math.random()` or `Date.now()` for IDs.
- Prisma client is a singleton exported from `lib/prisma.ts`. Never instantiate it directly in routes.
- UI components come from `components/ui/` (shadcn wrappers). Add new shadcn components there; do not build from scratch.
- Midtrans mode is driven by `MIDTRANS_IS_PRODUCTION` env var (string `"true"` = production). Set this in your deployment platform. Never hardcode it.
- All public API error responses must use the `apiError` helper from `lib/errors.ts`; never leak internal error details or raw exception messages.

## Agent skills

- [nextjs-app-router-patterns](.agents/skills/nextjs-app-router-patterns/): `wshobson/agents@nextjs-app-router-patterns`, Next.js App Router conventions, data fetching patterns, and caching
- [redis-core](.agents/skills/redis-core/): `redis/agent-skills@redis-core`, Redis command conventions, data modeling, and performance patterns
- [vitest](.agents/skills/vitest/): `antfu/skills@vitest`, Vitest unit and integration test runner conventions and assertions
- [zod](.agents/skills/zod/): `pproenca/dot-skills@zod`, Zod schema validation, type parsing, and safe parsing patterns

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->
- [components/TitleGame/AGENTS.md](components/TitleGame/AGENTS.md): top-up flow UI state machine and payment orchestration
- [app/api/AGENTS.md](app/api/AGENTS.md): payment API routes, Midtrans integration, and webhook handling
- [docs/architecture/README.md](docs/architecture/README.md): system architecture diagrams, checkout and webhook sequence flows, security layers, and maintenance matrix

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
