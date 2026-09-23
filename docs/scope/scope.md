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
| 3 | Webhook security and idempotency | Security | planned |
| 4 | Error sanitization and env guard | Security | planned |

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

### 3. Webhook security and idempotency · needs a decision
Mengamankan endpoint notifikasi Midtrans dari pemalsuan data status dan eksekusi ganda dengan verifikasi tanda tangan timing safe, pembatasan laju request, dan penanganan idempoten.
**Done when:** webhook memverifikasi signature menggunakan perbandingan waktu konstan, membatasi request per menit melalui Redis, dan mengabaikan notifikasi berulang untuk transaksi yang sudah berstatus akhir.
- [ ] Design it (spec): `/architect webhook-security-idempotency`

### 4. Error sanitization and env guard · needs a decision
Menstandarkan respon galat pada seluruh rute API publik agar tidak membocorkan informasi internal server, jejak error, atau respon informal ke pengguna publik.
**Done when:** seluruh rute API mengembalikan pesan galat terstandar tanpa jejak teknis internal, pesan respon informal dibersihkan, dan validasi variabel lingkungan produksi aktif.
- [ ] Design it (spec): `/architect error-sanitization`

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
