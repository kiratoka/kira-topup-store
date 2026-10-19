# Scope: Kira Topup Store

Platform top up game dan voucher digital dengan integrasi pembayaran Midtrans dan rate limiting.

**Build approach:** Tracer Bullet (setiap fitur dibangun menyeluruh dari data hingga antarmuka).
**Workflow:** GA (setelah develop, jalankan verifikasi, pengujian, peninjauan kode, dan dokumentasi). Rujukan utama untuk sistem pembayaran dan transaksi keuangan. Setiap fitur dapat menjalankan alur ini sesuai kebutuhan.

_Rekomendasi ini disusun untuk menjaga pembangunan aplikasi tetap teratur. Anda memiliki kendali penuh untuk menentukan kapan suatu fitur dianggap selesai._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Top up storefront and checkout UI | Storefront | existing |
| B | Invoice lookup and status display | Storefront | existing |
| 1 | Redis Cloud migration | Infrastructure | done |
| 2 | Server side price validation | Security | done |
| 3 | Webhook security and idempotency | Security | done |
| 4 | Error sanitization and env guard | Security | done |
| 5 | Living architecture and security diagrams | Documentation | done |
| 6 | Midtrans environment guard and URL configuration | Security | in-progress |
| 7 | Invoice endpoint rate limiting and data masking | Security | done |
| 8 | Atomic rate limiter and Redis connection resilience | Security | in-progress |
| 9 | Content Security Policy and asset origin hardening | Security | done |
| 10 | Security middleware and structured logging | Security | in-progress |
| 11 | Standardize lib/ folder structure | Architecture | done |

## Existing features

### A. Top up storefront and checkout UI · existing
Katalog pilihan game, variasi item, formulir data akun, dan pemanggilan modal pembayaran Midtrans Snap. code in `app/topup/` and `components/TitleGame/`

### B. Invoice lookup and status display · existing
Pencarian dan tampilan status invoice pesanan pengguna. code in `app/invoice/`

## Infrastructure

### 1. Redis Cloud migration · done
Migrasi rate limiter dari Upstash HTTP ke Redis Cloud TCP client agar koneksi terpusat.
**Done when:** rate limiting berjalan menggunakan Redis Cloud dengan kredensial aman di file env, koneksi singleton stabil, dan proteksi fallback aktif.
- [x] Design it (spec): `/architect redis-cloud-migration` (assumed decision spec 0001)
- [x] Build it: `/develop redis-cloud-migration`
    - [x] Install library redis
    - [x] Konfigurasi variabel lingkungan di file env
    - [x] Buat singleton client Redis di lib/redis.ts
    - [x] Perbarui lib/rate-limit.ts ke client baru
    - [x] Uji koneksi dan rate limiter
Spec [0001](../specs/0001-redis-cloud-migration.md) · code in `lib/rate-limit.ts`

## Security

### 2. Server side price validation · done
Memastikan harga dan data produk selalu divalidasi dari data master di server sebelum membuat transaksi Midtrans, agar pengguna tidak dapat memanipulasi nominal pembayaran melalui peramban.
**Done when:** API pembayaran mengambil harga resmi dari data master, menolak permintaan jika harga atau produk tidak valid, dan memvalidasi skema data masukan secara ketat.
- [x] Design it (spec): `/architect server-side-price-validation`
- [x] Build it: `/develop server-side-price-validation`
    - [x] Setup validator Zod dan modul validasi pembayaran (AC-2, AC-4)
    - [x] Implementasi lookup produk server dan refactor rute API pembayaran (AC-1, AC-3, AC-5, AC-6)
    - [x] Penyelarasan pemanggilan checkout pada antarmuka client (AC-1, AC-5)
- [x] Verify it: `/check verify server-side-price-validation`
- [x] Test it: `/test server-side-price-validation`
- [x] Review it (fresh model): `/check review server-side-price-validation`
- [x] Document it: `/document server-side-price-validation`
Spec [0002](../specs/0002-server-side-price-validation/index.md) · code in `app/api/payment/route.ts` and `lib/validations/`

### 3. Webhook security and idempotency · done
Mengamankan endpoint notifikasi Midtrans dari pemalsuan data status dan eksekusi ganda dengan verifikasi tanda tangan timing safe, pembatasan laju request, dan penanganan idempoten.
**Done when:** webhook memverifikasi signature menggunakan perbandingan waktu konstan, membatasi request per menit melalui Redis, dan mengabaikan notifikasi berulang untuk transaksi yang sudah berstatus akhir.
- [x] Design it (spec): `/architect webhook-security-idempotency`
- [x] Build it: `/develop webhook-security-idempotency`
    - [x] Tambah parameter `keyPrefix` opsional ke `rateLimit` di `lib/rate-limit.ts` (AC-2, AC-5)
    - [x] Tambah rate limiting + timing-safe signature comparison di `notification/route.ts` (AC-1, AC-2, AC-5)
    - [x] Tambah idempotency check dan penanganan order not found (AC-3, AC-4, AC-6)
- [x] Verify it: `/check verify webhook-security-idempotency`
- [x] Test it: `/test webhook-security-idempotency`
- [x] Review it (fresh model): `/check review webhook-security-idempotency`
- [x] Document it: `/document webhook-security-idempotency`
Spec [0003](../specs/0003-webhook-security-idempotency/index.md) · code in `app/api/payment/notification/route.ts` and `lib/rate-limit.ts`

### 4. Error sanitization and env guard · done
Menstandarkan respon galat pada seluruh rute API publik agar tidak membocorkan informasi internal server, jejak error, atau respon informal ke pengguna publik.
**Done when:** seluruh rute API mengembalikan pesan galat terstandar tanpa jejak teknis internal, pesan respon informal dibersihkan, dan validasi variabel lingkungan produksi aktif.
- [x] Design it (spec): `/architect error-sanitization`
- [x] Build it: `/develop error-sanitization`
    - [x] Buat lib/env.ts (Zod schema 5 env vars, fail-fast import) dan lib/errors.ts (apiError helper) (AC-5, AC-6, AC-7)
    - [x] Perbaiki GET /api/invoice/[orderId] — hapus error field bocor, gunakan apiError(), Bahasa Indonesia (AC-1, AC-2, AC-3)
    - [x] Buat GET /api/invoice — validasi orderId wajib diisi (400) dan pencarian via query parameter (AC-1, AC-3)
    - [x] Perbaiki POST /api/payment/notification — standarkan pesan 500 ke Bahasa Indonesia (AC-1, AC-3, AC-4)
    - [x] Refactor POST /api/payment — standarkan respons galat menggunakan apiError() (AC-1, AC-3)
- [x] Verify it: `/check verify error-sanitization`
- [x] Test it: `/test error-sanitization`
- [x] Review it (fresh model): `/check review error-sanitization`
- [x] Document it: `/document error-sanitization`
Spec [0005](../specs/0005-error-sanitization-env-guard/index.md) · code in `lib/errors.ts`, `lib/env.ts`, and all `app/api/` routes

## Documentation

### 5. Living architecture and security diagrams · done
Diagram arsitektur sistem dan alur keamanan berbasis Mermaid di docs/architecture/ yang mencakup alur checkout, validasi harga server, alur webhook Midtrans, pembatasan laju Redis, serta petunjuk pembaruan berkala.
**Done when:** berkas arsitektur berformat Mermaid tersedia di docs/architecture/ yang mendokumentasikan alur data dan proteksi keamanan, serta memuat panduan pembaruan saat kode berubah.
- [x] Design it (spec): `/architect architecture-and-security-diagrams`
- [x] Build it: `/develop architecture-and-security-diagrams`
    - [x] Struktur direktori dan diagram arsitektur global di README.md (AC-1)
    - [x] Sequence Diagram alur checkout dan validasi harga server (AC-2)
    - [x] Sequence Diagram alur notifikasi webhook Midtrans dan idempotensi (AC-3)
    - [x] Flowchart lapisan keamanan dan pembatasan laju Redis (AC-4)
    - [x] Panduan pemeliharaan hidup dan integrasi AGENTS.md (AC-5, AC-6)
- [x] Verify it: `/check verify architecture-and-security-diagrams`
- [x] Test it: `/test architecture-and-security-diagrams`
- [x] Review it (fresh model): `/check review architecture-and-security-diagrams`
- [x] Document it: `/document architecture-and-security-diagrams`
Spec [0004](../specs/0004-architecture-security-diagrams/index.md) · documentation in `docs/architecture/`

## Security hardening

### 6. Midtrans environment guard and URL configuration · in-progress
Memastikan pemuatan skrip Midtrans Snap di antarmuka web dan konfigurasi URL callback menggunakan domain serta skrip yang sesuai dengan lingkungan aktif (sandbox atau production).
**Done when:** skrip Midtrans Snap dimuat secara dinamis berdasarkan nilai `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`, URL callback transaksi menyertakan skema HTTPS yang valid, dan berkas `lib/env.ts` memvalidasi URL dasar serta mode produksi.
- [x] Design it (spec): pemuatan skrip dinamis via helper `getMidtransSnapUrl()`
- [x] Build it: `/develop midtrans-environment-guard`
    - [x] Implementasi `getMidtransSnapUrl()` di `lib/payment/midtrans.ts` (K1)
    - [x] Integrasi pemanggilan dinamis pada `ClientTopUp.tsx` dan `Invoice.tsx`
    - [x] Unit test `lib/payment/midtrans.test.ts` (5 tests lulus)
- [ ] Base URL https guard di `lib/env.ts` (S3)
Spec · code in `lib/payment/midtrans.ts`

### 7. Invoice endpoint rate limiting and data masking · done
Melindungi endpoint pencarian invoice dari serangan brute force dan mencegah kebocoran data pelanggan (IDOR) dengan pembatasan laju pemanggilan serta penyamaran informasi sensitif.
**Done when:** endpoint GET `/api/invoice` dan `/api/invoice/[orderId]` dilindungi oleh rate limiter Redis, respon menyamarkan informasi sensitif seperti email pengguna, dan token pembayaran Snap dihilangkan dari respon jika transaksi sudah diselesaikan.
- [x] Design it (spec): `/architect invoice-security-masking` (spec [0006](../specs/0006-invoice-rate-limiting-data-masking.md))
- [x] Build it: `/develop invoice-security-masking`
    - [x] Tambah rate limiting Redis (30 req/min, keyPrefix 'rate-limit:invoice') pada GET /api/invoice dan /api/invoice/[orderId] (AC-1)
    - [x] Buat modul helper sanitasi dan masking email pelanggan di lib/security/masking.ts (AC-2)
    - [x] Hilangkan token Snap Midtrans dari respons saat status transaksi bukan pending (AC-3)
    - [x] Tambahkan unit test untuk rate limiting, sanitasi email, dan pembersihan token di route.test.ts dan lib/security/masking.test.ts
- [x] Verify it: `/check verify invoice-security-masking`
- [x] Test it: `/test invoice-security-masking`
- [x] Review it (fresh model): `/check review invoice-security-masking` (`docs/reviews/2026-10-17-master-t1-t3.md`)
- [x] Document it: `/document invoice-security-masking`
Spec [0006](../specs/0006-invoice-rate-limiting-data-masking.md) · code in `app/api/invoice/` and `lib/security/`

### 8. Atomic rate limiter and Redis connection resilience · in-progress
Menghilangkan celah kondisi balapan (race condition) pada rate limiter Redis dengan operasi atomik serta memastikan koneksi Redis menerapkan pola singleton yang tangguh di lingkungan produksi.
**Done when:** operasi penambahan hitungan dan penetapan waktu kedaluwarsa kunci Redis dieksekusi secara atomik menggunakan multi exec atau skrip Lua tanpa risiko kunci bertahan selamanya, serta client Redis di `lib/cache/redis.ts` menggunakan pola singleton pada semua lingkungan.
- [x] Build it: `/develop atomic-rate-limiter`
    - [x] Implementasi skrip atomik Lua (`INCR` + `EXPIRE` + `TTL == -1` self-healing) di `lib/cache/rate-limit.ts` (T2)
    - [x] Unit test komprehensif atomisitas dan boundary di `lib/cache/rate-limit.test.ts`
- [x] Review it (fresh model): `/check review atomic-rate-limiter` (`docs/reviews/2026-10-17-master-t1-t3.md`)
- [ ] Redis client connection singleton di production (R3)
code in `lib/cache/rate-limit.ts`

### 9. Content Security Policy and asset origin hardening · done
Memperketat kebijakan keamanan konten (CSP) dan izin optimasi gambar Next.js agar server tidak dapat dimanfaatkan untuk serangan injeksi skrip atau pemuatan aset dari domain berbahaya (SSRF).
**Done when:** konfigurasi `img-src` pada CSP dan `remotePatterns` pada `next.config.ts` dibatasi hanya untuk domain aset yang diizinkan tanpa wildcard terbuka, serta arahan skrip diperketat dari evaluasi inline yang tidak aman.
- [x] Design it (spec): `/architect csp-asset-hardening` (spec [0007](../specs/0007-csp-asset-hardening.md))
- [x] Build it: `/develop csp-asset-hardening`
  - [x] Restrict CSP img-src to trusted origins without wildcard (T3)
  - [x] Restrict Next.js image remotePatterns and eliminate wildcard (T3)
- [x] Verify it: `/check verify csp-asset-hardening`
- [x] Test it: `/test csp-asset-hardening` (`next.config.test.ts`)
- [x] Review it (fresh model): `/check review csp-asset-hardening` (`docs/reviews/2026-10-17-master-t1-t3.md`)
- [x] Document it: `/document csp-asset-hardening`
Spec [0007](../specs/0007-csp-asset-hardening.md) · code in `next.config.ts`

### 10. Security middleware and structured logging · in-progress
Menerapkan Next.js middleware global untuk memvalidasi header request API serta mengganti seluruh pencatatan konsol yang tersebar (`console.log`, `console.error`, `console.warn`) dengan logger terpusat yang menghasilkan output JSON terstruktur, mendukung redaksi data sensitif, level log per lingkungan, dan child logger per domain.
**Done when:** middleware Next.js memvalidasi header tipe konten dan asal request untuk seluruh rute API publik, seluruh `console.*` di API routes dan `lib/` diganti dengan logger terpusat yang menghasilkan JSON terstruktur, logger mendukung redaksi otomatis data sensitif dan child logger per domain (payment, webhook, redis), serta level pencatatan log disesuaikan per lingkungan (error saja di produksi, verbose di development).
- [x] Design it (spec): `/architect security-middleware-logging`
- [x] Build it: `/develop security-middleware-logging`
    - [x] Setup Pino logger dengan redaction, child loggers, dan pino-pretty (AC-4, AC-5, AC-6, AC-8, AC-9)
    - [x] Buat middleware.ts dengan request ID, Content-Type validation, Origin check (AC-1, AC-2, AC-3)
    - [x] Ganti seluruh console.* di 6 file server side dengan child logger domain (AC-7)
    - [x] Tambah ESLint no-console dan unit/integration test (AC-1 sampai AC-9)
- [x] Verify it: `/check verify security-middleware-logging`
- [x] Test it: `/test security-middleware-logging` (proxy.test.ts, logger.test.ts, prisma.test.ts)
- [ ] Review it (fresh model): `/check review security-middleware-logging`
- [x] Document it: `/document security-middleware-logging`
Spec [0010](../specs/0010-security-middleware-logging/index.md) · code in `proxy.ts`, `lib/logging/logger.ts`, and all `app/api/` routes

## Architecture

### 11. Standardize `lib/` folder structure · done
Merestrukturisasi direktori `lib/` menjadi 6 subfolder modular berbasis domain (`db/`, `cache/`, `payment/`, `security/`, `content/`, `utils/`) serta `types/` untuk domain types, mempertahankan `env.ts` di root `lib/`, dan menegakkan larangan import flat lama via aturan ESLint `no-restricted-imports`.
**Done when:** semua berkas di `lib/` telah dipindahkan ke folder domain, seluruh referensi import diperbarui, aturan ESLint aktif mencegah import lama, dan test/build/lint lulus 100%.
- [x] Design it (spec): `/architect lib-folder-structure` (spec [0008](../specs/0008-lib-folder-structure/index.md))
- [x] Build it: `/develop lib-folder-structure`
- [x] Verify it: `/check verify lib-folder-structure`
- [x] Test it: `/test lib-folder-structure`
- [x] Review it (fresh model): `/check review lib-folder-structure`
- [x] Document it: `/document lib-folder-structure`
Spec [0008](../specs/0008-lib-folder-structure/index.md) · code in `lib/`

## Deferred
Di luar cakupan slice penguatan keamanan saat ini, dicatat agar perencanaan tetap transparan.
- **Admin authentication**: dasbor autentikasi admin dan audit aktivitas pesanan · needs a decision · GA
- **Bot protection**: proteksi bot dan captcha pada formulir transaksi · needs a decision

## Legend

**Kotak keputusan.** Setiap fitur yang membutuhkan perancangan memuat satu tugas bertanda `(spec)`. Tanda ini dicari oleh skill pendukung untuk memulai fase rancangan sebelum implementasi.

**Siklus status fitur**:
- `planned`: fitur baru yang sudah terdaftar dalam rencana.
- `in-progress`: sedang dalam proses rancangan atau pembangunan.
- `done`: selesai dibangun dan diverifikasi sesuai kebutuhan.
- `existing`: fitur yang sudah ada sebelumnya di dalam repositori.

Langkah selanjutnya selalu merupakan kotak pertama yang belum tercentang.
