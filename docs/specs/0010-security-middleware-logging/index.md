# 0010. Security middleware and structured logging

**Date**: 2026-10-17
**Status**: In Progress

## Summary

Proyek ini menstandarkan dua kemampuan lintas proyek sekaligus: (1) middleware Next.js global yang memvalidasi header request API dan menyuntikkan request ID untuk pelacakan, dan (2) logger terpusat berbasis Pino (pustaka logging JSON) yang menggantikan seluruh `console.*` yang tersebar di sisi server. Kedua kemampuan ini saling terhubung karena middleware menyuntikkan request ID yang kemudian melekat pada setiap baris log. Hasilnya, setiap request API dapat dilacak dari ujung ke ujung lewat satu ID unik, data sensitif otomatis disunting dari log, dan level pencatatan menyesuaikan lingkungan.

## Requirements

**User stories**:
- Sebagai developer, saya ingin setiap request API memiliki request ID unik sehingga saya dapat melacak alur satu request dari awal hingga akhir di log.
- Sebagai developer, saya ingin output log dalam format JSON terstruktur sehingga platform monitoring dapat mengindeks dan memfilter log secara otomatis.
- Sebagai developer, saya ingin data sensitif (email, server key, token) otomatis disunting dari log sehingga tidak ada kebocoran data ke stdout.
- Sebagai operator, saya ingin request POST tanpa header `Content-Type: application/json` ditolak oleh middleware sehingga API hanya memproses payload yang valid.

**Acceptance criteria** (kontrak yang dibangun `/develop` dan dicek `/check verify`):
- **AC-1**: File `middleware.ts` di root project memproses semua request yang cocok dengan matcher `/api/:path*`, menyuntikkan header `X-Request-Id` (nanoid 21 karakter) pada setiap request, dan mengembalikan header yang sama di response.
- **AC-2**: Middleware menolak request `POST` ke rute API (kecuali `POST /api/payment/notification`) yang tidak memiliki header `Content-Type` mengandung `application/json`, dengan response 415 menggunakan format `apiError`.
- **AC-3**: Middleware memeriksa header `Origin` atau `Referer` pada request `POST` non webhook dan menolak request dari origin yang tidak diizinkan (daftar origin dari env var `ALLOWED_ORIGINS`, default ke `*` di development).
- **AC-4**: File `lib/logging/logger.ts` mengekspor root logger Pino dengan konfigurasi: level `warn` di production, level `debug` di development, dapat di-override via env var `LOG_LEVEL`.
- **AC-5**: Root logger menggunakan redaction paths bawaan Pino untuk menyunting field `email`, `serverKey`, `server_key`, `token`, `snap_token`, `password`, `secret`, `ip`, `ipAddress`, `ip_address`, dan `connectionString` dari seluruh output log.
- **AC-6**: Empat child logger diekspor dari `lib/logging/logger.ts`: `paymentLogger`, `webhookLogger`, `redisLogger`, `invoiceLogger`, masing masing dengan field `domain` yang sesuai.
- **AC-7**: Seluruh `console.error`, `console.warn`, dan `console.log` di 6 file server side (`app/api/payment/route.ts`, `app/api/payment/notification/route.ts`, `app/api/invoice/route.ts`, `app/api/invoice/[orderId]/route.ts`, `lib/cache/redis.ts`, `lib/cache/rate-limit.ts`) diganti dengan panggilan child logger yang sesuai domain.
- **AC-8**: Di development, output log menggunakan `pino-pretty` (human readable, colorized). Di production, output adalah raw JSON ke stdout.
- **AC-9**: Logger bersifat fail open: jika terjadi error saat menulis log, request tetap dilanjutkan tanpa crash.
- **AC-10**: `console.*` di file client side (`ClientTopUp.tsx`, `Invoice.tsx`) tidak diubah (di luar cakupan).

## Decision

**Chosen option**: Pino sebagai structured logger + Next.js middleware untuk validasi header dan request ID injection.

Pino dipilih karena native JSON output, redaction bawaan, child logger per domain, dan performa ~30x lebih cepat dari Winston. Middleware Next.js di root project memvalidasi Content-Type, Origin, dan menyuntikkan request ID menggunakan nanoid (sudah menjadi dependency).

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents@nextjs-app-router-patterns`, `.agents/skills/nextjs-app-router-patterns/`) · `zod` (`pproenca/dot-skills@zod`, `.agents/skills/zod/`)

## Standard definition

**Canonical pattern**:

```typescript
// lib/logging/logger.ts — root logger + child loggers
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
  redact: {
    paths: [
      'email', '*.email', '*.*.email',
      'serverKey', '*.serverKey', 'server_key', '*.server_key',
      'token', '*.token', 'snap_token', '*.snap_token',
      'password', '*.password',
      'secret', '*.secret',
      'ip', '*.ip', 'ipAddress', '*.ipAddress', 'ip_address', '*.ip_address',
      'connectionString', '*.connectionString',
    ],
    censor: '[REDACTED]',
  },
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
});

export const paymentLogger = logger.child({ domain: 'payment' });
export const webhookLogger = logger.child({ domain: 'webhook' });
export const redisLogger = logger.child({ domain: 'redis' });
export const invoiceLogger = logger.child({ domain: 'invoice' });
```

```typescript
// middleware.ts — Next.js middleware
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

const WEBHOOK_PATH = '/api/payment/notification';

export function middleware(request: NextRequest) {
  const requestId = nanoid();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Content-Type check for POST (exclude webhook)
  if (
    request.method === 'POST' &&
    request.nextUrl.pathname !== WEBHOOK_PATH
  ) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Content-Type harus application/json' },
        { status: 415, headers: { 'x-request-id': requestId } }
      );
    }
  }

  // Origin check for POST (exclude webhook)
  if (
    request.method === 'POST' &&
    request.nextUrl.pathname !== WEBHOOK_PATH
  ) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    if (!allowedOrigins.includes('*')) {
      const origin = request.headers.get('origin')
        || request.headers.get('referer')
        || '';
      const isAllowed = allowedOrigins.some((o) => origin.startsWith(o.trim()));
      if (!isAllowed) {
        return NextResponse.json(
          { success: false, message: 'Origin tidak diizinkan' },
          { status: 403, headers: { 'x-request-id': requestId } }
        );
      }
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

```typescript
// Penggunaan di route handler — contoh penggantian console.*
import { paymentLogger } from '@/lib/logging/logger';

// Sebelum (salah):
console.error('Midtrans Error:', error);

// Sesudah (benar):
paymentLogger.error({ err: error }, 'Midtrans Error');
```

**Replaces**:
- `console.error('...', error)` → `domainLogger.error({ err: error }, 'pesan')`
- `console.warn('...')` → `domainLogger.warn('pesan')` atau `domainLogger.warn({ detail }, 'pesan')`
- `console.log('...')` → `domainLogger.info({ detail }, 'pesan')` atau `domainLogger.debug({ detail }, 'pesan')`
- Tidak ada middleware sebelumnya (validasi header dilakukan ad hoc di tiap route)

**Enforcement**:
- ESLint rule `no-console` (severity `error`) diterapkan pada seluruh file di `app/api/` dan `lib/`, dengan override `warn` untuk file di `components/` (client side).
- Konfigurasi di `.eslintrc` atau `eslint.config.mjs`.

**Rollout**:
- Single migration PR: semua 15 `console.*` calls di 6 file server side diganti sekaligus, karena jumlahnya masih kecil. ESLint rule `no-console` diaktifkan di PR yang sama untuk mencegah regresi.

**Exceptions**:
- File client side React components (`components/`) diizinkan menggunakan `console.*` di browser (ESLint override `warn`, bukan `error`).
- Webhook endpoint (`/api/payment/notification`) di-exclude dari Content-Type validation di middleware karena Midtrans mengirim notification dengan format yang bervariasi dan sudah punya signature verification sendiri.

**Key invariants**:
- Request ID (`X-Request-Id`) harus ada di setiap response API, baik sukses maupun error.
- Logger tidak boleh meng-crash request. Jika Pino gagal menulis ke stdout, request tetap dilanjutkan (fail open).
- Redaction harus aktif di semua environment, tidak hanya production.
- Prisma logging tetap dikelola oleh konfigurasi conditional di `lib/db/prisma.ts` (spec 0009), tidak dialihkan ke Pino.

**Configuration required**:
- `LOG_LEVEL`: (opsional) Override level log default. Nilai: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Jika tidak di-set, default `warn` di production dan `debug` di development.
- `ALLOWED_ORIGINS`: (opsional) Daftar origin yang diizinkan, dipisah koma (contoh: `https://kiratopup.com,https://www.kiratopup.com`). Default `*` (semua diizinkan, untuk development).

**Critical test scenarios** (setiap skenario memetakan ke acceptance criteria di Requirements):
- Happy path: request POST `/api/payment` dengan `Content-Type: application/json` lolos middleware, mendapat header `X-Request-Id` di response, verifies **AC-1**, **AC-2**
- Content-Type rejection: request POST `/api/payment` tanpa header `Content-Type: application/json` mendapat response 415, verifies **AC-2**
- Webhook bypass: request POST `/api/payment/notification` tanpa `Content-Type: application/json` lolos middleware tanpa error 415, verifies **AC-2**
- Origin rejection: request POST dengan `Origin` yang tidak ada di `ALLOWED_ORIGINS` mendapat response 403, verifies **AC-3**
- Structured log output: panggilan `paymentLogger.error({ err }, 'Midtrans Error')` menghasilkan JSON dengan field `domain: "payment"`, `level`, `msg`, dan `err`, verifies **AC-6**, **AC-7**
- Redaction: panggilan `webhookLogger.info({ email: 'user@test.com' }, 'test')` menghasilkan output dengan `email: "[REDACTED]"`, verifies **AC-5**
- Log level override: set `LOG_LEVEL=debug` di production, logger mengeluarkan log level debug, verifies **AC-4**
- Fail open: jika stdout stream error, request tetap dilanjutkan tanpa crash, verifies **AC-9**

## Build plan

Urutan mengikuti pendekatan Tracer Bullet: satu thread tipis end to end terlebih dahulu (logger + middleware + satu route), lalu melebarkan ke seluruh file.

- [x] 1. Install `pino` dan `pino-pretty` (devDependency), buat `lib/logging/logger.ts` dengan root logger, redaction config, dan 4 child logger exports, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-8**, **AC-9**
- [x] 2. Buat `middleware.ts` di root project dengan matcher `/api/:path*`, request ID injection via nanoid, Content-Type validation (exclude webhook), dan Origin check, satisfies **AC-1**, **AC-2**, **AC-3**
- [x] 3. Ganti `console.*` di `app/api/payment/route.ts` dengan `paymentLogger` (thread tipis pertama: satu route end to end dari middleware sampai log), satisfies **AC-7**
- [x] 4. Ganti `console.*` di `app/api/payment/notification/route.ts` dengan `webhookLogger`, satisfies **AC-7**
- [x] 5. Ganti `console.*` di `app/api/invoice/route.ts` dan `app/api/invoice/[orderId]/route.ts` dengan `invoiceLogger`, satisfies **AC-7**
- [x] 6. Ganti `console.*` di `lib/cache/redis.ts` dan `lib/cache/rate-limit.ts` dengan `redisLogger`, satisfies **AC-7**
- [x] 7. Tambah ESLint rule `no-console` error di `app/api/` dan `lib/`, override `warn` di `components/`, satisfies **AC-7**, **AC-10**
- [x] 8. Unit test untuk logger (redaction, child logger, level override) dan integration test untuk middleware (Content-Type, Origin, request ID, webhook bypass), satisfies **AC-1** sampai **AC-9**

## Consequences

**Positive**:
- Seluruh log API dalam format JSON terstruktur, memudahkan pencarian dan filtering di platform monitoring.
- Request ID end to end memungkinkan pelacakan satu request dari masuk hingga keluar.
- Data sensitif otomatis disunting, mengurangi risiko kebocoran.
- ESLint `no-console` mencegah regresi ke `console.*` di masa depan.

**Negative / tradeoffs**:
- Menambah dependency baru (`pino`, `pino-pretty`) ke project.
- Developer harus mengimpor child logger yang sesuai domain, bukan langsung `console.log` (sedikit lebih verbose).
- `pino-pretty` hanya untuk development; jika developer tidak familiar, output JSON mentah di production bisa terasa sulit dibaca saat debugging langsung di terminal.

**Neutral**:
- Client side `console.*` tidak diubah, konsisten dengan keputusan bahwa logger server side tidak relevan di browser.
- Prisma logging tetap terpisah (spec 0009), tidak digabung ke Pino. Ini bisa diintegrasikan di masa depan jika diinginkan.

## Follow-up

- [ ] Pertimbangkan integrasi Prisma logging (spec 0009) ke Pino child logger di masa depan untuk unified log output.
- [ ] Tambahkan request ID ke context Prisma logging jika diperlukan untuk database query tracing.
- [ ] Evaluasi apakah `ALLOWED_ORIGINS` perlu dipindah ke `lib/env.ts` dengan validasi Zod (saat ini opsional, belum wajib).

## Rationale

Penalaran lengkap dan opsi yang dipertimbangkan: lihat [rationale.md](rationale.md).
