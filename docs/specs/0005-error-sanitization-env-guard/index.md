# 0005. Error sanitization and environment guard

**Date**: 2026-09-26
**Status**: Accepted

## Summary

Spec ini menetapkan dua standar yang berlaku bersamaan di seluruh rute API publik: (1) setiap respons galat harus menggunakan shape seragam tanpa data teknis internal yang bocor ke klien, dan (2) variabel lingkungan wajib divalidasi saat modul dimuat agar aplikasi gagal cepat sebelum traffic masuk. Standar ini menutup dua celah produksi: satu rute yang kini meneruskan `error.message` langsung ke klien, dan tidak adanya penjaga env yang mencegah server berjalan tanpa konfigurasi kritis.

## Requirements

**User stories**:
- Sebagai pengguna yang menerima galat dari API, saya ingin pesan galat yang jelas dalam Bahasa Indonesia tanpa informasi teknis internal agar saya bisa memahami apa yang terjadi tanpa mengekspos internal sistem.
- Sebagai developer yang mendeploy ke produksi, saya ingin aplikasi gagal cepat dengan pesan yang jelas jika variabel lingkungan wajib tidak ada, agar masalah konfigurasi terdeteksi sebelum traffic masuk.

**Acceptance criteria**:
- **AC-1**: Seluruh rute API publik (`POST /api/payment`, `POST /api/payment/notification`, `GET /api/invoice/[orderId]`) mengembalikan shape `{ success: false, message: string, code?: string }` untuk semua kondisi galat, tanpa field tambahan yang mengandung data teknis internal seperti stack trace atau raw exception message.
- **AC-2**: Field `error: errorMessage` yang ada di `GET /api/invoice/[orderId]` (yang kini meneruskan `error.message` langsung) dihapus dari respons publik; galat internal hanya tercatat di `console.error` sisi server.
- **AC-3**: Seluruh pesan `message` di semua rute menggunakan Bahasa Indonesia dan tidak mengandung nama file, nama fungsi, path internal, atau jejak tumpukan.
- **AC-4**: Pesan 500 di `POST /api/payment/notification` yang kini berbunyi `'Failed to process notification'` diganti menjadi pesan berbahasa Indonesia.
- **AC-5**: File `lib/env.ts` dibuat, memuat Zod schema yang memvalidasi lima variabel lingkungan wajib (`MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`), dan melempar Error deskriptif saat startup jika ada yang tidak terdefinisi.
- **AC-6**: Pesan Error dari `lib/env.ts` menyebutkan nama variabel yang kurang secara eksplisit (misalnya `"Missing required env var: MIDTRANS_SERVER_KEY"`) agar developer bisa langsung tahu apa yang perlu diisi.
- **AC-7**: `lib/env.ts` diimpor di `lib/prisma.ts` dan `lib/rate-limit.ts` sehingga validasi berjalan sebelum rute manapun dapat melayani request.

## Decision

**Chosen option**: Option 1: Single migration PR (fix semua file sekaligus + helper terpusat)

Buat dua lib baru (`lib/errors.ts`, `lib/env.ts`) dan perbaiki ketiga rute sekaligus dalam satu PR karena bug aktif di invoice route tidak bisa ditunda dan lingkup perubahannya kecil. Detail pembahasan opsi dan alasan pemilihan arsitektur selengkapnya ada pada [rationale.md](rationale.md).

**Implementation skills**: `zod` (`pproenca/dot-skills@zod`, `.agents/skills/zod/`) · `nextjs-app-router-patterns` (`wshobson/agents@nextjs-app-router-patterns`, `.agents/skills/nextjs-app-router-patterns/`)

## Standard definition

**Canonical pattern** untuk respons galat rute API:

```typescript
// lib/errors.ts
import { NextResponse } from "next/server";

export function apiError(
  message: string,
  status: number,
  code?: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { success: false, message, ...(code ? { code } : {}), ...(extra ? extra : {}) },
    { status }
  );
}
```

**Canonical pattern** untuk env guard:

```typescript
// lib/env.ts
import { z } from "zod";

export const envSchema = z.object({
  MIDTRANS_SERVER_KEY: z.string().min(1, 'MIDTRANS_SERVER_KEY is required'),
  MIDTRANS_IS_PRODUCTION: z.string().min(1, 'MIDTRANS_IS_PRODUCTION is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.string().min(1, 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ');
  const prefix = parsed.error.issues.length === 1 ? 'Missing required env var' : 'Missing required env var(s)';
  throw new Error(`${prefix}: ${missing}`);
}

export const env = parsed.data;
```

```typescript
// lib/prisma.ts (tambahkan di baris pertama)
import "@/lib/env";
// ... sisa kode prisma singleton yang ada
```

**Replaces**:
- `return NextResponse.json({ success: false, message: '...', error: errorMessage }, { status: 500 })` di invoice route (bocor error.message ke klien)
- Pesan berbahasa Inggris `'Failed to process notification'` di notification route
- Pengecekan `process.env.MIDTRANS_SERVER_KEY || ''` tanpa validasi keberadaannya

**Enforcement**:
Enforcement dilakukan melalui: (1) helper `apiError` terpusat yang membuat pola benar lebih mudah dari pola salah, (2) konvensi di `app/api/AGENTS.md` yang diupdate oleh `/sync` setelah implementasi, (3) unit test otomatis di Vitest.

**Rollout**:
Single migration PR yang menyentuh semua tiga rute dan menambahkan dua lib file sekaligus. Tidak ada migrasi bertahap karena lingkup kecil dan bug aktif membutuhkan perbaikan segera.

**Exceptions**:
Webhook notification route (`POST /api/payment/notification`) tetap dapat menggunakan body `{ success: true }` tanpa field `message` untuk respons sukses, konsisten dengan ekspektasi Midtrans yang tidak memproses body sukses.

## Consequences

**Positive**:
- Bug aktif (kebocoran `error.message`) di invoice route tertutup
- Shape respons galat konsisten di seluruh API, mempermudah penanganan error di sisi klien
- Env guard mencegah deployment berjalan dengan konfigurasi tidak lengkap
- Semua pesan user-facing konsisten dalam Bahasa Indonesia

**Negative / tradeoffs**:
- `lib/env.ts` melempar Error saat module diimpor, yang berarti unit test yang tidak menyediakan semua env var akan gagal. Test environment menyediakan fallback konfigurasi via `.env.test` dan `vitest.config.ts`.

**Neutral**:
- `lib/errors.ts` adalah file baru tipis (< 20 baris), mudah dipelihara.
- Rute yang sudah menggunakan `NextResponse.json({ success: false, message })` secara langsung dimigrasi ke `apiError()` secara konsisten.

## Follow-up

- [ ] Setelah implementasi selesai, jalankan `/sync` untuk memperbarui `app/api/AGENTS.md` dengan konvensi `apiError()` dan persyaratan `lib/env.ts`.
- [x] Tambahkan `.env.test` dan konfigurasi environment di `vitest.config.ts` agar unit test tidak gagal akibat env guard.
