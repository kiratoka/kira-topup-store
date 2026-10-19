# Changelog

Semua perubahan penting pada proyek ini didokumentasikan dalam file ini.
Format ini berbasis pada [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1-alpha] - 2026-10-19

### Added
- Integrasi favicon resmi, apple touch icon, dan logo Kira Topup berformat WebP pada bilah navigasi dan metadata aplikasi di app/layout.tsx.

### Changed
- Penyesuaian tata letak StickyCheckoutBar agar lebih ringkas dan proporsional pada layar ponsel dengan informasi produk dan nominal yang adaptif.
- Label tombol aksi StickyCheckoutBar kini dinamis menyesuaikan tahapan pilihan pengguna (seperti Pilih Item, Lanjutkan, atau Bayar Sekarang).
- Penyesuaian lebar kondisi tertutup sidebar desktop dari 72px menjadi 80px untuk tampilan logo dan navigasi yang lebih lapang.

### Fixed
- Eliminasi tumpang tindih navigasi mobile pada rute /topup dengan menyembunyikan bilah navigasi bawah mobile sehingga tidak menutupi StickyCheckoutBar.
- Koreksi perilaku sticky header GameHeader pada layar ponsel agar tidak tumpang tindih dengan header navigasi utama.
- Penambahan ruang batas bawah pada kontainer ClientTopUp agar daftar produk dan formulir tidak tertutup oleh bilah checkout melayang.
- Penyelarasan posisi horizontal StickyCheckoutBar dengan variabel CSS --sidebar-w pada desktop agar mengikuti animasi buka tutup bilah samping.
- Penambahan bantalan area aman layar (safe area inset) pada StickyCheckoutBar untuk kenyamanan gestur navigasi ponsel modern.

### Performance
- Optimasi pemuatan gambar Next.js pada halaman beranda, kartu blog, dan posting blog dengan menyertakan atribut sizes yang responsif serta prioritas muat LCP untuk mengeliminasi peringatan performa.

## [0.3.0-alpha] - 2026-10-17

### Added
- Modul middleware Next.js di proxy.ts yang menyuntikkan header pelacakan unik x-request-id untuk setiap request API serta memverifikasi header Content-Type dan header Origin (lihat spec 0010).
- Sistem pencatatan log terstruktur berbasis pustaka Pino di lib/logging/logger.ts yang memformat log ke format JSON, menyunting otomatis data pribadi atau kredensial rahasia, serta menyediakan child logger khusus untuk setiap domain seperti paymentLogger, webhookLogger, redisLogger, invoiceLogger, dan dbLogger (lihat spec 0009 dan spec 0010).
- Skrip Lua atomik untuk pembatasan laju Redis di lib/cache/rate-limit.ts yang mengeksekusi operasi inkremen dan penetapan masa kedaluwarsa secara bersamaan serta memperbaiki kunci Redis yang kehilangan waktu kedaluwarsa (lihat spec 0006).
- Modul penyamaran data pribadi pelanggan di lib/security/masking.ts untuk menyensor alamat email pada respons invoice publik (lihat spec 0006).
- Rangkaian pengujian otomatis baru dengan Vitest untuk middleware proxy, child logger Pino, konfigurasi logging Prisma, serta pembatasan origin CSP.

### Changed
- Restrukturisasi total direktori lib/ menjadi enam subfolder domain modular (db/, cache/, payment/, security/, content/, utils/) dan folder types/ terpisah untuk meningkatkan keterbacaan serta memudahkan perawatan kode (lihat spec 0008).
- Seluruh panggilan console.error, console.warn, dan console.log pada file sisi server diganti dengan child logger Pino yang sesuai dengan domain masing masing (lihat spec 0010).
- Konfigurasi Prisma Client di lib/db/prisma.ts diselaraskan dengan child logger dbLogger yang hanya mengalirkan log error di produksi serta mengalirkan rincian query dan durasi eksekusi saat development (lihat spec 0009).
- Rute invoice GET /api/invoice dan GET /api/invoice/[orderId] kini menerapkan pembatasan laju pemanggilan sebesar 30 request per menit berbasis Redis dan menyamarkan email pembeli (lihat spec 0006).
- Token pembayaran Snap Midtrans pada respons invoice otomatis dikosongkan ketika status transaksi sudah bukan pending (lihat spec 0006).

### Security
- Pengetatan Content Security Policy (CSP) dan konfigurasi remotePatterns Next.js di next.config.ts dengan membatasi domain asal gambar hanya ke host tepercaya tanpa karakter wildcard (lihat spec 0007).
- Perlindungan endpoint POST API dari serangan Cross Site Request Forgery dan muatan tidak valid melalui validasi Content-Type application/json dan pemeriksaan header Origin di proxy.ts (lihat spec 0010).
- Pencegahan kebocoran data pribadi (PII) dan kredensial rahasia seperti email, token, server key, dan connection string melalui sistem redaksi otomatis pada logger server (lihat spec 0010).
- Mitigasi eksploitasi data pengguna (IDOR) pada endpoint invoice publik dengan menyamarkan email pelanggan dan membersihkan token pembayaran transaksi yang sudah selesai (lihat spec 0006).
- Eliminasi celah kondisi balapan (race condition) pada pembatasan laju Redis melalui eksekusi skrip Lua atomik (lihat spec 0006).
- Pencegahan kebocoran data query database dan parameter SQL ke log produksi melalui pembatasan event listener Prisma Client (lihat spec 0009).

## [0.2.0-alpha] - 2026-10-14

### Added
- Komponen antarmuka modular untuk alur transaksi top up meliputi GameHeader, AccountInfoSection, ProductSelectionSection, ProductCard, BenefitsSidebar, dan StickyCheckoutBar.
- Bilah checkout melayang pada bagian bawah layar yang menyajikan ringkasan pesanan serta akses tombol pembayaran secara praktis.
- Tampilan kartu produk dengan penanda lencana promo, rincian bonus, dan status pilihan aktif.
- Pembangkit metadata dinamis untuk optimasi mesin pencari pada rute halaman top up setiap game.
- Pola latar belakang visual kisi teknologi pada halaman transaksi game.

### Changed
- Struktur halaman top up dirombak dari rancangan monolitik menjadi tata letak modular yang bersih dan mudah dirawat.
- Tampilan dialog konfirmasi pesanan dan notifikasi validasi diselaraskan dengan tema visual modern.
- Model data produk diperkaya dengan properti lencana promosi dan rincian bonus mata uang game.

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
