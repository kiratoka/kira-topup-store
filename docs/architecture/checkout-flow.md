# Alur Checkout dan Validasi Harga Server

Dokumen ini menyajikan alur interaktif proses transaksi checkout pada Kira Topup Store. Alur ini menjamin bahwa setiap transaksi yang dibuat memiliki data yang valid, diverifikasi terhadap katalog resmi di sisi server, dan terlindungi dari manipulasi harga oleh pengguna nakal sebelum pembayaran diluncurkan ke Midtrans Snap.

[Kembali ke Indeks Arsitektur](README.md)

---

## Diagram Urutan Alur Checkout (Sequence Diagram)

Diagram urutan berikut memetakan perjalanan data dari saat pengguna menekan tombol pembayaran pada antarmuka hingga modal pembayaran Midtrans Snap muncul di layar peramban.

```mermaid
sequenceDiagram
    autonumber
    actor Pengguna as Pengguna (User)
    participant Peramban as Peramban Klien<br/>(ClientTopUp.tsx)
    participant API as Rute Pembayaran<br/>(POST /api/payment)
    participant RateLimiter as Rate Limiter<br/>(lib/rate-limit.ts)
    participant Redis as Redis Cloud<br/>(TCP Client)
    participant Validator as Validasi Zod<br/>(paymentRequestSchema)
    participant Katalog as Katalog Server<br/>(productData.ts)
    participant Midtrans as Midtrans Snap API<br/>(Snap Engine)
    participant Database as Database PostgreSQL<br/>(Prisma ORM)

    %% Fase 1: Input Pengguna & Validasi Klien
    Pengguna ->> Peramban: Pilih nominal produk, isi User ID, Server ID, dan Email
    Pengguna ->> Peramban: Klik tombol bayar dan konfirmasi dialog
    Note over Peramban: [Fase 1] Validasi Awal di Sisi Klien
    Peramban ->> Peramban: Periksa kelengkapan input formulir

    %% Fase 2: Pengiriman Request & Rate Limiting
    Peramban ->> API: Kirim permintaan pembayaran (HTTP POST /api/payment)
    Note over API, Redis: [Fase 2] Lapisan Proteksi Laju Permintaan
    API ->> RateLimiter: Ambil IP klien via getClientIp(req)
    RateLimiter ->> Redis: INCR key rate-limit:IP dan cek batasan 10 req per menit
    Redis -->> RateLimiter: Jumlah request saat ini
    alt Request melebihi batas (limit > 10)
        RateLimiter -->> API: Terindikasi rate limited
        API -->> Peramban: Kembalikan respons HTTP 429 Terlalu Banyak Permintaan
    end

    %% Fase 3: Validasi Skema & Data Game
    Note over API, Validator: [Fase 3] Validasi Skema Zod & Keberadaan Game
    API ->> Validator: Validasi payload JSON dengan paymentRequestSchema.safeParse
    alt Skema tidak sesuai aturan
        Validator -->> API: Galat validasi terstruktur
        API -->> Peramban: Kembalikan respons HTTP 400 Payload Tidak Valid
    end
    API ->> API: Periksa keberadaan gameId dengan Object.hasOwn(gamesData, gameId)
    API ->> API: Periksa kewajiban serverId jika gameInfo.requiresServer bernilai true

    %% Fase 4: Otoritas Validasi Harga Sisi Server
    Note over API, Katalog: [Fase 4] Otoritas Validasi Harga Sisi Server
    API ->> Katalog: Lookup produk resmi via getProductById(gameId, targetProductId)
    alt Produk tidak ditemukan di katalog
        Katalog -->> API: Nilai null
        API -->> Peramban: Kembalikan respons HTTP 400 Produk Tidak Ditemukan
    end
    Katalog -->> API: Data produk kanonikal (ID, Nama, Harga Resmi)
    Note over API: Harga dari peramban klien diabaikan sepenuhnya.<br/>Hanya harga resmi dari katalog server yang digunakan!

    %% Fase 5: Registrasi Transaksi ke Midtrans
    Note over API, Midtrans: [Fase 5] Registrasi Transaksi ke Gerbang Pembayaran
    API ->> API: Buat nomor pesanan unik ORDER-${nanoid()}
    API ->> Midtrans: Panggil snap.createTransaction dengan detail resmi
    Midtrans -->> API: Kembalikan Snap Token dan URL Pembayaran

    %% Fase 6: Pencatatan Invoice ke Database
    Note over API, Database: [Fase 6] Pencatatan Invoice ke Database
    API ->> Database: prisma.invoice.create (orderId, token, product snapshot, customer, status pending)
    Database -->> API: Konfirmasi penyimpanan record invoice

    API -->> Peramban: Kembalikan respons JSON { success: true, token, orderId, invoiceUrl }

    %% Fase 7: Peluncuran Modal Snap
    Note over Peramban, Midtrans: [Fase 7] Peluncuran Modal Pembayaran Snap
    Peramban ->> Midtrans: Panggil window.snap.pay(token, callbacks)
    Midtrans -->> Pengguna: Tampilkan antarmuka popup pembayaran Snap

    %% Fase 8: Siklus Callback Pembayaran
    alt Pembayaran Selesai Berhasil
        Pengguna ->> Midtrans: Selesaikan pembayaran via QRIS, Virtual Account, atau E-Wallet
        Midtrans ->> Peramban: Callback onSuccess
        Peramban ->> Pengguna: Arahkan ke /invoice/orderId
    else Pembayaran Menunggu
        Midtrans ->> Peramban: Callback onPending
        Peramban ->> Pengguna: Arahkan ke /invoice/orderId?status=pending
    else Pembayaran Dibatalkan atau Galat
        Midtrans ->> Peramban: Callback onError atau onClose
        Peramban ->> Pengguna: Tampilkan pesan kesalahan atau arahkan ke status pending
    end
```

---

## Titik Pemeriksaan Keamanan dan Integritas

Alur checkout di atas mengimplementasikan beberapa aturan keamanan utama:

### 1. Otoritas Harga Tunggal di Sisi Server
Klien peramban hanya mengirimkan `productId` dan informasi akun tujuan. Nominal tagihan transaksi (`gross_amount`) ditentukan secara sepihak oleh server menggunakan data master di `lib/datas/productData.ts`. Setiap upaya manipulasi harga pada request HTTP yang dikirim oleh penyerang akan gagal secara otomatis karena server tidak pernah membaca nilai harga yang diajukan oleh klien.

### 2. Perlindungan Prototype Pollution
Pengecekan keberadaan game tujuan menggunakan metode `Object.hasOwn(gamesData, customer.gameId)`. Pendekatan ini mencegah eksploitasi prototype pollution pada objek JavaScript saat memproses input `gameId` yang tidak terdaftar.

### 3. Ekstraksi IP Tepercaya dan Rate Limiting
Sebelum payload diproses, alamat IP klien diambil dengan memprioritaskan header infrastruktur tepercaya (`x-real-ip` dan `cf-connecting-ip`) untuk mencegah pemalsuan header `x-forwarded-for`. Request kemudian dibatasi maksimal 10 permintaan per menit per alamat IP guna menangkis serangan spam transaksi.

### 4. Validasi Masukan Berlapis
Validasi dilakukan pada dua sisi:
- Validasi sisi klien di `ClientTopUp.tsx` untuk kenyamanan interaksi pengguna sebelum tombol submit aktif.
- Validasi sisi server di `app/api/payment/route.ts` menggunakan skema Zod `paymentRequestSchema` untuk menjamin keamanan absolut terhadap request yang dikirim langsung tanpa melalui antarmuka web.

### 5. Pencatatan Snapshot Produk
Data produk yang disimpan ke dalam tabel `Invoice` di database adalah snapshot lengkap dari objek produk kanonikal pada saat transaksi dibuat. Hal ini menjaga riwayat data transaksi masa lalu tetap konsisten meskipun di masa depan terdapat perubahan harga produk pada katalog master.
