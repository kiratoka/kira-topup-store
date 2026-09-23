# Changelog

Semua perubahan penting pada proyek ini didokumentasikan dalam file ini.
Format ini berbasis pada [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Validasi skema Zod ketat untuk data masukan transaksi pembayaran meliputi email, userId, serverId, gameId, dan productId (lihat spec 0002).
- Fungsi pencarian produk resmi di katalog server dengan perlindungan terhadap collision properti objek prototype.
- Pemilahan alamat IP klien yang memprioritaskan header terpercaya x-real-ip dan cf-connecting-ip untuk pencegahan spoofing.
- Rangkaian pengujian otomatis menyeluruh dengan Vitest untuk validasi skema, integritas katalog, dan integrasi rute pembayaran.

### Changed
- Rute pembayaran /api/payment menetapkan nominal transaksi Midtrans langsung dari data katalog server dan mengabaikan harga dari klien peramban.
- Penyimpanan invoice pesanan ke database Prisma menggunakan data produk kanonikal dan sanitasi atribut data pelanggan.
- Pesan galat rute pembayaran distandarkan agar ramah pengguna tanpa membocorkan pesan error internal server.

### Security
- Menutup celah manipulasi harga transaksi dari peramban dengan validasi nominal otoritatif di server (lihat spec 0002).
- Menutup celah pemalsuan identitas IP pada rate limiting pembayaran melalui pemilahan header jaringan terpercaya.
