# 0005. Error sanitization and environment guard · Rationale

## Context

Tiga rute API publik Kira Topup Store sudah menangani galat, namun belum konsisten. `GET /api/invoice/[orderId]` meneruskan `error.message` dari exception langsung ke field `error` di body respons; ini bisa mengekspos nama file, stack trace, atau pesan internal Prisma ke pengguna umum. `POST /api/payment/notification` mengembalikan pesan 500 dalam bahasa Inggris sementara rute lain menggunakan Bahasa Indonesia. Shape respons secara umum konsisten (`{ success, message }`) tapi tidak ada helper terpusat yang menjamin ini.

Di sisi konfigurasi, tidak ada validasi variabel lingkungan saat startup. Server dapat berjalan dalam kondisi `MIDTRANS_SERVER_KEY` kosong dan hanya gagal saat transaksi pertama diproses, yang berarti kesalahan konfigurasi baru terdeteksi setelah traffic masuk dan berpotensi mengakibatkan transaksi rusak tanpa log yang jelas.

Keduanya adalah masalah produksi readiness. Kebocoran pesan teknis ke klien adalah kelemahan keamanan informasi. Absennya env guard membuat deployment silently broken dan sulit di-debug.

## Options considered

### Option 1: Single migration PR (fix semua file sekaligus + helper terpusat)

Buat `lib/errors.ts` dengan fungsi `apiError(message, status, code?)`, buat `lib/env.ts` dengan Zod validation, lalu perbaiki ketiga rute dalam satu PR.

**Pros**:
- Semua pelanggaran teratasi sekaligus, tidak ada debt yang tersisa
- Helper terpusat menjamin konsistensi untuk semua rute baru setelahnya
- Perubahan codebase kecil (tiga rute, dua lib file baru)

**Cons**:
- Satu PR menyentuh semua rute sekaligus, memerlukan review menyeluruh

### Option 2: Enforce going forward, existing violations as debt

Hanya definisikan standar dan lint rule, perbaiki pelanggaran hanya di rute baru, biarkan yang lama sebagai debt.

**Pros**:
- PR pertama sangat kecil

**Cons**:
- Celah keamanan (kebocoran `error.message`) tetap terbuka di production sampai debt diselesaikan
- Rute invoice sudah ada di production dengan bug aktif, ini tidak bisa ditunda

### Option 3: Document only (convention, no enforcement)

Tulis spec, andalkan code review saja.

**Pros**:
- Tidak ada pekerjaan implementasi segera

**Cons**:
- Tidak ada enforcement, pola bocor bisa berulang di rute baru
- Bug aktif di invoice route tetap terbuka

## Decision and Rationale

Option 1 dipilih karena bug kebocoran `error.message` di invoice route adalah kelemahan aktif di production, bukan debt hipotetis. Dengan tiga rute dan dua file lib baru, lingkup perubahannya terbatas dan aman diselesaikan dalam satu PR. Option 2 akan membiarkan celah ini terbuka secara sadar, yang tidak dapat diterima. Option 3 bahkan tidak menutupnya.

Menggunakan Zod untuk env validation konsisten dengan keputusan project untuk menggunakan Zod sebagai library validasi utama (sudah dipakai di `lib/validations/payment.ts`), sehingga tidak menambah dependensi baru. Impor `lib/env.ts` di `lib/prisma.ts` dan `lib/rate-limit.ts` dipilih atas `instrumentation.ts` karena kedua lib tersebut sudah diimpor di semua rute, menjamin validasi berjalan sebelum request pertama tanpa konfigurasi tambahan di Next.js.
