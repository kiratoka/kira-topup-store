# 🔒 Security Audit Report — Kira Topup Store

**Tanggal**: 16 Oktober 2026  
**Scope**: Seluruh codebase (API routes, library, komponen, konfigurasi)  
**Metode**: Static code analysis

---

## 📊 Ringkasan Eksekutif

| Severity | Jumlah | Status |
|:---------|:------:|:------:|
| 🔴 **KRITIKAL** | 1 | Selesai diperbaiki (K1 ✅) |
| 🟠 **TINGGI** | 3 | Selesai diperbaiki (T1 ✅, T2 ✅, T3 ✅) |
| 🟡 **SEDANG** | 4 | Sebaiknya diperbaiki |
| 🟢 **RENDAH** | 3 | Nice to have (R2 ✅) |

**Skor Keamanan Overall**: **9.0 / 10** — Seluruh celah kritikal K1 dan celah kategori tinggi (T1 invoice rate limit & masking, T2 atomic rate limiter Lua script, T3 CSP img-src & remotePatterns) telah berhasil diselesaikan dan diuji dengan pengujian otomatis.

---

## 🔴 KRITIKAL

### K1. Hardcoded Midtrans Snap URL — Sandbox di Production (SELESAI ✅)

> [!NOTE]
> **Status**: Teratasi via `lib/midtrans.ts` (`getMidtransSnapUrl()`).
> Komponen [ClientTopUp.tsx](../../components/TitleGame/ClientTopUp.tsx) dan [Invoice.tsx](../../components/Invoice/Invoice.tsx) kini memuat script Snap secara dinamis berdasarkan `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`.

**File terdampak:**
- [ClientTopUp.tsx](../../components/TitleGame/ClientTopUp.tsx)
- [Invoice.tsx](../../components/Invoice/Invoice.tsx)
- [lib/midtrans.ts](../../lib/midtrans.ts)

```typescript
// Implementasi dinamis terpusat via lib/midtrans.ts:
script.src = getMidtransSnapUrl();
```

**Dampak**: Risiko kegagalan pembayaran di production telah dieliminasi.

---

## 🟠 TINGGI

### T1. Invoice API — Tidak Ada Rate Limiting & IDOR (Insecure Direct Object Reference) (SELESAI ✅)

> [!NOTE]
> **Status**: Teratasi via modul pembatasan laju Redis (30 req/menit) dan sanitasi data di [lib/masking.ts](../../lib/masking.ts).
> Endpoint [app/api/invoice/route.ts](../../app/api/invoice/route.ts) dan [app/api/invoice/[orderId]/route.ts](../../app/api/invoice/[orderId]/route.ts) kini menerapkan rate limit independen serta menyamarkan email pelanggan (`u***@example.com`) dan menghapus Snap token saat transaksi tidak lagi pending.

**File terdampak:**
- [app/api/invoice/route.ts](../../app/api/invoice/route.ts)
- [app/api/invoice/[orderId]/route.ts](../../app/api/invoice/[orderId]/route.ts)
- [lib/masking.ts](../../lib/masking.ts)

**Masalah 1 — Tidak ada rate limiting**: Kedua endpoint GET invoice sebelumnya tidak menerapkan rate limiting sama sekali, berbeda dengan endpoint POST yang sudah dilindungi.

**Masalah 2 — IDOR**: Siapa pun yang mengetahui `orderId` sebelumnya bisa mengakses detail lengkap invoice milik pengguna lain termasuk email tak tersamar dan token pembayaran.

**Dampak**: Risiko kebocoran data pribadi pelanggan (PII) dan penyalahgunaan token transaksi.

**Rekomendasi & Solusi Terpasang**:
1. Rate limiting 30 req/menit aktif pada kedua endpoint GET invoice via Redis key `rate-limit:invoice:<ip>`.
2. Masking email diterapkan pada respons invoice publik (contoh: `u***@example.com`).
3. Token Snap Midtrans dikosongkan (`null`) jika status transaksi sudah final (`success`, `failed`, `expired`).

---

### T2. Rate Limiter — Race Condition pada INCR/EXPIRE (SELESAI ✅)

> [!NOTE]
> **Status**: Teratasi via atomic Lua script di [lib/rate-limit.ts](../../lib/rate-limit.ts).
> Eksekusi `INCR`, evaluasi `current == 1` untuk `EXPIRE`, serta self-healing jika `TTL == -1` kini dijalankan secara atomik dalam satu script Lua di Redis melalui `client.eval`.

**File terdampak:** [lib/rate-limit.ts](../../lib/rate-limit.ts)

```typescript
// Implementasi atomic via Lua script:
export const RATE_LIMIT_LUA_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
else
    if redis.call('TTL', KEYS[1]) == -1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
end
return current
`.trim();
```

**Dampak**: Risiko key tanpa TTL akibat crash proses di antara `incr` dan `expire` telah dieliminasi secara tuntas dan atomik. IP tidak akan pernah terkunci secara permanen.

---

### T3. `img-src https:` di CSP Terlalu Permisif + Image Remote Pattern Wildcard (SELESAI ✅)

> [!NOTE]
> **Status**: Teratasi via restriksi CSP `img-src` dan remote patterns eksplisit di [next.config.ts](../../next.config.ts).

**File terdampak:**
- [next.config.ts](../../next.config.ts#L37) — CSP `img-src 'self' data: https://cdn1.codashop.com https://asetto.nawalakarsa.id https://hybrid.co.id https://app.sandbox.midtrans.com https://app.midtrans.com`
- [next.config.ts](../../next.config.ts#L61-L76) — `images.remotePatterns` tanpa wildcard

**Masalah**: 
- CSP sebelumnya mengizinkan gambar dari semua domain HTTPS (`img-src https:`)
- Next.js Image Optimization sebelumnya menerima semua hostname (`**`) yang berpotensi menjadi celah SSRF

**Rekomendasi & Solusi Terpasang**:
Dibatasi ke domain spesifik yang digunakan aplikasi:
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn1.codashop.com' },
    { protocol: 'https', hostname: 'asetto.nawalakarsa.id' },
    { protocol: 'https', hostname: 'hybrid.co.id' },
  ],
},
```

---

## 🟡 SEDANG

### S1. Prisma Query Logging Aktif di Production (SELESAI ✅)

> [!NOTE]
> **Status**: Teratasi via konfigurasi kondisional log di [lib/db/prisma.ts](../../lib/db/prisma.ts). Di production hanya mencatat level `error`, sedangkan di development/non-production mencatat level `query`.

**File terdampak:** [lib/db/prisma.ts](../../lib/db/prisma.ts#L9-L11)

```typescript
new PrismaClient({
  log: ['query'], // Selalu aktif, termasuk di production
})
```

**Dampak**: Setiap query SQL (termasuk yang mengandung data pelanggan) akan di-log ke stdout di production. Jika log dikumpulkan oleh layanan monitoring pihak ketiga, data sensitif bisa terekspos.

**Rekomendasi & Solusi Terpasang**: Kondisikan berdasarkan environment:
```typescript
new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
})
```

---

### S2. Tidak Ada Middleware — Tidak Ada Proteksi Global

**Masalah**: Tidak ditemukan file `middleware.ts` di project root. Artinya tidak ada:
- CSRF protection global
- Bot detection
- Validasi origin untuk API routes
- Pengecekan header `Content-Type` sebelum masuk route handler

**Dampak**: Setiap API route harus menangani proteksinya sendiri, meningkatkan risiko terlewat.

**Rekomendasi**: Buat `middleware.ts` minimal yang:
1. Memvalidasi `Content-Type: application/json` untuk semua POST requests ke `/api/`
2. Menambahkan CSRF token checking (atau setidaknya validasi `Origin` / `Referer` header)

---

### S3. `NEXT_PUBLIC_BASE_URL` Tanpa Skema `https://`

**File terdampak:** [.env](../../.env#L9)

```
NEXT_PUBLIC_BASE_URL=kiratopupstore.netlify.app
```

**Masalah**: URL callback yang dikirim ke Midtrans di [payment/route.ts](../../app/api/payment/route.ts#L115-L118) menggunakan template literal:
```typescript
callbacks: {
  finish: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${orderId}`,
```

Hasilnya: `kiratopupstore.netlify.app/invoice/ORDER-xxx` — tanpa `https://` di depan. Callback Midtrans mungkin tidak berfungsi atau mengarah ke URL yang salah.

**Rekomendasi**: Ubah env menjadi `NEXT_PUBLIC_BASE_URL=https://kiratopupstore.netlify.app` dan validasi di [env.ts](../../lib/env.ts) bahwa URL dimulai dengan `https://`.

---

### S4. `unsafe-inline` dan `unsafe-eval` di CSP `script-src`

**File terdampak:** [next.config.ts](../../next.config.ts#L35)

```
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
```

**Masalah**: `unsafe-inline` dan `unsafe-eval` secara signifikan melemahkan perlindungan XSS dari CSP. Meskipun ini umumnya diperlukan oleh Next.js di development, di production seharusnya menggunakan nonce-based CSP.

**Dampak**: Jika ada celah XSS (saat ini tidak ditemukan), penyerang bisa menjalankan script inline tanpa hambatan CSP.

**Rekomendasi**: Untuk production, pertimbangkan nonce-based CSP menggunakan middleware Next.js yang meng-generate nonce per request.

---

## 🟢 RENDAH

### R1. Console.log/Error di Production Routes

**File terdampak**: Semua route handler

**Masalah**: `console.log` dan `console.error` yang mencetak detail internal (seperti `order_id`, `status`) tetap aktif di production. Meskipun ini bukan kerentanan langsung, informasi ini bisa membantu penyerang memahami flow internal jika log bocor.

**Rekomendasi**: Gunakan structured logging library (misalnya `pino`) dengan level yang bisa dikonfigurasi.

---

### R2. Token Midtrans Terekspos di Invoice Response (SELESAI ✅)

**File terdampak:** [app/api/invoice/[orderId]/route.ts](../../app/api/invoice/[orderId]/route.ts#L28-L34)

> [!NOTE]
> **Status**: Teratasi via `sanitizeInvoice` di [lib/masking.ts](../../lib/masking.ts). Token disetel `null` saat transaksi berstatus sukses, gagal, atau kedaluwarsa.

**Masalah**: Seluruh objek invoice, termasuk field `token` (Snap payment token), sebelumnya dikembalikan di response bahkan setelah pembayaran selesai.

**Rekomendasi**: Mengosongkan token untuk status final dan hanya menyediakannya saat status `pending`.

---

### R3. Redis Client Tidak di-Singleton di Production

**File terdampak:** [lib/redis.ts](../../lib/redis.ts#L19-L21)

```typescript
if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redis;
}
```

**Masalah**: Di production, Redis client **tidak** disimpan di global, artinya setiap module reload atau cold start bisa membuat koneksi baru tanpa reuse. Ini kebalikan dari pola Prisma singleton yang sudah benar.

**Rekomendasi**: Simpan di global juga di production, atau gunakan connection pooling.

---

## ✅ Hal yang Sudah Baik

| Area | Detail |
|:-----|:-------|
| **Webhook Signature** | Verifikasi SHA-512 dengan `crypto.timingSafeEqual` — sudah benar, mencegah timing attack |
| **Input Validation** | Zod schema dengan trim, max length, dan type checking yang ketat |
| **Server-side Price** | Harga diambil dari server catalog (`getProductById`), mengabaikan harga dari client |
| **Idempotency** | Webhook menggunakan optimistic locking via `updateMany` dengan kondisi status |
| **Security Headers** | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy semua terpasang |
| **Rate Limiting** | Endpoint POST dan GET invoice sudah dilindungi rate limiter berbasis Redis |
| **Data Sanitization** | PII masking untuk email dan penghapusan token pembayaran pada transaksi selesai |
| **Error Sanitization** | `apiError` helper mencegah kebocoran error internal ke client |
| **Environment Validation** | Zod-based env validation memastikan semua secret tersedia saat startup |
| **Prototype Safety** | `Object.hasOwn` digunakan untuk validasi game ID, mencegah prototype pollution |
| **No Raw SQL** | Semua query menggunakan Prisma client, tidak ada raw query yang rentan SQL injection |
| **No XSS Vectors** | Tidak ada `dangerouslySetInnerHTML` atau `eval()` di codebase |
| **`.env` Tidak Di-commit** | `.gitignore` sudah mengecualikan `.env*`, dan git history bersih |
| **`poweredByHeader: false`** | Header `X-Powered-By` dinonaktifkan untuk menyembunyikan stack |

---

## 📋 Prioritas Penanganan

| Prioritas | Item | Estimasi Effort | Status |
|:---------:|:-----|:---------------:|:------:|
| 1 | **K1** — Dinamiskan Midtrans Snap URL | ~15 menit | Selesai ✅ |
| 2 | **T1** — Rate limit + redact di invoice API | ~1 jam | Selesai ✅ |
| 3 | **T2** — Atomic rate limiter | ~30 menit | Selesai ✅ |
| 4 | **T3** — Restrict CSP img-src & image remotePatterns | ~15 menit | Selesai ✅ |
| 5 | **S3** — Perbaiki `NEXT_PUBLIC_BASE_URL` | ~5 menit | Pending |
| 6 | **S1** — Conditional Prisma logging | ~5 menit | Selesai ✅ |
| 7 | **S2** — Tambah middleware.ts | ~1 jam | Pending |
| 8 | **S4** — Nonce-based CSP | ~2 jam | Pending |
| 9 | **R1, R3** — Cleanup logging & Redis singleton | ~1 jam | Pending |
| 10 | **R2** — Sembunyikan token Snap pada invoice selesai | ~15 menit | Selesai ✅ |
