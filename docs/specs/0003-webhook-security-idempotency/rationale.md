# Rationale: 0003. Webhook Security and Idempotency

[Kembali ke Spesifikasi](index.md)

## Context

Endpoint `POST /api/payment/notification` menerima notifikasi dari Midtrans setiap kali status transaksi berubah. Midtrans akan mengirim ulang notifikasi yang sama jika tidak menerima respons 2xx, sehingga endpoint ini dapat dipanggil berkali-kali untuk transaksi yang sama. Ada tiga celah keamanan yang perlu ditutup sebelum aplikasi masuk ke produksi.

Pertama, perbandingan signature saat ini menggunakan operator `!==` (perbandingan string biasa). Perbandingan ini rentan terhadap timing attack: seorang penyerang yang mengirim signature palsu bisa mengukur waktu respons dan menyimpulkan berapa karakter yang sudah cocok, lalu membangun signature yang valid karakter demi karakter tanpa pernah mengetahui server key.

Kedua, tidak ada rate limiting di endpoint ini. Endpoint `POST /api/payment` sudah dilindungi, namun endpoint notifikasi dibiarkan terbuka. Seorang penyerang bisa mem-flood endpoint dengan request palsu dan membebani koneksi database, bahkan jika semua request gagal di verifikasi signature.

Ketiga, jika Midtrans mengirim ulang notifikasi untuk transaksi yang sudah berstatus `success` atau `failed`, handler saat ini akan menjalankan Prisma `update` lagi. Meski hasilnya sama, ini membuang satu koneksi DB dan satu panggilan ke Midtrans API untuk setiap notifikasi duplikat, serta membuka risiko race condition jika dua notifikasi datang bersamaan.

## Options considered

### Option 1: Fix in place (perbaikan langsung pada handler yang ada)

Mengganti perbandingan string biasa dengan `crypto.timingSafeEqual()`, menambahkan `rateLimit()` di awal handler, dan menambahkan query idempotency check sebelum memanggil Midtrans API. Semua perubahan terjadi di satu file (`notification/route.ts`) dan `lib/rate-limit.ts` yang sudah ada.

**Pros**:
- Zero dependency baru; `crypto` sudah ada, `rateLimit` sudah ada.
- Perubahan terfokus pada satu file handler dan satu helper yang sudah diuji.
- Mudah di-review dan mudah di-rollback dengan satu commit revert.

**Cons**:
- Tidak ada pemisahan concern secara eksplisit; logika keamanan ada di dalam handler langsung.
- Jika di masa depan ada banyak endpoint webhook, pola ini harus diduplikasi.

### Option 2: Webhook middleware layer

Membuat middleware Next.js atau wrapper fungsi yang menggabungkan verifikasi signature, rate limiting, dan idempotency check, lalu dipanggil dari semua route webhook.

**Pros**:
- Lebih mudah digunakan kembali jika ada banyak webhook di masa depan.
- Pemisahan concern lebih jelas.

**Cons**:
- Over-engineering untuk satu endpoint yang ada saat ini. Next.js App Router middleware berjalan di edge runtime dengan keterbatasan tertentu, sementara `crypto.timingSafeEqual()` butuh Node.js runtime.
- Membutuhkan abstraksi baru yang belum ada polanya di codebase ini.

## Rationale

Hanya ada satu endpoint webhook saat ini. Membangun abstraksi middleware untuk satu endpoint adalah over-engineering yang nyata, bukan antisipasi yang berguna. Option 1 menggunakan `crypto` yang sudah diimpor, `rateLimit()` yang sudah ada di `lib/rate-limit.ts`, dan Prisma yang sudah ada di handler, sehingga tidak ada dependency baru dan tidak ada pola baru yang harus dipelajari tim. Perubahan ini cukup kecil dan terfokus untuk dibangun dalam satu PR dan di-rollback dengan satu commit revert jika ada masalah.

Urutan guard yang dipilih adalah rate limit dahulu, lalu signature, lalu idempotency check. Rate limit di terluar agar request yang membanjiri dari satu IP ditolak sebelum melakukan hash computation maupun query database. Signature di tengah agar request palsu gagal sebelum menyentuh database. Idempotency check terakhir karena hanya relevan setelah kita tahu request legitimate.

## References

**Project sources** (verifiable, dalam repo ini):
- `AGENTS.md` root: konvensi rate limiting dan webhook signature verification
- `app/api/AGENTS.md`: konvensi endpoint payment dan notifikasi
- `lib/rate-limit.ts`: sliding window rate limiter yang digunakan kembali
- `app/api/payment/notification/route.ts`: kode yang diperkuat

**Practices & standards**:
- Constant-time comparison (perbandingan waktu konstan) untuk verifikasi signature kriptografi, mencegah timing side-channel attack
- Idempotency keys for payment webhook processing: notifikasi pembayaran harus aman diproses lebih dari sekali
- Fail open for rate limiting: blokade total lebih berbahaya dari lolosnya beberapa request saat infrastruktur bermasalah
- OWASP: verifikasi webhook origin wajib menggunakan metode yang tahan timing attack
