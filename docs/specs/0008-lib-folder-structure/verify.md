# Verify: Standardize `lib/` Folder Structure · spec 0008 · updated 2026-10-17
_Steps derived from spec 0008 acceptance criteria and verification protocol. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Buka halaman utama `/` → katalog game tampil normal tanpa error import data
- [x] Buka halaman topup `/topup/genshin-impact` → daftar produk dan form akun ter-render dengan benar
- [x] Buka halaman blog `/blog` dan `/blog/tips-topup` → daftar dan artikel MDX tampil tanpa kendala

## Commands
- [x] `npm test` → 12 test suite (176 tests) lulus 100% tanpa kegagalan import
- [x] `npm run build` → Next.js turbopack build dan TypeScript compile berhasil tanpa error type
- [x] `npm run lint` → ESLint lulus 0 error dan menegakkan larangan import dari path flat lib lama
- [x] `git status` → memastikan tidak ada file flat lib lama yang tersisa di root `lib/` selain `env.ts` dan `env.test.ts`

## Acceptance-criteria coverage
- Restrukturisasi 6 subfolder domain plus `types/` tercakup pada verifikasi struktur folder dan `npm test`
- Pembagian domain types (`game`, `payment`, `blog`, `ui`) tercakup pada TypeScript compilation di `npm run build`
- Eliminasi flat imports dan penegakan `no-restricted-imports` tercakup pada `npm run lint`
