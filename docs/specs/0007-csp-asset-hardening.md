# 0007 · csp-asset-hardening

**Status**: Accepted
**Date**: 2026-10-17
**Ratified by**: user, via code review (2026-10-17-master-t1-t3.md)

## Owed decision
Pembatasan domain asal aset gambar pada konfigurasi Next.js (`images.remotePatterns`) dan kebijakan keamanan konten browser (Content Security Policy `img-src`).

## Assumption built on
1. Membatasi `images.remotePatterns` di `next.config.ts` hanya untuk hostname sumber gambar yang aktif digunakan di aplikasi:
   - `cdn1.codashop.com` (aset ikon game dan denominasi produk)
   - `asetto.nawalakarsa.id` (aset sampul artikel blog)
   - `hybrid.co.id` (aset sampul artikel blog)
   serta meniadakan wildcard `'**'` untuk memitigasi SSRF dan DoS pada endpoint optimasi gambar Next.js.
2. Membatasi `img-src` pada header Content-Security-Policy di `next.config.ts` dengan mengganti wildcard `https:` menjadi daftar origin tepercaya:
   `'self'`, `data:`, `https://cdn1.codashop.com`, `https://asetto.nawalakarsa.id`, `https://hybrid.co.id`, `https://app.sandbox.midtrans.com`, dan `https://app.midtrans.com`.
3. Mempertahankan origin Midtrans (`https://app.sandbox.midtrans.com` dan `https://app.midtrans.com`) pada direktif `img-src` CSP untuk mendukung pemuatan aset popup pembayaran Snap Midtrans.

## Code area
- `next.config.ts`
- `next.config.test.ts`
- `docs/scope/scope_security_issue.md`

## Requirements
- AC-1: `next.config.ts` mengonfigurasi `images.remotePatterns` dengan daftar domain spesifik (`cdn1.codashop.com`, `asetto.nawalakarsa.id`, `hybrid.co.id`) tanpa wildcard `**` atau `*`.
- AC-2: Header Content-Security-Policy pada `next.config.ts` membatasi `img-src` ke origin tepercaya (`'self'`, `data:`, `cdn1.codashop.com`, `asetto.nawalakarsa.id`, `hybrid.co.id`, `app.sandbox.midtrans.com`, `app.midtrans.com`) tanpa wildcard `https:`.

## Ratify
Keputusan ini telah diratifikasi dan diverifikasi penuh melalui code review `docs/reviews/2026-10-17-master-t1-t3.md` (Approve with nits) serta pengujian otomatis pada `next.config.test.ts`. Feature ditandai `done`.
