# Changelog

Semua perubahan penting pada proyek ini didokumentasikan dalam file ini.
Format ini berbasis pada [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha] - 2026-10-14

### Added
- Validasi skema Zod ketat untuk data masukan transaksi pembayaran meliputi email, userId, serverId, gameId, dan productId (lihat spec 0002).
- Fungsi pencarian produk resmi di katalog server dengan perlindungan terhadap collision properti objek prototype.
- Pemilahan alamat IP klien yang memprioritaskan header terpercaya x-real-ip dan cf-connecting-ip untuk pencegahan spoofing.
- Rangkaian pengujian otomatis menyeluruh dengan Vitest untuk validasi skema, integritas katalog, dan integrasi rute pembayaran.
- Modul penjaga variabel lingkungan berbasis Zod di lib/env.ts yang memeriksa lima konfigurasi wajib saat aplikasi dijalankan (lihat spec 0005).
- Pembantu format galat terpadu lib/errors.ts melalui fungsi apiError yang memastikan bentuk respons seragam dan melindungi kunci bawaan sistem (lihat spec 0005).
- Rute pencarian data invoice melalui query parameter pada GET /api/invoice dengan validasi parameter pesanan.
- Verifikasi tanda tangan digital webhook Midtrans menggunakan perbandingan waktu konstan yang tahan serangan waktu (lihat spec 0003).
- Mekanisme pembatasan laju tersendiri untuk endpoint notifikasi pembayaran berbasis Redis (lihat spec 0003).

### Changed
- Rute pembayaran /api/payment menetapkan nominal transaksi Midtrans langsung dari data katalog server dan mengabaikan harga dari klien peramban.
- Penyimpanan invoice pesanan ke database Prisma menggunakan data produk kanonikal dan sanitasi atribut data pelanggan.
- Pesan galat rute pembayaran distandarkan agar ramah pengguna tanpa membocorkan pesan error internal server.
- Penyeragaman respons galat pada seluruh rute API publik dengan pesan berbahasa Indonesia dan kode status HTTP yang konsisten (lihat spec 0005).
- Pembaruan status transaksi pada database menggunakan kueri bersyarat atomik untuk mencegah penimpaan status saat menerima notifikasi bersamaan (lihat spec 0003).
- Pengabaian notifikasi webhook untuk transaksi yang telah berstatus akhir sukses atau gagal (lihat spec 0003).
- Penentuan mode produksi Midtrans pada gateway pembayaran yang kini diatur dinamis via variabel lingkungan MIDTRANS_IS_PRODUCTION.

### Fixed
- Pencegahan kebocoran informasi galat internal pada rute GET /api/invoice/[orderId] dengan menghapus atribut error yang sebelumnya menampilkan pesan asli sistem ke pengguna (lihat spec 0005).
- Pesan galat berbahasa Inggris pada endpoint notifikasi pembayaran diganti dengan pesan Bahasa Indonesia yang aman (lihat spec 0005).

### Security
- Menutup celah manipulasi harga transaksi dari peramban dengan validasi nominal otoritatif di server (lihat spec 0002).
- Menutup celah pemalsuan identitas IP pada rate limiting pembayaran melalui pemilahan header jaringan terpercaya.
- Pencegahan kebocoran data internal, jejak tumpukan galat, dan struktur berkas sistem ke publik pada seluruh rute API (lihat spec 0005).
- Penjagaan integritas startup aplikasi dengan penghentian proses lebih awal jika variabel lingkungan penting tidak ditemukan (lihat spec 0005).
- Penutupan celah manipulasi status transaksi melalui verifikasi signature waktu konstan dan penanganan idempoten pada webhook pembayaran (lihat spec 0003).
