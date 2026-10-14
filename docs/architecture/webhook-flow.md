# Alur Notifikasi Webhook Midtrans dan Idempotensi

Dokumen ini menjelaskan alur penanganan notifikasi webhook asinkron dari gerbang pembayaran Midtrans ke endpoint `POST /api/payment/notification`. Alur ini bertanggung jawab memperbarui status pembayaran invoice secara akurat, memverifikasi keaslian pengirim menggunakan tanda tangan digital dengan perbandingan waktu konstan, serta mencegah pemrosesan transaksi berulang (idempotency).

[Kembali ke Indeks Arsitektur](README.md)

---

## Diagram Urutan Alur Notifikasi Webhook (Sequence Diagram)

Diagram berikut menggambarkan tahapan lengkap dari saat server Midtrans memicu notifikasi HTTP POST hingga database diperbarui dan tanda terima berhasil dikembalikan.

```mermaid
sequenceDiagram
    autonumber
    actor MidtransEngine as Server Notifikasi Midtrans
    participant WebhookAPI as Rute Webhook<br/>(POST /api/payment/notification)
    participant RateLimiter as Rate Limiter<br/>(lib/rate-limit.ts)
    participant CryptoModule as Modul Kriptografi<br/>(crypto SHA512)
    participant MidtransSDK as Klien SDK Midtrans<br/>(midtransClient.Snap)
    participant Database as Database PostgreSQL<br/>(Prisma ORM)

    MidtransEngine ->> WebhookAPI: Kirim payload notifikasi (HTTP POST JSON)

    %% Fase 1: Rate Limiting
    Note over WebhookAPI, RateLimiter: [Fase 1] Pembatasan Laju Permintaan Webhook
    WebhookAPI ->> RateLimiter: Ekstrak IP sumber dan periksa laju request
    alt Request melebihi batas yang diizinkan
        RateLimiter -->> WebhookAPI: Batas terlampaui
        WebhookAPI -->> MidtransEngine: Kembalikan respons HTTP 429
    end

    %% Fase 2: Validasi Payload
    Note over WebhookAPI: [Fase 2] Validasi Kelengkapan Payload
    WebhookAPI ->> WebhookAPI: Cek keberadaan order_id, status_code, gross_amount, signature_key
    alt Ada atribut wajib yang kosong
        WebhookAPI -->> MidtransEngine: Kembalikan respons HTTP 400 Data Tidak Lengkap
    end

    %% Fase 3: Verifikasi Tanda Tangan Digital
    Note over WebhookAPI, CryptoModule: [Fase 3] Verifikasi Tanda Tangan Digital (Timing Safe)
    WebhookAPI ->> WebhookAPI: Susun string gabungan: order_id + status_code + gross_amount + serverKey
    WebhookAPI ->> CryptoModule: Hitung SHA-512 hash dari string gabungan
    CryptoModule -->> WebhookAPI: Nilai expectedSignature
    WebhookAPI ->> WebhookAPI: Bandingkan signature_key dengan expectedSignature<br/>menggunakan perbandingan waktu konstan
    alt Tanda tangan digital tidak cocok
        WebhookAPI ->> WebhookAPI: Catat peringatan keamanan log
        WebhookAPI -->> MidtransEngine: Kembalikan respons HTTP 403 Tanda Tangan Tidak Valid
    end

    %% Fase 4: Pemeriksaan Idempotensi dan Keberadaan Pesanan
    Note over WebhookAPI, Database: [Fase 4] Pemeriksaan Idempotensi dan Keberadaan Pesanan
    WebhookAPI ->> Database: Cari status invoice terkini berdasarkan order_id
    Database -->> WebhookAPI: Data invoice di database
    alt Order ID tidak ditemukan
        WebhookAPI ->> WebhookAPI: Catat peringatan log (console.warn)
        WebhookAPI -->> MidtransEngine: Kembalikan respons HTTP 404 Pesanan Tidak Ditemukan
    else Invoice sudah berstatus terminal (success atau failed)
        WebhookAPI ->> WebhookAPI: Catat peringatan log (console.warn)
        Note over WebhookAPI: Transaksi sudah final, lewati pemanggilan SDK & pembaruan database
        WebhookAPI -->> MidtransEngine: Kembalikan respons HTTP 200 OK
    end

    %% Fase 5: Konfirmasi Status Kanonikal
    Note over WebhookAPI, MidtransSDK: [Fase 5] Konfirmasi Status Kanonikal ke Midtrans
    WebhookAPI ->> MidtransSDK: apiClient.transaction.notification(notification)
    MidtransSDK -->> WebhookAPI: Status resmi (transaction_status, fraud_status, payment_type)

    %% Fase 6: Update Database Atomik
    Note over WebhookAPI, Database: [Fase 6] Pemetaan Status & Pembaruan Atomik (Optimistic Locking)
    WebhookAPI ->> WebhookAPI: Petakan transaction_status ke status invoice internal
    WebhookAPI ->> Database: prisma.invoice.updateMany (WHERE orderId AND status NOT IN ('success', 'failed'))
    alt Berhasil memperbarui record (count = 1)
        Database -->> WebhookAPI: Record berhasil diperbarui
    else Terdeteksi race condition / status sudah terminal (count = 0)
        Database -->> WebhookAPI: 0 baris diperbarui (sudah final)
        WebhookAPI ->> WebhookAPI: Catat peringatan log proses konkuren (console.warn)
    end

    WebhookAPI -->> MidtransEngine: Kembalikan respons HTTP 200 { success: true }
    Note over MidtransEngine: Midtrans menandai notifikasi terkirim sukses<br/>dan menghentikan jadwal pengiriman ulang
```

---

## Logika Pemetaan Status Pembayaran

Nilai `transaction_status` dan `fraud_status` yang dikembalikan oleh Midtrans dipetakan ke dalam status invoice internal dengan aturan sebagai berikut:

| Status Transaksi Midtrans | Status Fraud | Status Invoice Internal | Keterangan Bisnis |
|---|---|---|---|
| `capture` | `accept` | `success` | Transaksi kartu kredit berhasil disetujui tanpa kecurigaan fraud. |
| `capture` | `challenge` | `pending` | Transaksi terindikasi mencurigakan oleh sistem deteksi fraud Midtrans, menunggu peninjauan manual. |
| `settlement` | apa saja | `success` | Dana telah berhasil diselesaikan melalui metode QRIS, Virtual Account, atau E-Wallet. |
| `cancel` | apa saja | `failed` | Transaksi dibatalkan oleh pengguna atau merchant. |
| `deny` | apa saja | `failed` | Transaksi ditolak oleh bank penerbit atau gerbang pembayaran. |
| `expire` | apa saja | `failed` | Batas waktu pembayaran telah habis sebelum pengguna menyelesaikan pembayaran. |
| `pending` | apa saja | `pending` | Pengguna telah menerima nomor Virtual Account atau kode QRIS namun belum mentransfer dana. |

---

## Mekanisme Idempotensi dan Pencegahan Serangan

Alur webhook ini dirancang dengan beberapa pertahanan penting:

### 1. Verifikasi Signature Tahan Serangan Timing (Timing Safe Equal)
Verifikasi keaslian pesan dilakukan dengan membandingkan hash SHA-512 yang dihasilkan server dengan nilai `signature_key` dari Midtrans. Perbandingan string biasa rentan terhadap timing attack, yaitu teknik di mana penyerang mengukur selisih waktu eksekusi untuk menebak karakter string satu per satu. Sistem menggunakan perbandingan waktu konstan seperti `crypto.timingSafeEqual` pada buffer hash untuk memastikan durasi perbandingan identik terlepas dari titik ketidakcocokan karakter.

### 2. Perlindungan Idempotensi dan Pencegahan Race Condition (Two-Tier Guard)
Midtrans menerapkan kebijakan pengiriman ulang (retry policy) otomatis apabila server merchant lambat merespons atau mengembalikan kode galat HTTP selain 200. Skenario retry paralel dapat memicu kondisi pacu (race condition) jika dua notifikasi tiba bersamaan dalam hitungan milidetik saat invoice masih berstatus `pending`. Sistem menerapkan arsitektur dua lapis (two-tier guard):
- **Lapis 1 (Fast-Path Filter)**: Pemeriksaan awal status invoice di database via `findUnique`. Jika status sudah berstatus akhir (`success` atau `failed`), request langsung dihentikan dengan mengembalikan HTTP 200 tanpa memanggil Midtrans SDK atau melakukan penulisan database.
- **Lapis 2 (Atomic Conditional Update / Optimistic Locking)**: Pada saat pembaruan status, sistem menggunakan `prisma.invoice.updateMany` dengan filter bersyarat `status NOT IN ('success', 'failed')`. Di PostgreSQL, pembaruan bersyarat ini dieksekusi secara atomik menggunakan exclusive row-level lock. Jika request paralel lain telah memfinalisasi transaksi lebih dulu, kueri ini menghasilkan `count: 0`. Sistem mendeteksi `count === 0`, mencatat peringatan bahwa invoice telah diperbarui oleh proses konkuren, dan tetap mengembalikan HTTP 200 agar Midtrans menghentikan percobaan ulang. Pola ini juga menjamin webhook yang datang terlambat (*delayed/out-of-order*) tidak dapat menimpa status transaksi yang sudah berhasil diselesaikan kembali ke status `pending`.

### 3. Konfirmasi Status Melalui SDK Resmi
Sistem tidak hanya membaca isi JSON mentah yang dikirim oleh pengirim, tetapi juga memanggil fungsi `apiClient.transaction.notification(notification)` dari pustaka resmi Midtrans. Langkah ini memastikan data transaksi yang diproses adalah data kanonikal yang valid menurut catatan inti Midtrans.

### 4. Respons Status HTTP yang Tepat
Setiap kondisi kegagalan menghasilkan kode status HTTP yang sesuai:
- `400 Bad Request`: Payload JSON tidak memiliki atribut wajib yang diperlukan.
- `403 Forbidden`: Tanda tangan digital tidak cocok dengan server key resmi.
- `429 Too Many Requests`: Frekuensi panggilan melebihi ambang batas keamanan.
- `200 OK`: Notifikasi berhasil diproses, diabaikan karena status sudah final, atau ditangani secara aman saat terjadi race condition konkuren.
