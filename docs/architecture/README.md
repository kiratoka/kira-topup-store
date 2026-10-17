# Arsitektur Sistem Kira Topup Store

Dokumen ini memuat gambaran arsitektur tingkat tinggi untuk sistem Kira Topup Store. Sistem ini dirancang untuk melayani pembelian voucher game dan top up digital secara cepat, aman, dan terintegrasi dengan gerbang pembayaran Midtrans serta penyimpanan status transaksi di database PostgreSQL melalui Prisma ORM.

## Daftar Dokumen Arsitektur

Dokumentasi arsitektur disusun secara modular agar mudah dipelajari sesuai kebutuhan fokus pengembangan:

1. [Alur Checkout dan Validasi Harga Server](checkout-flow.md): Sequence diagram interaktif proses checkout, validasi formulir akun, validasi harga resmi di sisi server, pembuatan order ID unik, dan pembukaan modal pembayaran Midtrans Snap.
2. [Alur Notifikasi Webhook Midtrans dan Idempotensi](webhook-flow.md): Sequence diagram penanganan webhook asinkron dari Midtrans, verifikasi tanda tangan digital waktu konstan (timing safe equal), pembatasan laju request, dan penjagaan idempotensi status invoice.
3. [Lapisan Keamanan dan Proteksi Sistem](security-layers.md): Flowchart komprehensif seluruh lapisan pertahanan aplikasi mulai dari ekstraksi IP tepercaya, sliding window rate limit dengan fallback fail open, sanitasi pesan galat, hingga proteksi data sensitif.
4. [Panduan Pemeliharaan Hidup Arsitektur](maintenance.md): Pedoman pembaruan berkala diagram arsitektur, matriks pemicu sinkronisasi kode, serta daftar periksa pengembang agar dokumentasi selalu sejalan dengan kode aktif.

---

## Diagram Kontainer Arsitektur Global

Diagram kontainer berikut mengilustrasikan interaksi antar komponen utama sistem Kira Topup Store, meliputi peramban pengguna, runtime Next.js App Router, basis data PostgreSQL, layanan cache Redis Cloud, dan gerbang pembayaran Midtrans.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'fontSize': '14px'}}}%%
graph TB
    subgraph Klien ["Lingkungan Pengguna (Client Browser)"]
        Browser["Peramban Web Pengguna"]
        SnapJS["Midtrans Snap JS SDK"]
    end

    subgraph ServerApp ["Aplikasi Web (Next.js 16 App Router)"]
        UI_Storefront["Komponen Antarmuka Katalog & Form\n(components/TitleGame/)"]
        UI_Invoice["Halaman Status Invoice\n(app/invoice/[orderId]/)"]

        API_Payment["Rute Pembuatan Transaksi\n(app/api/payment/route.ts)"]
        API_Webhook["Rute Webhook Notifikasi\n(app/api/payment/notification/route.ts)"]

        Security_Module["Lapisan Proteksi Keamanan\n(lib/cache/rate-limit.ts & lib/payment/validations/)"]
        Catalog_Data["Katalog Master Game & Produk\n(lib/content/datas/)"]
        Prisma_Client["Prisma ORM Client Singleton\n(lib/db/prisma.ts)"]
    end

    subgraph Eksternal ["Infrastruktur Eksternal & Layanan Pihak Ketiga"]
        Redis_Cloud["Redis Cloud\n(TCP Sliding Window Rate Limiting)"]
        DB_Postgres["PostgreSQL Database\n(Penyimpanan Tabel Invoice, Game, Product)"]
        Midtrans_Snap["Midtrans Payment Gateway\n(Snap Engine & Webhook Dispatcher)"]
    end

    Browser -->|"1. Membuka katalog dan mengisi form data"| UI_Storefront
    UI_Storefront -->|"2. Mengirim data checkout (POST /api/payment)"| API_Payment

    API_Payment -->|"3. Ekstraksi IP dan pengecekan limit"| Security_Module
    Security_Module -->|"4. Sliding window INCR dan EXPIRE"| Redis_Cloud

    API_Payment -->|"5. Validasi skema Zod dan lookup harga resmi"| Catalog_Data
    API_Payment -->|"6. Membuat transaksi dan meminta token Snap"| Midtrans_Snap
    API_Payment -->|"7. Menyimpan invoice status pending"| Prisma_Client
    Prisma_Client -->|"8. Menyimpan record invoice baru"| DB_Postgres

    API_Payment -->>|"9. Mengembalikan Snap token dan order ID"| UI_Storefront
    UI_Storefront -->|"10. Menjalankan popup pembayaran via token"| SnapJS
    SnapJS <-->|"11. Sesi pembayaran pengguna"| Midtrans_Snap

    Midtrans_Snap -->|"12. Mengirim notifikasi status (POST /api/payment/notification)"| API_Webhook
    API_Webhook -->|"13. Verifikasi tanda tangan SHA512 dan cek status kanonikal"| Midtrans_Snap
    API_Webhook -->|"14. Memperbarui status pembayaran invoice"| Prisma_Client
    Prisma_Client -->|"15. Update data transaksi invoice"| DB_Postgres

    Browser -->|"16. Memeriksa status pesanan"| UI_Invoice
    UI_Invoice -->|"17. Query status invoice"| Prisma_Client
```

---

## Ringkasan Komponen Sistem

| Komponen | Jalur Kode Sumber | Tanggung Jawab Utama |
|---|---|---|
| Antarmuka Top Up | `components/TitleGame/` | Menampilkan pilihan voucher game, form data akun, pemilihan nominal, validasi formulir sisi klien, dan peluncuran modal pembayaran Snap. |
| Rute Pembayaran | `app/api/payment/route.ts` | Menerima permohonan pembayaran, membatasi laju request via Redis, memvalidasi skema data masukan, mencocokkan harga resmi dari katalog server, membuat transaksi di Midtrans, dan mencatat invoice ke database. |
| Rute Webhook | `app/api/payment/notification/route.ts` | Menerima notifikasi status pembayaran asinkron dari Midtrans, memverifikasi tanda tangan digital, mencegah eksekusi ganda (idempotency), dan memperbarui status invoice di database. |
| Rate Limiter | `lib/cache/rate-limit.ts` & `lib/cache/redis.ts` | Mengekstrak alamat IP klien tepercaya, menghitung frekuensi permintaan dengan algoritma sliding window berbasis Redis Cloud TCP, dan mengaktifkan proteksi fail open jika Redis mengalami gangguan. |
| Validasi Skema | `lib/payment/validations/payment.ts` | Memastikan struktur data pembayaran memenuhi standar ketat menggunakan Zod sebelum diteruskan ke logika bisnis atau database. |
| Katalog Produk | `lib/content/datas/productData.ts` & `gameData.ts` | Sumber kebenaran tunggal untuk daftar game resmi, kebutuhan server ID, dan nominal harga produk yang tidak dapat dimanipulasi oleh klien. |
| Basis Data & ORM | `prisma/schema.prisma` & `lib/db/prisma.ts` | Mengelola skema tabel `Invoice`, `Game`, dan `Product` serta menyediakan klien koneksi basis data PostgreSQL tunggal (singleton). |
| Halaman Invoice | `app/invoice/[orderId]/` | Menampilkan rincian pesanan, nomor invoice, status pembayaran terkini, instruksi pembayaran, dan bukti transaksi kepada pelanggan. |

---

## Pemisahan Lingkungan (Environment Separation)

Sistem saat ini dikonfigurasi untuk berjalan pada mode sandbox secara default selama tahap pengembangan dan pengujian keamanan:
- Parameter `isProduction` dikendalikan secara dinamis melalui environment variable `MIDTRANS_IS_PRODUCTION` (string `"true"` untuk mode produksi, selain itu fallback ke sandbox) pada instansiasi Snap client di `app/api/payment/route.ts` dan `app/api/payment/notification/route.ts`.
- Script Midtrans Snap di `components/TitleGame/ClientTopUp.tsx` dan `components/Invoice/Invoice.tsx` memuat berkas script secara dinamis melalui helper `getMidtransSnapUrl()` (`lib/payment/midtrans.ts`) berdasarkan nilai `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` (string `"true"` untuk production, selain itu fallback ke sandbox).
- Sebelum sistem diluncurkan ke tahap produksi nyata, atur `MIDTRANS_IS_PRODUCTION=true` dan `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true` serta perbarui server key dan client key Midtrans ke kredensial produksi pada environment deployment (misalnya Vercel).
