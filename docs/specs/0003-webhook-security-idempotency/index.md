# 0003. Webhook Security and Idempotency

**Date**: 2026-09-23
**Status**: Accepted

## Summary

Endpoint notifikasi Midtrans saat ini memverifikasi signature menggunakan perbandingan string biasa, tidak membatasi request, dan langsung memperbarui status invoice tanpa mengecek apakah transaksi sudah selesai. Enhancement ini menambahkan tiga lapis pelindung: rate limiting per IP melalui Redis, perbandingan signature yang tahan terhadap timing attack (timing safe comparison, yaitu perbandingan yang memakan waktu konstan agar penyerang tidak bisa menebak nilai yang benar dari perbedaan waktu respons), dan pengecekan idempoten (idempotency check, yaitu melewati pemrosesan jika transaksi sudah berstatus akhir). Tidak ada perubahan skema database yang dibutuhkan.

## Requirements

**User stories**:
- Sebagai sistem, saya ingin notifikasi Midtrans diverifikasi dengan cara yang aman agar signature palsu tidak bisa diterima melalui serangan timing.
- Sebagai sistem, saya ingin endpoint notifikasi dibatasi per IP agar tidak bisa dibanjiri request palsu.
- Sebagai sistem, saya ingin notifikasi berulang untuk transaksi yang sudah selesai diabaikan agar tidak ada pemrosesan ganda yang membuang sumber daya.

**Acceptance criteria**:
- **AC-1**: Perbandingan `signature_key` dengan nilai yang diharapkan menggunakan `crypto.timingSafeEqual()`. Request dengan signature tidak valid mendapat respons `403`.
- **AC-2**: Setiap request ke endpoint notifikasi dihitung terhadap batas 30 request per menit per IP, menggunakan Redis key `rate-limit:webhook:<ip>`. Request yang melampaui batas mendapat respons `429`.
- **AC-3**: Sebelum memanggil Midtrans API dan memperbarui DB, handler mengambil status invoice dari DB. Jika status sudah `success` atau `failed`, handler mengembalikan `200 { success: true }` dan berhenti tanpa melakukan pembaruan.
- **AC-4**: Jika `order_id` dari notifikasi tidak ditemukan di database, handler mengembalikan `404` dan mencatat peringatan di log.
- **AC-5**: Ketika Redis tidak dapat diakses untuk rate limiting, handler tetap meneruskan request (fail open), konsisten dengan behavior endpoint payment.
- **AC-6**: Ketika notifikasi berulang diabaikan karena transaksi sudah berstatus akhir, satu baris log peringatan dicatat (`console.warn`).

## Decision

**Chosen option**: Option 1: Fix in place

Memperkuat `app/api/payment/notification/route.ts` secara langsung: tambah rate limit di awal, ganti perbandingan string dengan `crypto.timingSafeEqual()`, dan tambah idempotency check sebelum memanggil Midtrans API. Catatan lengkap pertimbangan dan alternatif ada di [rationale.md](rationale.md).

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `redis-core` (`redis/agent-skills`, `.agents/skills/redis-core/`)

## Feature design

**Data model sketch**:
Tidak ada perubahan skema. Idempotency check menggunakan kolom `Invoice.status` yang sudah ada dengan query `prisma.invoice.findUnique({ where: { orderId } })` sebelum pemrosesan dimulai.

**State transitions**:
```
[notifikasi masuk]
  -> rate limit check (Redis key: rate-limit:webhook:<ip>)
    -> [melebihi limit] -> 429
  -> field validation (order_id, status_code, gross_amount, signature_key)
    -> [tidak lengkap] -> 400
  -> signature verification (crypto.timingSafeEqual)
    -> [tidak cocok] -> 403
  -> idempotency check & lookup (query Invoice.status)
    -> [order_id tidak ditemukan] -> 404 (warn log)
    -> [sudah success/failed] -> 200 (skip, warn log)
  -> Midtrans API call (transaction.notification)
  -> Prisma update (Invoice.status, paymentMethod, transactionId, paymentTime)
  -> 200 { success: true }
```

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/payment/notification` | POST | `order_id`, `status_code`, `gross_amount`, `signature_key` (body JSON) | `{ success: true }` | none (dijaga signature Midtrans) | 400 (field tidak lengkap), 403 (signature salah), 404 (order tidak ditemukan), 429 (rate limit) |

**Value sourcing**:
| Action | Value yang diproduksi / ditampilkan | Sumber |
|---|---|---|
| Hitung signature yang diharapkan | `expectedSignature` (hex SHA-512) | `order_id` + `status_code` + `gross_amount` dari body; `MIDTRANS_SERVER_KEY` dari env |
| Perbandingan timing safe | boolean cocok/tidak | `Buffer.from(signature_key)` vs `Buffer.from(expectedSignature)` via `crypto.timingSafeEqual()` |
| Rate limit count | jumlah request IP ini dalam window | Redis key `rate-limit:webhook:<ip>`, TTL 60 detik, limit 30 |
| Idempotency check | `Invoice.status` saat ini | `prisma.invoice.findUnique({ where: { orderId: order_id } })` |
| Status invoice akhir | `invoiceStatus` string | Didapat dari `transactionStatus` + `fraudStatus` dari Midtrans API response (logika mapping sudah ada) |

**Key invariants**:
- `crypto.timingSafeEqual()` hanya bisa membandingkan dua Buffer dengan panjang yang sama. Jika panjang berbeda, function akan melempar error. Handler harus membandingkan panjang terlebih dahulu; jika berbeda, tolak sebagai signature tidak valid tanpa memanggil `timingSafeEqual`.
- Rate limit key webhook menggunakan namespace `rate-limit:webhook:<ip>`, terpisah dari `rate-limit:<ip>` yang digunakan endpoint payment, agar kuota keduanya tidak saling mempengaruhi.
- Status akhir yang mengaktifkan early return idempotency: `'success'` dan `'failed'`. Status `'pending'` masih bisa diperbarui.

**Security model**:
Endpoint ini tidak memerlukan autentikasi pengguna; Midtrans memanggil endpoint ini dari server mereka. Keamanan bergantung pada verifikasi signature HMAC SHA-512. Perbandingan timing safe adalah syarat minimum agar verifikasi ini tidak bisa ditembus lewat side-channel attack. Rate limiting mencegah flood dari aktor yang tidak memiliki server key yang valid.

**Configuration required**:
Tidak ada env var baru. `MIDTRANS_SERVER_KEY` sudah ada. Redis sudah terkonfigurasi via `lib/redis.ts`.

**Critical test scenarios**:
- Happy path: notifikasi Midtrans valid dengan signature yang benar untuk invoice yang sedang `pending` -> status diperbarui ke `success`, respons `200 { success: true }`, verifies **AC-1**, **AC-2**, **AC-3**
- Timing safe: dua request dengan signature yang berbeda panjang -> keduanya ditolak `403` tanpa memanggil `timingSafeEqual`, verifies **AC-1**
- Signature salah: `signature_key` yang tidak cocok -> respons `403`, verifies **AC-1**
- Rate limit: IP yang sama mengirim 31 request dalam 60 detik -> request ke-31 mendapat `429`, verifies **AC-2**
- Idempotency: notifikasi kedua untuk invoice yang sudah `success` -> respons `200`, tidak ada query Prisma update, satu baris `console.warn`, verifies **AC-3**, **AC-6**
- Order tidak ditemukan: `order_id` tidak ada di DB -> respons `404`, `console.warn`, verifies **AC-4**
- Redis mati: Redis tidak dapat diakses -> request tetap diteruskan, tidak `429`, verifies **AC-5**

## Build plan

Tracer Bullet: satu slice tipis yang menyentuh seluruh lapisan dari guard pertama hingga respons akhir.

1. [x] Tambah parameter `keyPrefix?: string` opsional ke `rateLimit` di `lib/rate-limit.ts` (default `'rate-limit'`) agar webhook bisa menggunakan namespace terpisah tanpa menduplikasi kode, satisfies **AC-2**, **AC-5**
2. [x] Tambah rate limiting di awal `notification/route.ts`: `rateLimit(ip, 30, 60_000, 'rate-limit:webhook')`, kembalikan `429` jika melampaui batas, satisfies **AC-2**, **AC-5**
3. [x] Ganti perbandingan signature: tambah length check eksplisit, lalu ubah ke `crypto.timingSafeEqual(Buffer.from(signature_key), Buffer.from(expectedSignature))`, satisfies **AC-1**
4. [x] Tambah idempotency check dan penanganan `not found`: panggil `prisma.invoice.findUnique` setelah validasi field; jika `null` -> `404` + `console.warn`; jika status `success` atau `failed` -> `200` + `console.warn` (skip), satisfies **AC-3**, **AC-4**, **AC-6**
5. [ ] Uji manual via Midtrans notification tester (sandbox) untuk memverifikasi happy path end-to-end, satisfies **AC-1** sampai **AC-6**

## Consequences

**Positive**:
- Signature verification sekarang tahan terhadap timing attack, memenuhi standar minimum keamanan webhook.
- Endpoint notifikasi tidak bisa lagi di-flood tanpa batas dari satu IP.
- Notifikasi duplikat dari Midtrans (retry normal) tidak menghasilkan query DB atau panggilan API yang sia-sia.

**Negative / tradeoffs**:
- Satu query database tambahan (`findUnique`) per notifikasi yang masuk untuk idempotency check. Untuk volume webhook yang sangat tinggi ini menjadi biaya yang terasa, namun untuk skala toko top-up ini tidak signifikan.
- Fail open pada Redis berarti rate limiting tidak aktif saat Redis mati. Ini konsisten dengan kebijakan yang sudah ada di endpoint payment, namun tetap merupakan window of risk.
- `crypto.timingSafeEqual()` melempar TypeError jika kedua buffer tidak sama panjang, sehingga membutuhkan length check eksplisit yang perlu diuji tersendiri.

**Neutral**:
- Tidak ada perubahan skema database.
- Tidak ada dependency baru.
- Pola rate limiting mengikuti konvensi yang sudah ada di `app/api/AGENTS.md` sehingga familiar bagi kontributor berikutnya.

## Migration plan

**Strategy**: fix in place, satu PR
**Phases**:
1. Semua perubahan dilakukan pada file yang sudah ada; tidak ada data live yang disentuh dan tidak ada koordinasi deployment khusus yang dibutuhkan.
**Rollback**: revert satu commit.
**Risks**: jika length check untuk `timingSafeEqual` salah diimplementasikan, bisa menolak signature valid. Test scenario untuk kasus ini wajib ada sebelum merge.
