# 0009 · conditional-prisma-logging

**Status**: Accepted
**Date**: 2026-10-17
**Ratified by**: user, via direct instruction (S1 & Pino dbLogger integration)

## Owed decision
Konfigurasi logging query database pada Prisma Client agar tidak membocorkan data sensitif pengguna ke stdout pada lingkungan produksi dan terintegrasi penuh ke structured JSON logger (Pino).

## Assumption built on
1. Di lingkungan produksi (`NODE_ENV === 'production'`), Prisma Client hanya mendengarkan event level `error` dan `warn` yang dialirkan ke `dbLogger` (`domain: 'db'`) guna mencegah eksposur query database ke monitoring log pihak ketiga sekaligus memanfaatkan fitur auto-redaction Pino.
2. Di lingkungan non-produksi (development), Prisma Client mendengarkan event level `query`, `error`, dan `warn`. Event `query` dialirkan ke `dbLogger.debug` dengan menyertakan teks query, parameter, dan durasi eksekusi (`${duration}ms`) untuk mempermudah profiling kueri dan debugging pengembang.
3. Pola singleton global Prisma di `lib/db/prisma.ts` dipertahankan untuk mencegah kehabisan koneksi database pool saat hot reload development dan memastikan event listener tidak didaftarkan ulang berkali-kali.
4. Child logger `dbLogger` diekspor dari `lib/logging/logger.ts` dengan binding `{ domain: 'db' }` untuk standarisasi log di seluruh modul backend.

## Code area
- `lib/logging/logger.ts`
- `lib/logging/logger.test.ts`
- `lib/db/prisma.ts`
- `lib/db/prisma.test.ts`
- `docs/scope/scope_security_issue.md`

## Requirements
- AC-1: Prisma Client diinstansiasi dengan opsi event emission (`emit: 'event'`) untuk level `['error', 'warn']` di production, dan `['query', 'error', 'warn']` di development.
- AC-2: Di production, event `query` tidak didaftarkan sama sekali untuk menjamin zero SQL leak dan zero performance penalty.
- AC-3: Di non-production, event `query` didelegasikan ke `dbLogger.debug` dengan struktur metadata `{ query, params, duration: "${e.duration}ms" }`.
- AC-4: Event `error` didelegasikan ke `dbLogger.error({ target, message })` dan event `warn` ke `dbLogger.warn({ target, message })`.
- AC-5: Singleton instance Prisma dipertahankan dan diuji agar tidak membuat instance baru saat global instance sudah tersedia.

## Ratify
Keputusan ini telah diratifikasi dan diverifikasi penuh melalui pengujian unit test otomatis pada `lib/db/prisma.test.ts` (3 tests lulus) dan `lib/logging/logger.test.ts` (5 tests lulus), serta lulus `npm test` (195 tests lulus), `npx tsc --noEmit` (0 errors), dan `npm run lint` (0 errors). Feature ditandai `done`.

