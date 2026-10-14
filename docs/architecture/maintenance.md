# Panduan Pemeliharaan Hidup Arsitektur dan Diagram

Dokumentasi arsitektur di dalam folder `docs/architecture/` merupakan dokumentasi hidup (living documentation). Artinya, isi dokumen dan diagram alur di dalamnya bukan catatan arsip statis, melainkan representasi visual yang wajib selalu mencerminkan kondisi kode aktif di repositori Kira Topup Store.

[Kembali ke Indeks Arsitektur](README.md)

---

## Prinsip Dokumentasi Hidup

1. **Sinkron Bersama Kode**: Setiap kali rute pembayaran, penanganan webhook, mekanisme keamanan, atau infrastruktur mengalami perubahan, diagram yang relevan wajib diperbarui pada branch pekerjaan yang sama.
2. **Representasi Nyata**: Diagram hanya boleh memuat alur dan komponen yang benar benar sudah diimplementasikan di dalam basis kode, bukan rancangan spekulatif yang belum dibangun.
3. **Kerahasiaan Data**: Diagram dilarang keras memuat nilai kredensial nyata, token rahasia, atau kata sandi basis data. Gunakan placeholder variabel lingkungan seperti `process.env.MIDTRANS_SERVER_KEY` atau `REDIS_URL`.
4. **Keterbacaan dan Validitas Sintaks**: Seluruh diagram Mermaid wajib dipastikan valid dan dapat dirender dengan sempurna di Markdown preview sebelum kode disatukan ke cabang utama.

---

## Matriks Pemicu Pembaruan Dokumen

Gunakan tabel matriks ini untuk mengetahui berkas dokumentasi mana yang wajib Anda perbarui ketika melakukan modifikasi kode pada area tertentu:

| Area Kode yang Dimodifikasi | Berkas Dokumentasi Terkait | Tindakan Pembaruan yang Wajib Dilakukan |
|---|---|---|
| Penambahan game baru atau variasi produk di `lib/datas/` | `docs/architecture/checkout-flow.md` | Periksa apakah ada aturan validasi baru (misalnya kebutuhan parameter khusus selain User ID dan Server ID). |
| Perubahan form input atau penambahan modal di `components/TitleGame/` | `docs/architecture/checkout-flow.md` | Perbarui urutan interaksi peramban klien pada Sequence Diagram checkout. |
| Perubahan skema validasi Zod di `lib/validations/payment.ts` | `docs/architecture/checkout-flow.md` dan `docs/architecture/security-layers.md` | Sesuaikan rincian pengecekan pada Lapis 3 di Flowchart keamanan dan Sequence Diagram checkout. |
| Modifikasi rute transaksi di `app/api/payment/route.ts` | `docs/architecture/checkout-flow.md`, `docs/architecture/security-layers.md`, dan `docs/architecture/README.md` | Perbarui tahapan pembuatan invoice, parameter Snap Midtrans, atau logika bisnis yang berubah. |
| Modifikasi rute webhook di `app/api/payment/notification/route.ts` | `docs/architecture/webhook-flow.md` dan `docs/architecture/security-layers.md` | Perbarui alur verifikasi signature, penanganan idempotensi, atau pemetaan status transaksi baru. |
| Modifikasi algoritma rate limiter di `lib/rate-limit.ts` atau `lib/redis.ts` | `docs/architecture/security-layers.md` dan `docs/architecture/README.md` | Perbarui ambang batas limit, durasi jendela waktu (window), atau hierarki pembacaan header IP. |
| Penambahan tabel database atau model Prisma baru di `prisma/schema.prisma` | `docs/architecture/README.md` | Perbarui diagram kontainer global dan daftar tabel database yang digunakan. |
| Perubahan alur kerja tim atau konvensi agen AI di `AGENTS.md` | `docs/architecture/maintenance.md` | Perbarui pedoman pemeliharaan dan daftar periksa pengembang. |

---

## Daftar Periksa Pengembang (Developer Checklist)

Jalankan daftar periksa berikut sebelum Anda mengajukan pull request atau menandai suatu fitur selesai:

- [ ] **Pemeriksaan Alur Transaksi**: Apakah ada perubahan pada alur data antara klien, server Next.js, dan Midtrans? Jika ya, apakah `checkout-flow.md` sudah diperbarui?
- [ ] **Pemeriksaan Webhook**: Apakah ada perubahan pada cara webhook diverifikasi atau disimpan? Jika ya, apakah `webhook-flow.md` sudah diperbarui?
- [ ] **Pemeriksaan Lapis Keamanan**: Apakah ada penambahan middleware, proteksi IP, atau validasi baru? Jika ya, apakah `security-layers.md` sudah mencakup lapisan baru tersebut?
- [ ] **Pemeriksaan Sintaks Mermaid**: Apakah seluruh blok kode Mermaid di semua berkas Markdown dapat dirender dengan benar tanpa galat sintaks di pratinjau editor kode Anda?
- [ ] **Pemeriksaan Navigasi**: Apakah tautan navigasi antar berkas tetap utuh dan merujuk ke jalur berkas yang tepat?
- [ ] **Pemeriksaan Konteks AI**: Apakah berkas `AGENTS.md` pada akar repositori masih memuat rujukan yang benar terhadap direktori dokumentasi ini?

---

## Panduan Penulisan dan Validasi Sintaks Mermaid

Agar diagram Mermaid selalu dapat dirender dengan stabil di berbagai platform (GitHub, IDE preview, atau pembaca Markdown lainnya, baik tema terang maupun gelap/dark mode), patuhi panduan teknis berikut:

### 1. Kompatibilitas Dark Mode (Tema Gelap)
- **Flowchart & Graph**: Selalu awali diagram dengan baris inisialisasi tema gelap:
  ```mermaid
  %%{init: {'theme': 'dark'}}%%
  flowchart TD
  ```
- **Sequence Diagram**: Hindari penggunaan blok latar warna kustom `rect rgb(...)` pastel karena teks menjadi sulit terbaca atau kontras hilang di editor bertema gelap. Gunakan penanda fase berbasis catatan: `Note over PartisipanA,PartisipanB: **[Fase X] Nama Fase**`.

### 2. Pembungkusan Teks dengan Karakter Khusus
Karakter seperti kurung buka, kurung tutup, titik dua, tanda petik, atau garis miring dapat memicu galat parser Mermaid jika diletakkan langsung di dalam label node.
- **Rekomendasi**: Selalu bungkus teks label menggunakan tanda kutip ganda di dalam tanda kurung siku, misalnya: `NodeA["Deskripsi Label (Keterangan)"]`.
- Gunakan `\n` untuk pemisah baris baru di dalam label node alih-alih tag `<br/>` agar tidak merusak rendering parser tertentu.

### 3. Arah dan Format Panah Relasi
- Gunakan `-->` untuk relasi standar pada `flowchart` atau `graph`.
- Gunakan `->>` untuk pesan sinkron dan `-->>` untuk pesan balasan pada `sequenceDiagram`.
- Pastikan setiap nama partisipan (participant/actor) pada diagram urutan dideklarasikan secara eksplisit di awal diagram agar urutan kolom tersusun secara logis dari kiri ke kanan.

### 4. Validasi Pratinjau Lokal
Sebelum melakukan commit:
1. Buka berkas Markdown di editor kode Anda (terutama dalam tema gelap).
2. Gunakan fitur Markdown Preview bawaan atau ekstensi Mermaid Preview untuk memverifikasi bahwa diagram muncul secara visual dan semua teks terbaca dengan jelas.
3. Pastikan tidak ada blok diagram yang menampilkan pesan kesalahan teks merah bertuliskan syntax error.
