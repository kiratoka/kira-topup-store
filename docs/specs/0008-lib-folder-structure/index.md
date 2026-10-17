# 0008. Standardize `lib/` Folder Structure

**Date**: 2026-10-17
**Status**: Accepted

## Summary

Folder `lib/` saat ini berisi 15 file di satu level yang mencampurkan infrastruktur database, cache, payment, security utilities, content helpers, dan tipe domain tanpa kategori yang jelas. Standar ini membagi `lib/` menjadi 6 subfolder berbasis domain (`db/`, `cache/`, `payment/`, `security/`, `content/`, `utils/`) ditambah `types/` untuk tipe domain, sementara `env.ts` tetap di root `lib/` karena ia adalah fondasi bersama untuk semua subfolder. File test tetap co-located di subfolder yang sama dengan file yang diuji. Tidak ada barrel export (index.ts); semua import mengacu langsung ke file spesifik agar tree-shaking Next.js App Router berjalan optimal.

## Decision

**Chosen option**: Option 1: 6 subfolder domain plus `types/` terpisah

Struktur `lib/` baru:

```
lib/
├── env.ts                        ← tetap di root (foundational, diimport oleh db/ dan cache/)
├── db/
│   └── prisma.ts
├── cache/
│   ├── redis.ts
│   ├── rate-limit.ts
│   └── rate-limit.test.ts
├── payment/
│   ├── midtrans.ts
│   ├── midtrans.test.ts
│   └── validations/
│       ├── payment.ts
│       └── payment.test.ts
├── security/
│   ├── masking.ts
│   ├── masking.test.ts
│   ├── errors.ts
│   └── errors.test.ts
├── content/
│   ├── mdx.ts
│   └── datas/
│       ├── gameData.ts
│       ├── productData.ts
│       └── productData.test.ts
├── utils/
│   └── utils.ts
└── types/
    ├── game.ts     ← GameInfo, TopUpProduct, ServerOption, ClientTopUpProps
    ├── payment.ts  ← PaymentRequest, InvoiceData, SnapResponse, CustomerDetails, ProductDetails
    ├── blog.ts     ← BlogPost, PostFrontMatter, Post
    └── ui.ts       ← TitleGameAlertDialogProps
```

**Aturan penempatan** (untuk file baru):

| Subfolder | Berisi | Tidak berisi |
|---|---|---|
| `db/` | Prisma client, ORM helpers | Business logic |
| `cache/` | Redis client, rate limiting, session helpers | Business logic |
| `payment/` | Midtrans config dan helpers, payment validations | Tipe domain (masuk `types/payment.ts`) |
| `security/` | PII masking, API error helpers, sanitization | Rate limiting (ada di `cache/`) |
| `content/` | MDX helpers, static game/product data | Tipe domain |
| `utils/` | UI utilities (cn, formatCurrency), generic helpers | Infrastructure clients |
| `types/` | Shared TypeScript types dan interfaces lintas domain | Business logic, constants |

**`env.ts` di root `lib/`**: tetap di `lib/env.ts` karena diimport oleh `lib/db/prisma.ts` dan `lib/cache/redis.ts`. Memindahkannya ke salah satu subfolder akan membuat subfolder lain bergantung pada domain berbeda secara semantik. Ini satu-satunya file yang diizinkan di level root `lib/` selain subfolder.

**Tidak ada barrel export**: tidak ada `index.ts` di tiap subfolder. Semua import langsung ke file spesifik. Alasan: Next.js App Router mengoptimalkan bundle per route; barrel exports menggagalkan tree-shaking karena setiap import dari `index.ts` memuat seluruh modul.

**Test files co-located**: `*.test.ts` tetap berdampingan dengan file yang diuji di subfolder yang sama.

## Standard definition

**Canonical pattern** (import setelah migrasi):

```typescript
// Database
import { prisma } from '@/lib/db/prisma';

// Cache dan rate limiting
import { getRedis } from '@/lib/cache/redis';
import { rateLimit, getClientIp } from '@/lib/cache/rate-limit';

// Payment
import { getMidtransSnapUrl } from '@/lib/payment/midtrans';
import { paymentRequestSchema } from '@/lib/payment/validations/payment';

// Security
import { apiError } from '@/lib/security/errors';
import { sanitizeInvoice, maskEmail } from '@/lib/security/masking';

// Content
import { getAllPosts, getPostBySlug } from '@/lib/content/mdx';
import { gamesData } from '@/lib/content/datas/gameData';

// Utils
import { cn, formatCurrency } from '@/lib/utils/utils';

// Types (gunakan import type untuk tipe saja)
import type { GameInfo, TopUpProduct } from '@/lib/types/game';
import type { InvoiceData, PaymentRequest } from '@/lib/types/payment';
import type { BlogPost } from '@/lib/types/blog';
import type { TitleGameAlertDialogProps } from '@/lib/types/ui';

// Env (tetap di root lib/)
import '@/lib/env';
import { env } from '@/lib/env';
```

**Replaces**:
- `@/lib/prisma` diganti `@/lib/db/prisma`
- `@/lib/redis` diganti `@/lib/cache/redis`
- `@/lib/rate-limit` diganti `@/lib/cache/rate-limit`
- `@/lib/midtrans` diganti `@/lib/payment/midtrans`
- `@/lib/errors` diganti `@/lib/security/errors`
- `@/lib/masking` diganti `@/lib/security/masking`
- `@/lib/mdx` diganti `@/lib/content/mdx`
- `@/lib/datas/gameData` diganti `@/lib/content/datas/gameData`
- `@/lib/datas/productData` diganti `@/lib/content/datas/productData`
- `@/lib/utils` diganti `@/lib/utils/utils`
- `@/lib/types` (untuk tipe domain) dipecah ke `@/lib/types/game`, `@/lib/types/payment`, `@/lib/types/blog`, atau `@/lib/types/ui`
- `@/lib/validations/payment` diganti `@/lib/payment/validations/payment`

**Enforcement**:
Ditegakkan lewat aturan ESLint `no-restricted-imports` di `eslint.config.mjs` untuk melarang import dari path lama secara otomatis.

**Rollout**:
Satu migrasi PR: pindahkan semua file ke lokasi baru, perbarui seluruh import dalam satu commit, pastikan `npm run build` dan `npm test` hijau sebelum merge.

**Exceptions**:
`env.ts` tetap di `lib/` root. Ini satu-satunya exception yang diizinkan.

## Consequences

**Positive**:
- Developer baru bisa menelusuri `lib/` dan langsung paham domain apa yang tersedia tanpa membaca kode
- Penambahan file baru punya tempat yang jelas, tidak ada ambiguitas "taruh di mana?"
- `types/` terpisah membuat kontrak lintas domain eksplisit dan mudah ditemukan
- Test files co-located mempermudah navigasi dan meningkatkan kemungkinan test diperbarui bersama source

**Negative / tradeoffs**:
- Import path lebih panjang; tradeoff yang disadari dan diterima
- Satu PR migrasi menyentuh sekitar 25 file; ada risiko merge conflict jika ada PR lain sedang aktif
- Tidak ada barrel export berarti IDE tidak menawarkan autocomplete seluruh ekspor subfolder sekaligus

**Neutral**:
- `tsconfig.json` tidak perlu diubah; path alias `@/*` sudah cukup
- Setelah migrasi, `/sync` perlu memperbarui path import di `AGENTS.md` root dan nested context files

## Follow-up

- [x] Setelah `/develop` menyelesaikan migrasi, tambahkan ESLint `no-restricted-imports` rule di `eslint.config.mjs` untuk melarang import dari path lama sehingga konvensi baru ditegakkan secara otomatis
- [x] `/sync` perlu memperbarui `AGENTS.md` root: perbarui baris yang menyebut `lib/prisma.ts`, `lib/errors.ts`, dll menjadi path baru
- [x] Perbarui `components/TitleGame/AGENTS.md` dan `app/api/AGENTS.md` dengan path import baru setelah migrasi selesai
