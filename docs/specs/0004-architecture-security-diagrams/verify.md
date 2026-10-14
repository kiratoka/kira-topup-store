# Verify: architecture-and-security-diagrams · spec 0004 · updated 2026-09-23

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI and manual

- [x] Buka `docs/architecture/README.md` pada Markdown preview → Container diagram Mermaid terender visual dengan sempurna tanpa galat sintaks (AC-1)
- [x] Buka `docs/architecture/checkout-flow.md` pada Markdown preview → Sequence diagram checkout terender visual dengan tahapan validasi server dan Snap modal (AC-2)
- [x] Buka `docs/architecture/webhook-flow.md` pada Markdown preview → Sequence diagram webhook terender visual mencakup timing safe signature dan idempotensi (AC-3)
- [x] Buka `docs/architecture/security-layers.md` pada Markdown preview → Flowchart lapis keamanan terender visual menampilkan enam lapisan pertahanan (AC-4)
- [x] Buka `docs/architecture/maintenance.md` → panduan pemeliharaan hidup, matriks pemicu pembaruan, dan daftar periksa pengembang tersedia lengkap (AC-5)
- [x] Periksa berkas `AGENTS.md` pada bagian Context files → entri `docs/architecture/README.md` terdaftar dengan deskripsi ringkasan (AC-6)

## Commands

- [x] Periksa keberadaan seluruh 5 berkas di direktori `docs/architecture/` (`README.md`, `checkout-flow.md`, `webhook-flow.md`, `security-layers.md`, `maintenance.md`) → seluruh berkas ada dan memiliki konten valid (AC-1, AC-2, AC-3, AC-4, AC-5)
- [x] Validasi konsistensi rujukan file dan tautan navigasi antar dokumen di `docs/architecture/` → seluruh tautan navigasi berfungsi lancar (AC-1, AC-5)

## Acceptance criteria coverage

- AC-1: covered by README.md Container diagram and file existence checks
- AC-2: covered by checkout-flow.md Sequence diagram and server price validation assertions
- AC-3: covered by webhook-flow.md Sequence diagram and idempotency logic assertions
- AC-4: covered by security-layers.md Flowchart and defense in depth assertions
- AC-5: covered by maintenance.md living documentation guide and sync trigger matrix
- AC-6: covered by AGENTS.md Context files registration
