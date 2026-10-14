# Verify: webhook-security-idempotency · spec 0003 · updated 2026-09-24
_Steps derived from spec 0003 acceptance criteria and value sourcing. `/check verify` runs these; `/test` locks the durable ones._

## Manual / Integration
- [x] Kirim request POST ke `/api/payment/notification` dengan signature valid dari Midtrans Sandbox notification tester untuk invoice berstatus pending → status invoice diperbarui ke success dan menghasilkan HTTP 200 { success: true } → AC-1, AC-3
- [x] Kirim request POST ke `/api/payment/notification` dengan status_code 200 dan status transaksi settle/capture untuk invoice yang sudah berstatus success → handler mengembalikan HTTP 200 { success: true } secara instan, tanpa query update DB dan tercatat console.warn → AC-3, AC-6
- [x] Kirim request POST ke `/api/payment/notification` untuk invoice berstatus failed → handler mengembalikan HTTP 200 { success: true } tanpa memicu update ulang → AC-3, AC-6

## Commands
- [x] `npm test` → seluruh 88 pengujian otomatis termasuk 17 pengujian integrasi webhook notifikasi dan 12 pengujian rate limit berjalan sukses → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- [x] Kirim request POST ke `/api/payment/notification` dengan signature_key salah (panjang sama 128 karakter hex) → server merespons HTTP 403 Forbidden dengan pesan "Signature tidak valid" → AC-1
- [x] Kirim request POST ke `/api/payment/notification` dengan signature_key berukuran acak/berbeda panjang → server menolak dengan HTTP 403 Forbidden secara aman tanpa runtime exception TypeError Buffer length → AC-1
- [x] Kirim lebih dari 30 request dalam rentang waktu 60 detik dari IP yang sama ke endpoint notifikasi → server menolak request ke-31 dengan HTTP 429 Too Many Requests (namespace Redis `rate-limit:webhook:<ip>`) → AC-2
- [x] Kirim request POST ke `/api/payment/notification` dengan order_id yang tidak ada pada database → server merespons HTTP 404 Not Found dan mencatat peringatan console.warn → AC-4
- [x] Saat koneksi Redis mengalami gangguan atau getRedis mengembalikan null → permintaan webhook tetap diloloskan (fail open) dan diproses sampai verifikasi signature → AC-5
- [x] Simulasi race condition notifikasi paralel di mana transaksi telah difinalisasi secara konkuren (updateMany count: 0) → server mengembalikan HTTP 200 { success: true }, mencatat console.warn, dan status akhir tidak tertimpa → AC-3, AC-6

## Acceptance-criteria coverage
- AC-1: covered by crypto.timingSafeEqual constant-time comparison test, buffer length check guard, and 403 status assertion
- AC-2: covered by Redis rate limiting tests with keyPrefix 'rate-limit:webhook', threshold 30 req/min, and 429 status assertion
- AC-3: covered by idempotency check testing terminal invoice status ('success' and 'failed') returning 200 and atomic conditional update (updateMany) neutralizing race conditions
- AC-4: covered by non-existent order_id database lookup returning 404 with warning log
- AC-5: covered by Redis fail-open test returning false without blocking valid webhooks
- AC-6: covered by console.warn spy assertions when duplicate terminal webhook is ignored
