# 0010 Rationale: Security middleware and structured logging

## Context

Proyek Kira Topup Store saat ini memiliki 15 panggilan `console.*` yang tersebar di 6 file server side: `app/api/payment/route.ts` (2), `app/api/payment/notification/route.ts` (8), `app/api/invoice/route.ts` (1), `app/api/invoice/[orderId]/route.ts` (1), `lib/cache/redis.ts` (2), dan `lib/cache/rate-limit.ts` (2). Ditambah 12 panggilan di 2 file client side (`ClientTopUp.tsx`, `Invoice.tsx`).

Kondisi ini menimbulkan beberapa masalah:

1. **Tidak ada format seragam.** Beberapa log menggunakan prefix bracket (`[Redis Client Error]`, `[RateLimit]`), yang lain menggunakan teks bebas (`Midtrans Error:`, `Server Error:`), dan ada yang tidak memiliki konteks sama sekali (`>> POST /api/payment/notification called`). Platform monitoring tidak dapat mengindeks atau memfilter log ini secara konsisten.

2. **Data sensitif muncul di stdout.** Objek `error` yang di-log bisa mengandung detail koneksi database, server key Midtrans, atau email pelanggan. Tidak ada mekanisme redaksi otomatis.

3. **Tidak ada request ID.** Ketika satu request melewati middleware, route handler, dan helper library, tidak ada cara menghubungkan log dari satu request yang sama. Debugging di production memerlukan pencocokan manual berdasarkan timestamp.

4. **Tidak ada validasi header global.** Setiap route harus memvalidasi Content-Type sendiri (atau tidak sama sekali). Tidak ada pengecekan Origin/Referer terpusat untuk mengurangi risiko CSRF pada API endpoint.

Prisma logging sudah ditangani secara terpisah oleh spec 0009 (conditional log level per environment), sehingga tidak perlu digabung ke solusi ini.

## Options considered

### Option 1: Pino (structured JSON logger)

Logger JSON native untuk Node.js dengan performa tinggi. Mendukung redaction paths bawaan (tanpa plugin tambahan), child logger per domain, dan transport system (termasuk `pino-pretty` untuk development). Level log dikonfigurasi per environment. Serialisasi JSON dilakukan dengan zero overhead (lebih cepat ~30x dari Winston menurut benchmark resmi Pino).

**Pros**:
- Redaction bawaan tanpa wrapper manual
- Child logger dengan field `domain` otomatis melekat di setiap baris
- Transport `pino-pretty` untuk developer experience yang baik
- Didesain untuk Node.js streaming, cocok dengan stdout based monitoring

**Cons**:
- Tim perlu belajar API Pino (meskipun sederhana)
- `pino-pretty` adalah devDependency tambahan
- Output JSON di production sulit dibaca langsung di terminal tanpa tool (harus pipe ke `pino-pretty` atau gunakan monitoring dashboard)

### Option 2: Winston

Logger paling populer di ekosistem Node.js. Transport based architecture, mendukung banyak output target (file, HTTP, database). Format kustom melalui `winston.format`.

**Pros**:
- Komunitas dan dokumentasi paling besar
- Banyak transport bawaan (file, HTTP, syslog)
- Format yang sangat fleksibel

**Cons**:
- Tidak native JSON; perlu `format.json()` yang menambah overhead
- Tidak punya redaction bawaan; perlu `winston-redact` atau wrapper manual
- Performa lebih lambat karena arsitektur transport chain
- Lebih berat (dependency tree lebih besar)

### Option 3: Bunyan

Logger JSON native, konsep child logger mirip Pino. Maintenance rendah (update terakhir sudah lama).

**Pros**:
- JSON native dengan child logger bawaan
- API sederhana

**Cons**:
- Maintenance rendah, repository kurang aktif
- Tidak ada redaction bawaan
- Ekosistem plugin lebih kecil
- Tidak ada transport pretty print yang setara `pino-pretty`

## Rationale

Pino dipilih karena tiga kekuatan yang langsung menjawab masalah proyek ini:

1. **Redaction bawaan** menyelesaikan masalah data sensitif di log tanpa perlu menulis wrapper manual. Cukup deklarasikan paths (`email`, `serverKey`, `token`, dll.) dan Pino otomatis mengganti nilainya dengan `[REDACTED]` di seluruh output. Winston dan Bunyan tidak punya fitur ini secara native.

2. **Child logger per domain** menyelesaikan masalah identifikasi sumber log. Setiap child logger membawa field `domain` yang otomatis melekat, sehingga monitoring dapat memfilter log berdasarkan `domain: "payment"` vs `domain: "webhook"` tanpa parsing teks.

3. **Performa** penting karena logger dipanggil di setiap request API termasuk webhook Midtrans yang bisa masuk bersamaan. Pino menggunakan serialisasi JSON langsung ke stdout tanpa overhead transport chain, menjaga latency request tetap rendah.

Untuk middleware, Next.js menyediakan `middleware.ts` di root project yang berjalan di edge runtime sebelum semua route handler. Ini adalah tempat paling tepat untuk validasi header global dan request ID injection karena: (1) berjalan sebelum logic bisnis, (2) berlaku untuk semua route yang cocok dengan matcher, (3) dapat memodifikasi request headers yang diterima route handler.

Webhook endpoint `/api/payment/notification` di-exclude dari Content-Type check karena Midtrans mengirim notification dengan format yang tidak selalu standar, dan endpoint ini sudah dilindungi oleh timing safe SHA-512 signature verification (spec 0003).
