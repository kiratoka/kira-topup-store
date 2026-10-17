# Verify: security-middleware-logging · spec 0010 · updated 2026-10-17
_Steps derived from spec 0010 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Kirim request API via browser atau curl ke rute `/api/:path*` → pastikan response header memiliki `x-request-id` unik 21 karakter → AC-1
- [x] Kirim request POST ke `/api/payment` tanpa header `Content-Type: application/json` → response status 415 dengan pesan 'Content-Type harus application/json' dan header `x-request-id` → AC-2
- [x] Kirim request POST ke webhook `/api/payment/notification` tanpa `Content-Type: application/json` → lolos dari penolakan middleware (tidak 415) → AC-2
- [x] Kirim request POST dengan header Origin yang tidak terdaftar saat `ALLOWED_ORIGINS` disetel → response status 403 dengan pesan 'Origin tidak diizinkan' → AC-3
- [x] Panggil fungsi logger dengan menyertakan payload berisi data sensitif seperti email atau token → periksa output stdout bahwa field sensitif disunting menjadi '[REDACTED]' → AC-5

## Commands
- [x] `npx vitest run proxy.test.ts` → seluruh 11 pengujian proxy/middleware (injeksi ID, penolakan content type, guard origin, bypass webhook) lulus 100% → AC-1, AC-2, AC-3
- [x] `npx vitest run lib/logging/logger.test.ts` → seluruh 5 pengujian root logger, child loggers, redaction, dan fail-open lulus 100% → AC-4, AC-5, AC-6, AC-9
- [x] `npm test` → seluruh 195 unit dan integration test di seluruh repositori lulus tanpa kegagalan → AC-1 sampai AC-9
- [x] `npm run lint` → aturan ESLint no-console menghasilkan 0 error pada app/api/ dan lib/, serta hanya menghasilkan warning pada components/ → AC-7, AC-10
- [x] `npm run build` → proses build kompilasi Next.js dan pembuatan Prisma Client berhasil tanpa error → AC-1 sampai AC-10

## Acceptance-criteria coverage
- AC-1: covered by step "x-request-id di header request & response", `proxy.test.ts`
- AC-2: covered by step "penolakan Content-Type non-json 415", `proxy.test.ts`
- AC-3: covered by step "pemeriksaan Origin & Referer dengan ALLOWED_ORIGINS", `proxy.test.ts`
- AC-4: covered by step "Pino root logger level warn di prod & debug di dev", `logger.test.ts`
- AC-5: covered by step "Pino redaction paths menyunting email, serverKey, token, ip", `logger.test.ts`
- AC-6: covered by step "4 child logger diekspor dengan domain payment, webhook, redis, invoice", `logger.test.ts`
- AC-7: covered by step "penggantian console.* di 6 berkas server side", `npm run lint`
- AC-8: covered by step "pino-pretty di development dan JSON di production", `logger.ts`
- AC-9: covered by step "logger fail-open", `logger.test.ts`
- AC-10: covered by step "toleransi console.* di components/", `npm run lint`
