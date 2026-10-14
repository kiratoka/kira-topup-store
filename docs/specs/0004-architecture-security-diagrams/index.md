# 0004. Living Architecture and Security Diagrams

**Date**: 2026-09-23
**Status**: Accepted

## Summary

Keputusan ini menetapkan struktur dokumentasi arsitektur dan diagram keamanan hidup berbasis Mermaid di dalam direktori `docs/architecture/`. Dokumentasi ini disusun secara modular dengan satu berkas indeks utama dan berkas terpisah untuk alur transaksi, webhook, lapisan keamanan, serta panduan pemeliharaan berkala. Integrasi ke dalam aturan konteks proyek memastikan setiap diagram tetap sinkron dengan kode aktif ketika rute pembayaran dan sistem keamanan diperbarui di masa depan.

## Requirements

**User stories**:
- Sebagai pengembang atau agen kecerdasan buatan, saya ingin melihat diagram arsitektur global dan alur transaksi sistem yang jelas agar saya memahami interaksi antar komponen sebelum melakukan perubahan kode.
- Sebagai pengembang, saya ingin memiliki diagram alur keamanan checkout dan webhook Midtrans berbasis Mermaid agar celah keamanan atau regresi logika dapat dicegah sedini mungkin.
- Sebagai tim pengembang, saya ingin memiliki panduan pembaruan berkala yang terdaftar dalam konteks proyek agar dokumentasi selalu diperbarui secara konsisten setiap kali terjadi perubahan kode.

**Acceptance criteria** (kontrak yang dibangun oleh `/develop` dan dicek oleh `/check verify`):
- **AC-1**: Berkas indeks `docs/architecture/README.md` tersedia dan memuat diagram arsitektur tingkat tinggi (Container diagram) berbasis Mermaid yang memetakan keterkaitan peramban klien, Next.js App Router, Prisma ORM, Redis Cloud, dan Midtrans.
- **AC-2**: Berkas `docs/architecture/checkout-flow.md` memuat Sequence Diagram berbasis Mermaid yang merinci alur checkout dari pemilihan produk di katalog, formulir data akun, validasi harga server, pembuatan invoice di database, hingga pemanggilan modal Midtrans Snap.
- **AC-3**: Berkas `docs/architecture/webhook-flow.md` memuat Sequence Diagram berbasis Mermaid yang merinci penerimaan webhook Midtrans, pembatasan laju Redis, verifikasi signature tahan serangan timing, pengecekan idempoten status invoice, pembaruan database, dan respons status HTTP.
- **AC-4**: Berkas `docs/architecture/security-layers.md` memuat Flowchart berbasis Mermaid yang memetakan seluruh lapis pertahanan sistem meliputi ekstraksi IP tepercaya, sliding window rate limit dengan fallback fail open, sanitasi pesan galat, dan validasi variabel lingkungan.
- **AC-5**: Berkas `docs/architecture/maintenance.md` memuat panduan pemeliharaan hidup (living documentation guide), matriks pemicu pembaruan berkas, serta daftar periksa (checklist) yang wajib dijalankan saat kode rute terkait diubah.
- **AC-6**: Berkas aturan `AGENTS.md` diperbarui pada bagian Context files untuk mendaftarkan direktori `docs/architecture/` beserta ringkasan fungsinya agar terbaca oleh skill AI pada sesi pengembangan berikutnya.

## Decision

**Chosen option**: Option 1: Struktur modular dengan berkas README.md sebagai indeks dan dokumen terpisah

Membangun arsitektur dokumen modular di `docs/architecture/` yang terdiri dari `README.md` sebagai indeks navigasi dan arsitektur global, `checkout-flow.md` untuk alur checkout, `webhook-flow.md` untuk alur webhook, `security-layers.md` untuk proteksi keamanan, `maintenance.md` untuk protokol pemeliharaan, serta mendaftarkannya ke dalam daftar Context files di `AGENTS.md`.

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `redis-core` (`redis/agent-skills`, `.agents/skills/redis-core/`)

## Feature design

**Data model sketch**:
Fitur ini menghasilkan kumpulan berkas dokumentasi terstruktur di bawah direktori `docs/architecture/`:
- `docs/architecture/README.md`: Peta navigasi, arsitektur global sistem (C4/Container diagram), dan ringkasan interaksi antar komponen.
- `docs/architecture/checkout-flow.md`: Sequence diagram interaktif alur pembelian dari katalog hingga Midtrans Snap popup.
- `docs/architecture/webhook-flow.md`: Sequence diagram interaktif notifikasi webhook Midtrans dari verifikasi signature hingga pembaruan database.
- `docs/architecture/security-layers.md`: Flowchart detail lapisan keamanan dan proteksi sistem.
- `docs/architecture/maintenance.md`: Panduan pemeliharaan hidup, aturan pembaruan diagram, dan tabel pemicu sinkronisasi.

**State transitions**:
Siklus hidup pemeliharaan dokumen arsitektur:
```
[Perubahan Kode Rute / Keamanan]
  -> Pemeriksaan Matriks Pemicu di docs/architecture/maintenance.md
  -> Penyesuaian Blok Diagram Mermaid pada Berkas Terkait
  -> Validasi Sintaks Diagram Mermaid
  -> Verifikasi Kesesuaian Rujukan Kode dan Dokumen
  -> Dokumen Arsitektur Kembali Sinkron (Living State)
```

**API surface**:
| Berkas Dokumentasi | Tipe Diagram Mermaid | Komponen Kode yang Dirujuk | Pemicu Pembaruan |
|---|---|---|---|
| `docs/architecture/README.md` | `graph TB` / Container Diagram | Seluruh sistem (`app/`, `lib/`, `prisma/`) | Penambahan layanan atau infrastruktur baru |
| `docs/architecture/checkout-flow.md` | `sequenceDiagram` | `components/TitleGame/`, `app/api/payment/route.ts`, `lib/datas/productData.ts`, `lib/validations/payment.ts` | Perubahan alur formulir checkout atau rute payment |
| `docs/architecture/webhook-flow.md` | `sequenceDiagram` | `app/api/payment/notification/route.ts`, `lib/rate-limit.ts`, `lib/prisma.ts` | Perubahan rute webhook atau logika idempotensi |
| `docs/architecture/security-layers.md` | `flowchart TD` | `lib/rate-limit.ts`, `lib/redis.ts`, `lib/validations/`, middleware | Perubahan konfigurasi rate limit atau sanitasi galat |
| `docs/architecture/maintenance.md` | Dokumen panduan teks dan checklist | `AGENTS.md`, seluruh berkas `docs/architecture/` | Perubahan konvensi dokumentasi atau workflow |

**Value sourcing**:
| Tindakan Dokumentasi | Nilai atau Komponen yang Dimuat | Sumber Acuan Kode Nyata |
|---|---|---|
| Pemetaan Arsitektur Global | Arsitektur runtime, database, cache, dan gateway | `AGENTS.md`, `next.config.ts`, `prisma/schema.prisma` |
| Diagram Checkout Flow | Tahapan validasi input, lookup produk, pembuatan Snap token | `components/TitleGame/ClientTopUp.tsx`, `app/api/payment/route.ts` |
| Diagram Webhook Flow | Urutan verifikasi signature, rate limit key, pengecekan status | `app/api/payment/notification/route.ts`, spesifikasi 0003 |
| Flowchart Keamanan | Header trusted IP, toleransi kegagalan Redis, mitigasi serangan | `lib/rate-limit.ts`, `lib/redis.ts`, `app/api/AGENTS.md` |
| Panduan Pemeliharaan | Aturan pembaruan dan tautan context file | Konvensi workflow `AGENTS.md` dan `.agents/skills/` |

**Key invariants**:
- Seluruh diagram Mermaid harus menggunakan sintaks valid yang dapat dirender dengan benar di GitHub dan antarmuka Markdown visual.
- Diagram harus merefleksikan kode yang benar benar ada di repositori saat ini, bukan rancangan spekulatif di masa depan.
- Setiap berkas tematik harus menyertakan tautan kembali ke berkas indeks utama `docs/architecture/README.md` untuk kemudahan navigasi.

**Security model**:
- Berkas dokumentasi berstatus publik di dalam repositori proyek.
- Dilarang keras mencantumkan nilai rahasia nyata seperti kredensial Redis Cloud, Server Key Midtrans asli, atau token sesi pengguna.
- Diagram hanya boleh menggunakan placeholder format variabel lingkungan seperti `process.env.MIDTRANS_SERVER_KEY` atau `REDIS_URL`.

**Critical test scenarios**:
- Verifikasi render visual: Seluruh diagram Mermaid dapat dirender tanpa galat sintaks di peramban dan editor Markdown, memverifikasi **AC-1**, **AC-2**, **AC-3**, **AC-4**.
- Verifikasi ketepatan logika transaksi: Diagram alur checkout mencantumkan validasi server side dan penolakan manipulasi harga klien secara eksplisit, memverifikasi **AC-2**.
- Verifikasi ketepatan logika webhook: Diagram webhook mencerminkan urutan rate limiting sebelum verifikasi signature timing safe dan idempotency check, memverifikasi **AC-3**.
- Verifikasi konsistensi living update: Panduan pemeliharaan memiliki pemicu yang jelas dan berkas terdaftar pada Context files di `AGENTS.md`, memverifikasi **AC-5**, **AC-6**.

## Build plan

1. [x] Membuat direktori `docs/architecture/` dan menyusun berkas indeks `README.md` yang memuat ringkasan arsitektur sistem dan Container Diagram Mermaid tingkat tinggi, memuaskan **AC-1**
2. [x] Menyusun berkas `docs/architecture/checkout-flow.md` yang memuat Sequence Diagram interaktif alur checkout, validasi harga server, dan interaksi Snap modal, memuaskan **AC-2**
3. [x] Menyusun berkas `docs/architecture/webhook-flow.md` yang memuat Sequence Diagram interaktif penanganan webhook Midtrans, rate limit, timing safe signature, dan idempotensi, memuaskan **AC-3**
4. [x] Menyusun berkas `docs/architecture/security-layers.md` yang memuat Flowchart proteksi keamanan, ekstraksi trusted IP, Redis sliding window rate limit, dan fallback fail open, memuaskan **AC-4**
5. [x] Menyusun berkas `docs/architecture/maintenance.md` yang memuat panduan pemeliharaan hidup, tabel pemicu sinkronisasi kode, dan checklist pengembang, memuaskan **AC-5**
6. [x] Mendaftarkan direktori `docs/architecture/` ke dalam daftar Context files di `AGENTS.md` agar terbaca oleh skill AI pada pengembangan rute pembayaran berikutnya, memuaskan **AC-6**

## Consequences

**Positive**:
- Pengembang baru dan agen AI dapat memahami sistem transaksi dan keamanan Kira Topup Store dalam hitungan menit melalui representasi visual.
- Risiko terjadinya regresi keamanan saat refactoring rute pembayaran berkurang secara drastis.
- Terdapat prosedur pemeliharaan resmi yang menjaga dokumen tetap hidup dan relevan sepanjang siklus pengembangan aplikasi.

**Negative / tradeoffs**:
- Membutuhkan disiplin pemeliharaan tambahan saat mengubah rute API atau alur checkout agar diagram tidak menyimpang dari kode nyata.

**Neutral**:
- Menambah lima berkas dokumentasi Markdown baru di dalam folder `docs/architecture/`.

## Follow-up

- [x] Jalankan `/develop architecture-and-security-diagrams` untuk mengeksekusi penulisan berkas diagram dan integrasi context file sesuai spesifikasi ini.
