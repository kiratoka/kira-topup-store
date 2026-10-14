# 🧠 Rekomendasi Model Antigravity per Skill

Dokumen ini berisi panduan memilih model AI terbaik di Antigravity untuk setiap workflow/skill pengembangan (JS Mastery).

---

## Model yang Tersedia

| Model | Karakteristik |
|:---|:---|
| **Gemini 3.8 Flash** | Cepat, hemat token, default platform. Cocok untuk tugas rutin/sederhana |
| **Gemini 3.7 Flash** | Generasi sebelumnya, stabil dan teruji |
| **Gemini 3.6 Flash** | Legacy, masih solid untuk tugas ringan |
| **Gemini 3.1 Pro** | Model Pro Google — lebih dalam reasoning-nya, cocok untuk tugas kompleks |
| **Claude Sonnet 4.6 (Thinking)** | Reasoning kuat, efisien. Sweet spot antara kecepatan & kualitas |
| **Claude Opus 4.6 (Thinking)** | Model terkuat untuk reasoning mendalam & kode kompleks. Paling mahal |
| **GPT-OSS 120B** | Open source, cocok untuk eksperimen |

---

## Rekomendasi per Skill

### 1. `/scope` — Perencanaan Produk

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Opus 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.1 Pro |

**Alasan:** `/scope` menentukan *apa* yang dibangun — ini adalah fondasi seluruh proyek. Model dengan reasoning terdalam diperlukan untuk:
- Menganalisis kebutuhan bisnis dan menerjemahkan ke fitur teknis
- Mempertimbangkan trade-off antara fitur
- Menghasilkan scope yang realistis dan terstruktur

Kesalahan di tahap ini menyebar ke semua tahap berikutnya. Investasi di model terbaik di sini sangat worth it.

---

### 2. `/architect` — Desain Teknis

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Opus 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.1 Pro |

**Alasan:** `/architect` membuat keputusan teknis load-bearing — schema database, API design, component hierarchy. Model harus mampu:
- Reasoning mendalam tentang trade-off arsitektur
- Mempertimbangkan skalabilitas, maintainability, dan security
- Menghasilkan spec yang detail dan actionable

Ini adalah tahap di mana kesalahan desain paling mahal untuk diperbaiki. Opus unggul karena kemampuan "thinking" yang bisa menimbang banyak alternatif secara sistematis.

---

### 3. `/develop` — Implementasi Kode

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Sonnet 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.8 Flash |

**Alasan:** `/develop` membangun fitur berdasarkan spec yang sudah ada. Sonnet adalah sweet spot karena:
- Spec sudah jelas dari `/architect`, jadi reasoning ultra-deep tidak selalu diperlukan
- Sonnet tetap punya thinking mode untuk bagian tricky
- Lebih cepat dan hemat token dibanding Opus — penting karena `/develop` biasanya banyak iterasi
- Kualitas kode tetap tinggi, pattern recognition kuat

> [!TIP]
> Gunakan **Opus** untuk `/develop` jika fitur yang dibangun sangat kompleks (misal: payment integration, state machine yang rumit). Gunakan **Gemini 3.8 Flash** untuk perubahan kecil atau straightforward.

---

### 4. `/check verify` — Verifikasi Perilaku

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Sonnet 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.1 Pro |

**Alasan:** `/check verify` menjalankan aplikasi dan membuktikan bahwa acceptance criteria terpenuhi. Butuh model yang:
- Teliti mengecek setiap kriteria satu per satu
- Mampu berinteraksi dengan browser dan mengevaluasi hasil
- Cukup pintar mendeteksi edge case yang terlewat

Sonnet cukup kuat untuk ini dan lebih efisien dibanding Opus.

---

### 5. `/check review` — Code Review

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Opus 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.1 Pro |

**Alasan:** `/check review` harus dilakukan oleh "model segar" yang belum pernah melihat kode tersebut. Kualitas review sangat kritis karena ini gatekeeper terakhir sebelum merge. Opus dipilih karena:
- Mampu mendeteksi bug halus, race condition, security issue
- Reasoning mendalam untuk memahami implikasi arsitektural dari perubahan
- Bisa memberikan feedback yang actionable dan bernuansa
- Review yang buruk bisa meloloskan bug ke production

---

### 6. `/debug` — Mencari & Memperbaiki Bug

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Opus 4.6 (Thinking)** |
| 🥈 Alternatif | Claude Sonnet 4.6 (Thinking) |

**Alasan:** Debugging adalah salah satu tugas yang paling menuntut reasoning. `/debug` menjalankan loop: reproduce → localize → hypothesize → test → fix → verify. Opus unggul karena:
- Root cause analysis membutuhkan reasoning chain yang panjang
- Bug sering melibatkan interaksi antar komponen yang tidak obvious
- Thinking mode Opus bisa menimbang banyak hipotesis secara paralel
- Minimal fix requirement butuh pemahaman deep tentang kode

> [!NOTE]
> Untuk bug sederhana (typo, import salah, config error), **Sonnet** atau bahkan **Gemini 3.8 Flash** sudah cukup. Simpan Opus untuk bug yang benar-benar pelik.

---

### 7. `/test` — Menulis Test Suite

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Sonnet 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.8 Flash |

**Alasan:** `/test` menulis test berdasarkan kode yang sudah ada. Sonnet ideal karena:
- Pattern test (happy path, edge case, error state) relatif terstruktur
- Sonnet cukup pintar mengenali edge case yang perlu ditest
- Lebih cepat dari Opus — penting karena test sering di-iterate
- Kualitas test Sonnet sudah sangat baik untuk kebanyakan kasus

---

### 8. `/document` — Dokumentasi

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Gemini 3.8 Flash** |
| 🥈 Alternatif | Claude Sonnet 4.6 (Thinking) |

**Alasan:** `/document` menulis PR description, changelog, release notes, atau postmortem dari diff/commit. Ini tugas yang:
- Relatif straightforward — baca diff, tulis prose
- Tidak butuh reasoning mendalam
- Gemini Flash sangat cepat dan hasilnya sudah bagus untuk prosa teknis
- Hemat token untuk tugas yang sering dilakukan

---

### 9. `/audit` — Bootstrap AGENTS.md

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Claude Sonnet 4.6 (Thinking)** |
| 🥈 Alternatif | Gemini 3.1 Pro |

**Alasan:** `/audit` membaca seluruh codebase dan menghasilkan AGENTS.md. Butuh model yang:
- Mampu memproses banyak file dan memahami struktur proyek
- Bisa mengidentifikasi pattern, konvensi, dan dependencies
- Cukup teliti tapi tidak perlu se-deep Opus
- Sonnet menawarkan keseimbangan terbaik antara comprehension dan efisiensi

---

### 10. `/sync` — Sinkronisasi Dokumentasi

| Rekomendasi | Model |
|:---|:---|
| **🥇 Utama** | **Gemini 3.8 Flash** |
| 🥈 Alternatif | Claude Sonnet 4.6 (Thinking) |

**Alasan:** `/sync` melakukan surgical edit ke AGENTS.md — menambah baris, update satu baris. Ini tugas ringan yang:
- Sudah punya aturan jelas tentang apa yang harus diupdate
- Tidak butuh kreativitas atau reasoning mendalam
- Flash sangat cepat dan akurat untuk edit pattern-based

---

## Ringkasan Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    REASONING DEPTH NEEDED                    │
│                                                              │
│  HIGH (Opus)        MEDIUM (Sonnet)       LOW (Flash)        │
│  ┌──────────┐       ┌──────────────┐      ┌──────────┐      │
│  │ /scope   │       │ /develop     │      │ /document│      │
│  │ /architect│       │ /check verify│      │ /sync    │      │
│  │ /check   │       │ /test        │      │          │      │
│  │  review  │       │ /audit       │      │          │      │
│  │ /debug   │       │              │      │          │      │
│  └──────────┘       └──────────────┘      └──────────┘      │
│                                                              │
│  💰 Paling mahal     ⚖️ Balanced          ⚡ Paling cepat    │
└─────────────────────────────────────────────────────────────┘
```

## Tabel Quick Reference

| Skill | Model Utama | Alasan 1 Kalimat |
|:---|:---|:---|
| `/scope` | Opus 4.6 | Fondasi proyek, kesalahan di sini menyebar ke mana-mana |
| `/architect` | Opus 4.6 | Keputusan teknis yang paling mahal untuk diperbaiki |
| `/develop` | Sonnet 4.6 | Spec sudah jelas, butuh kecepatan iterasi |
| `/check verify` | Sonnet 4.6 | Teliti tapi tidak perlu reasoning ultra-deep |
| `/check review` | Opus 4.6 | Gatekeeper terakhir, harus mendeteksi bug halus |
| `/debug` | Opus 4.6 | Root cause analysis butuh reasoning chain panjang |
| `/test` | Sonnet 4.6 | Pattern terstruktur, butuh kecepatan iterasi |
| `/document` | Gemini 3.8 Flash | Prosa teknis straightforward, hemat token |
| `/audit` | Sonnet 4.6 | Comprehension luas tanpa perlu depth ekstrem |
| `/sync` | Gemini 3.8 Flash | Surgical edit sederhana, cepat dan akurat |

> [!IMPORTANT]
> Rekomendasi ini berdasarkan **kasus umum**. Selalu pertimbangkan kompleksitas spesifik tugas. Fitur payment integration di `/develop`? Pakai Opus. Bug typo sederhana di `/debug`? Flash cukup.
