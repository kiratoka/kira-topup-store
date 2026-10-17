# 0006 · invoice-security-masking

**Status**: Accepted
**Date**: 2026-10-17
**Ratified by**: user, via code review (2026-10-17-master-t1-t3.md)

## Owed decision
Penetapan ambang batas rate limiting Redis pada endpoint GET invoice, format penyamaran data pribadi pelanggan (PII masking), serta daur hidup token pembayaran Snap Midtrans pada respons invoice publik.

## Assumption built on
1. Menerapkan rate limiting Redis sebesar 30 permintaan per menit per alamat IP dengan awalan kunci `rate-limit:invoice` menggunakan helper `getClientIp(request)`.
2. Menyamarkan alamat email pelanggan pada respons publik menjadi format `u***@domain.com` (karakter awal dipertahankan) untuk melindungi data pribadi dan memitigasi dampak IDOR.
3. Menghapus atau mengosongkan nilai token pembayaran Snap Midtrans (`null`) apabila status invoice sudah tidak berstatus `pending` (yakni saat berstatus `success`, `failed`, atau `expired`).
4. Menjaga alur transaksi anonim (guest checkout) tanpa mewajibkan autentikasi akun atau pengiriman token email sekunder yang dapat merusak alur pembayaran instan.

## Code area
- `lib/masking.ts`
- `lib/masking.test.ts`
- `lib/types.ts`
- `app/api/invoice/route.ts`
- `app/api/invoice/route.test.ts`
- `app/api/invoice/[orderId]/route.ts`
- `app/api/invoice/[orderId]/route.test.ts`

## Requirements
- AC-1: Endpoint GET `/api/invoice` dan GET `/api/invoice/[orderId]` membatasi laju pemanggilan dengan Redis (30 req/menit) dan mengembalikan HTTP 429 saat batas terlampaui.
- AC-2: Data pribadi email pelanggan disamarkan menjadi format masked (contoh: `u***@domain.com`) pada seluruh respons invoice publik.
- AC-3: Token Snap Midtrans dihilangkan (`null`) saat transaksi telah selesai atau kedaluwarsa.

## Ratify
Keputusan ini telah diratifikasi dan diverifikasi penuh melalui code review `docs/reviews/2026-10-17-master-t1-t3.md` (Approve with nits) serta pengujian unit test otomatis pada `app/api/invoice/` dan `lib/security/masking.test.ts`. Feature ditandai `done`.
