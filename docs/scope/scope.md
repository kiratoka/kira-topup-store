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
Spec [0001](file:///c:/Users/Raka/Documents/Data%20Programming%20Raka/kira-topup-store/docs/specs/0001-redis-cloud-migration.md) · code in `lib/rate-limit.ts`

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
