# Verify: error-sanitization · spec 0005 · updated 2026-09-26
_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Manual / Integration
- [x] Request GET `/api/invoice/ORDER-NONEXISTENT` → response HTTP 404 `{ success: false, message: "Invoice tidak ditemukan" }` tanpa field `error` → AC-1, AC-2, AC-3
- [x] Request GET `/api/invoice` tanpa orderId → response HTTP 400 `{ success: false, message: "Order ID wajib diisi" }` → AC-1, AC-3
- [x] Request POST `/api/payment` dengan payload invalid → response HTTP 400 `{ success: false, message: "Data permohonan pembayaran tidak valid", errors: { ... } }` → AC-1, AC-3
- [x] Request POST `/api/payment/notification` dengan signature salah → response HTTP 403 `{ success: false, message: "Signature tidak valid" }` → AC-1, AC-3
- [x] Request POST `/api/payment/notification` mengalami kendala server → response HTTP 500 `{ success: false, message: "Gagal memproses notifikasi" }` dalam Bahasa Indonesia tanpa stack trace → AC-1, AC-3, AC-4

## Commands
- [x] `npm test` → 107 pengujian otomatis di 8 test file lulus tanpa galat, termasuk pengujian `lib/errors.test.ts`, `lib/env.test.ts`, dan rute API → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- [x] `npm run build` → Prisma client ter-generate, typechecking TypeScript berhasil, dan seluruh rute terkompilasi tanpa galat → AC-1..AC-7
- [x] Jalankan parsing `lib/env.ts` dengan variabel yang tidak lengkap → modul melempar Error eksplisit seperti `"Missing required env var: MIDTRANS_SERVER_KEY"` saat startup → AC-5, AC-6

## Acceptance-criteria coverage
- AC-1: Seluruh rute publik (`POST /api/payment`, `POST /api/payment/notification`, `GET /api/invoice/[orderId]`) mengembalikan shape `{ success: false, message: string, code?: string }` via helper `apiError()`
- AC-2: Field `error: errorMessage` dihapus dari `GET /api/invoice/[orderId]`; galat internal hanya dicatat di `console.error` server
- AC-3: Seluruh pesan galat menggunakan Bahasa Indonesia yang bersih tanpa bocoran nama file atau jejak internal
- AC-4: Pesan galat 500 di `POST /api/payment/notification` disesuaikan menjadi `'Gagal memproses notifikasi'`
- AC-5: File `lib/env.ts` memvalidasi lima variabel lingkungan wajib (`MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`) saat modul dimuat
- AC-6: Pesan galat dari `lib/env.ts` menyebutkan nama variabel yang kurang secara eksplisit (`Missing required env var: ...`)
- AC-7: `lib/env.ts` diimpor di `lib/prisma.ts` dan `lib/rate-limit.ts` untuk memastikan validasi gagal-cepat sebelum request dilayani
