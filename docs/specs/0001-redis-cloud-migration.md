# 0001 Redis Cloud migration

**Status**: Accepted
**Date**: 2026-09-22
**Ratified by**: user

## Owed decision
Migrasi penyedia rate limiting dari Upstash Redis berbasis REST HTTP ke Redis Cloud berbasis TCP socket dengan library node redis.

## Assumption built on
Gunakan instance Redis Cloud dengan host amplified-mosaic-bit-44475.db.redis.io pada port 17968. Kredensial disimpan secara aman di variabel lingkungan REDIS_URL. Koneksi dikelola memakai pola singleton client global agar ramah terhadap serverless runtime Next.js, dengan fallback proteksi jika koneksi Redis gagal agar API pembayaran tidak terblokir.

## Code area
- `.env`
- `lib/redis.ts`
- `lib/rate-limit.ts`
- `package.json`

## Requirements
- Kredensial Redis Cloud tidak boleh ditulis langsung pada kode sumber
- Rate limiting pada rute API pembayaran tetap berfungsi dengan sliding window
- Jika koneksi Redis Cloud mengalami gangguan, proses pembayaran tidak boleh gagal total (fail open dengan peringatan log)

## Ratify
Keputusan ini telah diratifikasi dan diimplementasikan secara penuh. Rate limiter berjalan pada Redis Cloud dengan fallback proteksi fail-open dan singleton client di `lib/cache/redis.ts`.
