# Review, server-side-price-validation, 2026-09-23

**Reviewed by**: Gemini 3.8 Flash (author on Claude Sonnet)
**Scope**: 9 files, uncommitted
**Verdict**: Approve with nits

## Summary

Perubahan ini mengamankan alur transaksi pembayaran dengan memvalidasi nominal harga secara mutlak melalui data master katalog di server serta menyaring payload menggunakan Zod. Celah pemalsuan harga dari peramban telah tertutup sepenuhnya karena rute pembayaran mengambil harga langsung dari katalog resmi. Penanganan rate limit juga telah diperkuat dengan memprioritaskan header infrastruktur terpercaya untuk mencegah spoofing IP. Seluruh 70 pengujian otomatis berjalan sukses.

## Minor

### 🟡 Potensi string undefined pada URL callback jika env belum diatur, `app/api/payment/route.ts:136`
**Problem**: Callback URL Midtrans merangkai variabel lingkungan `process.env.NEXT_PUBLIC_BASE_URL` secara langsung tanpa nilai cadangan.
**Why it matters**: Jika variabel lingkungan tersebut belum terdefinisi pada lingkungan pengembangan lokal, URL callback yang dikirim ke Midtrans akan bernilai `undefined/invoice/...` sehingga pengalihan halaman setelah pembayaran dapat gagal.
**Suggested fix**: Tambahkan nilai default cadangan seperti string kosong atau URL origin peramban bila variabel env tidak tersedia.

### 🟡 Operasi terpisah antara penambahan counter dan penetapan masa berlaku kunci, `lib/rate-limit.ts:48`
**Problem**: Eksekusi penambahan hitungan dan penetapan masa kedaluwarsa kunci dilakukan dalam dua perintah berurutan, bukan atomic.
**Why it matters**: Jika terjadi gangguan jaringan atau server mati tepat setelah perintah penambahan counter pertama sebelum masa berlaku terpasang, kunci tersebut berisiko tersimpan di Redis tanpa batas waktu kedaluwarsa.
**Suggested fix**: Gunakan opsi NX dan EX pada perintah set, atau periksa apakah kunci belum memiliki masa aktif saat counter dinaikkan.

## Nits

* ⚪ `components/TitleGame/ClientTopUp.tsx:84`, payload warisan `product` masih dikirim bersama `productId`, dapat dihapus di masa mendatang setelah seluruh sistem beralih penuh.
* ⚪ `vitest.config.ts:1`, peringatan modul CommonJS dari Vitest dapat dihilangkan dengan mengubah ekstensi file menjadi `vitest.config.mts`.

## Strengths

* Eliminasi total manipulasi harga sisi klien dengan mengikat nominal transaksi langsung ke data katalog resmi server.
* Penguatan ekstraksi alamat IP klien melalui pemilahan header terpercaya (`x-real-ip` dan `cf-connecting-ip`) sebelum memeriksa `x-forwarded-for`.
* Sanitasi ketat saat menyimpan invoice ke database Prisma sehingga tidak ada atribut liar yang masuk ke kolom JSON.
* Cakupan pengujian unit dan integrasi yang sangat komprehensif dengan 70 skenario pengujian otomatis yang lulus seluruhnya.

## Test coverage

Cakupan pengujian otomatis menggunakan Vitest berjalan menyeluruh di seluruh aspek perubahan kode. Pengujian mencakup validasi skema Zod pada `lib/validations/payment.test.ts`, integritas katalog pada `lib/datas/productData.test.ts`, proteksi dan pemilahan IP pada `lib/rate-limit.test.ts`, serta pengujian integrasi alur rute pembayaran Midtrans dan snapshot database pada `app/api/payment/route.test.ts`.
