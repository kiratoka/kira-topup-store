# 0008. Standardize `lib/` Folder Structure · Rationale

## Context

`lib/` adalah folder shared utilities yang diakses oleh seluruh lapisan aplikasi: API routes, Server Components, Client Components, dan test. Saat ini semua file duduk di satu level tanpa organisasi, sehingga seorang developer baru sulit menebak di mana harus mencari atau menambahkan kode baru.

Masalah konkret yang muncul seiring pertumbuhan codebase:

1. **Pencampuran domain**: `prisma.ts` (database client), `rate-limit.ts` (security/Redis), `masking.ts` (PII protection), `mdx.ts` (blog content helper), dan `utils.ts` (CSS/formatting helpers) semuanya satu level tanpa sinyal tentang ketergantungan atau scope masing-masing.
2. **`types.ts` monolitik**: satu file berisi tipe dari domain game, payment, blog, dan UI component props. Setiap perubahan tipe memaksa developer membuka satu file besar, dan coupling antar domain tidak terlihat.
3. **Tidak ada konvensi yang ditegakkan**: subfolder `validations/` dan `datas/` sudah ada tapi dibuat secara ad hoc tanpa panduan. Pola ini akan terus berkembang tidak konsisten.
4. **Timing yang tepat**: codebase masih relatif kecil, tidak ada circular dependency yang perlu dipecah, migrasi import path bisa dilakukan dalam satu PR tanpa risiko tinggi.

Tidak memutuskan standar ini sekarang berarti setiap fitur baru akan menambah file ke flat root, dan biaya migrasi bertumbuh secara linear terhadap jumlah file.

## Options considered

### Option 1: 6 subfolder domain plus `types/` terpisah (pilihan yang diambil)

Bagi `lib/` menjadi `db/`, `cache/`, `payment/`, `security/`, `content/`, `utils/`, dan `types/`. `env.ts` tetap di root `lib/`. Tidak ada barrel export.

**Pros**:
- Setiap subfolder punya scope yang tidak overlap dan mudah dijelaskan dalam satu kalimat
- `types/` terpisah mencerminkan bahwa tipe adalah kontrak lintas domain
- Tidak ada barrel export menghindari masalah tree-shaking dan circular import di Next.js App Router

**Cons**:
- Import path menjadi lebih panjang (`@/lib/security/masking` vs `@/lib/masking`)
- Satu PR migrasi yang menyentuh sekitar 25 file import

### Option 2: 5 subfolder dengan `infra/` gabungan

Gabungkan `db/`, `cache/`, dan `env.ts` menjadi satu subfolder `infra/`.

**Pros**:
- Lebih sedikit subfolder untuk proyek skala kini

**Cons**:
- Nama `infra/` terlalu generik; ketika ada client baru (misalnya storage), tidak jelas apakah masuk ke `infra/` atau subfolder baru
- `payment/` secara logis juga infrastruktur, tapi dipisah, menciptakan inkonsistensi

### Option 3: Naming convention tanpa memindahkan file

Definisikan konvensi penamaan (prefix, suffix) tanpa mengubah lokasi file.

**Pros**:
- Tidak ada PR migrasi

**Cons**:
- Tidak menyelesaikan masalah discoverability; developer masih harus membaca semua file untuk tahu apa yang ada
- Tidak bisa ditegakkan lewat TypeScript atau linter

## Rationale

Option 1 dipilih karena setiap subfolder punya definisi scope yang bisa dijelaskan dalam satu kalimat tanpa overlap. Ketika scope jelas, developer bisa menebak lokasi file baru tanpa membaca panduan.

`types/` sebagai subfolder terpisah (bukan `payment/types.ts`, `content/types.ts`) mencerminkan kenyataan di codebase ini: banyak tipe dipakai lintas domain. `InvoiceData` dipakai oleh `components/Invoice/` dan `app/api/invoice/`. `TopUpProduct` dipakai oleh `components/TitleGame/`, `lib/content/datas/`, dan `app/api/payment/`. Menaruh tipe ini ke subfolder domain mana pun akan menciptakan coupling yang tidak perlu.

Option 2 ditolak karena nama `infra/` terlalu generik dan tidak memberi sinyal yang cukup. Option 3 ditolak karena tidak menyelesaikan masalah discoverability.

Tidak ada barrel export mengorbankan kenyamanan pengetikan import (lebih panjang) untuk keuntungan yang lebih nyata: bundle size per route tetap optimal dan circular dependency antar subfolder langsung terdeteksi oleh TypeScript.
