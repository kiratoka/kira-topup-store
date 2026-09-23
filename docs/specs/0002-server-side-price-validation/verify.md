# Verify: server-side-price-validation (spec 0002, updated 2026-09-22)

_Steps derived from spec 0002 acceptance criteria and value sourcing. `/check verify` runs these; `/test` locks the durable ones._

## UI and manual

- [ ] Buka halaman game Genshin Impact di `/topup/genshin-impact`, pilih nominal Crystal, isi formulir tanpa Server ID lalu klik Checkout → muncul dialog peringatan bahwa Server ID wajib diisi tanpa memanggil Midtrans (AC-4)
- [ ] Buka halaman game Love and Deepspace di `/topup/love-and-deepspace` (game tanpa kebutuhan server), isi formulir lengkap lalu klik Checkout → modal pembayaran Midtrans Snap terbuka lancar dengan nominal resmi katalog (AC-1, AC-4, AC-5)
- [ ] Lakukan checkout dengan email tidak valid → muncul dialog kesalahan format email dari server (AC-2)

## Commands

- [ ] `npm test` → seluruh 56 pengujian otomatis pada rute pembayaran, skema validasi Zod, dan katalog produk berjalan sukses (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6)
- [ ] Kirim POST request ke `/api/payment` dengan nominal harga dimanipulasi pada payload → server mengabaikan harga klien dan membuat transaksi Midtrans sesuai nominal master katalog (AC-1, AC-5)
- [ ] Kirim POST request ke `/api/payment` dengan productId fiktif → server merespon status 400 Bad Request tanpa memanggil Midtrans (AC-3)
- [ ] Kirim POST request ke `/api/payment` dengan gameId prototype seperti "toString" atau "constructor" → server merespon status 400 Bad Request tanpa memicu galat internal 500 (AC-2, AC-3)
- [ ] Kirim POST request ke `/api/payment` dengan userId melebihi 50 karakter → server merespon status 400 Bad Request dengan rincian batas panjang karakter (AC-2)
- [ ] Kirim lebih dari 10 request dalam satu menit dari alamat IP yang sama → server merespon status 429 Too Many Requests dengan pesan profesional (AC-6)

## Acceptance criteria coverage

* AC-1: covered by canonical price lookup test and Midtrans gross amount assertions
* AC-2: covered by payment schema tests, email syntax checks, string length bounds, and field error mapping
* AC-3: covered by product catalog lookup test and missing product 400 rejection
* AC-4: covered by server identifier requirement checks for games requiring server
* AC-5: covered by Midtrans Snap token generation and Prisma invoice snapshot tests
* AC-6: covered by Redis sliding window rate limit tests
