# 0004. Living Architecture and Security Diagrams: Rationale

## Context

Repositori Kira Topup Store memiliki alur transaksi dan proteksi keamanan yang melibatkan beberapa komponen penting. Komponen tersebut meliputi antarmuka pengguna Next.js App Router, validasi harga di sisi server, gateway pembayaran Midtrans Snap, verifikasi webhook dengan perbandingan waktu konstan (timing safe equal, yaitu perbandingan string yang memakan waktu tetap agar tidak bisa ditebak penyerang), pembatasan laju request berbasis Redis Cloud, dan penyimpanan data pesanan menggunakan Prisma PostgreSQL.

Saat ini belum ada dokumentasi visual arsitektur yang merangkum cara kerja seluruh komponen tersebut secara terpadu. Tanpa diagram alur yang jelas, pengembang dan agen kecerdasan buatan menghadapi kesulitan memahami batas tanggung jawab masing masing komponen, alur eksekusi transaksi dari hulu ke hilir, serta titik pemeriksaan keamanan yang krusial.

Risiko utama dari ketiadaan dokumentasi arsitektur hidup adalah terjadinya regresi keamanan saat kode dimodifikasi. Sebagai contoh, pengembang dapat secara tidak sengaja melewatkan validasi harga server atau menghapus pengecekan idempoten (idempotency, yaitu pencegahan eksekusi berulang untuk transaksi yang sama). Selain itu, dokumentasi statis biasa sering kali cepat usang setelah beberapa siklus rilis kode jika tidak disertai panduan pemeliharaan yang terhubung langsung dengan alur kerja pengembang.

## Options considered

### Option 1: Struktur modular dengan berkas README.md sebagai indeks dan dokumen terpisah

Menyusun dokumentasi dalam beberapa berkas terfokus di `docs/architecture/`: satu berkas indeks `README.md` sebagai gerbang navigasi dan gambaran arsitektur sistem, didukung berkas tematik untuk alur checkout, alur webhook, lapisan keamanan, serta panduan pemeliharaan.

**Pros**:
- Diagram terfokus pada topik spesifik sehingga mudah dibaca, mudah dirender tanpa penurunan performa Markdown viewer, dan mudah dirawat.
- Pengembang atau agen AI dapat memuat hanya dokumen yang relevan dengan tugas yang sedang dikerjakan tanpa menghabiskan konteks bacaan.
- Pembaruan berkas terisolasi sehingga meminimalkan konflik perubahan dokumen di repositori.

**Cons**:
- Membutuhkan navigasi tautan antar berkas daripada membaca satu halaman panjang dari atas ke bawah.

### Option 2: Satu berkas monolitik tunggal

Menggabungkan seluruh diagram arsitektur sistem, sequence diagram transaksi, diagram alur webhook, flowchart keamanan, dan panduan pemeliharaan ke dalam satu berkas `docs/architecture/README.md` berukuran besar.

**Pros**:
- Seluruh informasi terkumpul dalam satu tempat tanpa perlu berpindah berkas.
- Struktur direktori sangat sederhana hanya satu berkas.

**Cons**:
- Berkas menjadi sangat panjang dan padat sehingga sulit dipindai dengan cepat oleh pembaca.
- Merender banyak blok diagram Mermaid sekaligus dalam satu berkas dapat memperlambat pratinjau dokumen di beberapa editor kode.
- Setiap modifikasi kecil pada satu alur akan mengubah seluruh berkas dokumentasi.

### Option 3: Struktur berbasis subdirektori domain per modul

Membuat subdirektori terpisah untuk masing masing domain seperti `docs/architecture/checkout/`, `docs/architecture/webhook/`, dan `docs/architecture/security/` dengan berkas diagram dan deskripsi mandiri di dalamnya.

**Pros**:
- Skalabilitas sangat tinggi jika nantinya setiap domain memiliki puluhan sub diagram dan dokumen teknis turunan.

**Cons**:
- Terlalu rumit (over engineering) untuk ukuran sistem saat ini yang hanya terdiri dari dua rute utama pembayaran dan pustaka pendukung.
- Menambah lapisan kedalaman folder yang tidak diperlukan dan mempersulit pemindaian cepat.

## Rationale

Sistem Kira Topup Store memiliki batasan concern yang sangat jelas antara transaksi checkout sisi klien, pemrosesan notifikasi asinkron Midtrans, dan proteksi keamanan rate limiting Redis. Memisahkan dokumentasi ke dalam dokumen tematik modular memberikan kejelasan tinggi bagi pembaca. Seorang pengembang yang sedang memperbaiki webhook hanya perlu membuka `webhook-flow.md` tanpa terganggu oleh diagram formulir checkout.

Pendekatan satu berkas monolitik ditolak karena berkas akan menjadi sangat panjang dan lambat dirender saat memuat empat diagram Mermaid yang rumit sekaligus. Pendekatan subdirektori berjenjang juga ditolak karena memperkenalkan kompleksitas hierarki yang berlebihan untuk ukuran sistem saat ini.

Pendaftaran ke `AGENTS.md` adalah keputusan penting untuk aspek living documentation. Tanpa pendaftaran ini, agen kecerdasan buatan pada alur kerja berikutnya tidak akan menyadari keberadaan diagram arsitektur, sehingga diagram berisiko terbengkalai dan tidak diperbarui saat kode di `app/api/` atau `lib/` mengalami perubahan.
