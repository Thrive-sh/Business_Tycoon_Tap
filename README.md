# Business Tycoon Tap

Simulasi bisnis ketuk layar *mobile-first* — **HTML5 + CSS3 + Vanilla JavaScript (ES Modules)**, **PWA** dengan mode luring, tanpa *framework* dan tanpa *dependency* runtime.

- **Produksi:** https://business-tycoon-tap.vercel.app
- **Lisensi:** [MIT](./LICENSE)

> **💱 Mata uang:** mata uang yang berlaku di game ini saat ini adalah **USD** (simbol `$`). Semua tampilan nominal (saldo, pendapatan, biaya upgrade, harga aset) dirender dengan awalan `$`. Helper `formatRupiahFull`/`formatRupiahCompact` di `core/format.js` masih tersedia tetapi **tidak dipakai untuk tampilan utama** — jangan menampilkan `Rp` pada fitur atau label baru. Beberapa teks lama di tab Usaha masih menampilkan `Rp189 T` (placeholder, akan diseragamkan ke USD kemudian). Keputusan memakai USD ini bersifat sementara sampai ada keputusan resmi.

> **🗣️ Bahasa:** game ini **wajib berbahasa Indonesia penuh** — **tidak boleh ada satu kata Bahasa Inggris pun** yang tampil ke pemain. Berlaku untuk semua teks: UI, tombol, label, badge, judul, toast, notifikasi, pesan error, `aria-label`, `title`, `alt`, placeholder, dokumen (README, manifest). Detail & daftar pelanggaran yang masih ada: lihat Bagian 5A. Identifier teknis (nama variabel/fungsi/kelas CSS) bukan bahasa game dan tidak dihitung.

---

## 1. Perintah

```bash
npm run dev     # Peladen lokal sederhana (http://localhost:8080), root = public/
npm run build   # Merakit public/index.html dari index.template.html + partial tab
npm run lint    # Cek sinkron index.html, JSON, SVG sprite, aksesibilitas, magic number
npm test        # Smoke test (Node test runner, ESM)
```

**Jangan pernah mengedit `public/index.html` secara manual.** File itu adalah *hasil generate* dari `scripts/build.js`. Edit sumbernya (`public/index.template.html` dan/atau `public/assets/tabs/<tab>/<tab>.html`), lalu jalankan `npm run build` dan commit hasilnya bersama sumbernya. `npm run lint` akan gagal bila keduanya drift.

## 2. Struktur Proyek

```text
├── .github/workflows/static.yml   # CI (check + test) & rilis GitHub Pages
├── public/
│   ├── assets/
│   │   ├── core/                  # Fondasi bersama SEMUA tab
│   │   │   ├── main.js            #   Entry point (init, routing tab, loop pasif & harga)
│   │   │   ├── config.js          #   CONFIG terpusat (SATU-SATUNYA tempat konstanta numerik)
│   │   │   ├── assets.js          #   Data 33 aset investasi
│   │   │   ├── state.js           #   State tunggal + mesin simpan (Save Schema v2)
│   │   │   ├── dom.js / format.js #   Util DOM & format angka (Rupiah, compact, %, dll.)
│   │   │   ├── feedback.js / badges.js / milestones.js / preview.js
│   │   │   └── base.css / preview.css / responsive.css
│   │   ├── tabs/                  # SATU FOLDER PER TAB — semua berkas tab tinggal di sini
│   │   │   ├── earnings/          #   Pendapatan: earnings.html + .css + .js
│   │   │   ├── investing/         #   Investasi: investing.html (3 layar) + .css + .js
│   │   │   ├── business/          #   Usaha: business.html + .css + .js
│   │   │   ├── items/             #   Item: items.js (memakai preview-screen bersama)
│   │   │   └── profile/           #   Profil: profile.html + .css + .js
│   │   └── icons/                 # Ikon PWA (PNG)
│   ├── index.template.html        # SUMBER index.html (shell + bottom nav + SVG sprite)
│   ├── index.html                 # HASIL GENERATE (jangan diedit manual)
│   ├── manifest.webmanifest       # Metadata PWA
│   └── sw.js                      # Service Worker cache-first
├── scripts/build.js               # Perakit index.html
├── scripts/lint.js                # Pemeriksa statis
└── tests/smoke.test.js            # Smoke test otomatis
```

## 3. ATURAN UTAMA — Satu Tab = Satu Folder

| Perintah user … | … berarti bekerja HANYA di |
|---|---|
| "Update **Pendapatan** / tab Earnings / ketuk / upgrade / kartu saldo" | `public/assets/tabs/earnings/` |
| "Update **Investasi** / tab Investing / bursa / aset / detail / portofolio" | `public/assets/tabs/investing/` |
| "Update **Usaha** / tab Business / bisnis / kategori usaha" | `public/assets/tabs/business/` |
| "Update **Item** / tab Items / toko" | `public/assets/tabs/items/` |
| "Update **Profil** / tab Profile / statistik / reset data" | `public/assets/tabs/profile/` |

Layer yang dimiliki tiap folder tab: `*.html` (markup layar tab), `*.css`, `*.js`. Entry point, CONFIG, state, dan util bersama **bukan** milik tab mana pun.

## 4. Jika User Memerintahkan "Update Tab …"

Ikuti langkah ini berurutan, tanpa penyimpangan:

1. **Identifikasi tab** dari perintahnya (tabel di Bagian 3). Berhenti dulu bila ambigu dan tanyakan.
2. **Edit hanya file di dalam folder tab** tersebut. Jangan menyentuh file tab lain.
3. **Markup:** edit `tabs/<tab>/<tab>.html` (bukan `index.html`!). Setelah mengubah markup, jalankan `npm run build` dan commit hasil `public/index.html` juga.
4. **Konstanta numerik baru** (biaya, tarif, durasi, dll.) **wajib** masuk `public/assets/core/config.js` — `lint` menolak magic number di modul lain.
5. **Ikon baru:** tambahkan sebagai `<symbol>` di sprite `public/index.template.html`, lalu `npm run build`; ikon UI harus SVG, bukan PNG.
6. **File statis baru** (gambar/ilustrasi — taruh di folder tab atau `public/assets/images/`): daftarkan di `CORE_ASSETS` pada `public/sw.js` dan naikkan `CACHE_NAME` bila harus tersedia saat offline.
7. **Verifikasi:** `npm run lint` dan `npm test` harus lulus. Bila gagal, perbaiki sampai hijau sebelum commit.
8. **Commit & push** ke branch aktif; setelah push, **selalu tampilkan URL preview deployment branch Vercel di chat** ke user.
9. **Balas user dalam Bahasa Indonesia.**

### Kapan boleh keluar dari folder tab?

Hanya dalam tiga kasus ini, dan tetap dicatat di commit:

- **Fondasi bersama** (`public/assets/core/`) — misal ada CONFIG baru atau format angka yang dipakai banyak tab.
- **Markup shell bersama** (`public/index.template.html`: bottom navigation, SVG sprite, preview-screen, roadmap modal, milestone toast) — hanya untuk hal lintas tab; lalu `npm run build`.
- **Service worker** (`public/sw.js`) — bila daftar precache berubah; naikkan `CACHE_NAME`.

### Yang TIDAK boleh dilakukan

- ❌ Mengedit `public/index.html` manual.
- ❌ Menambah *framework* / *library* / dependensi runtime.
- ❌ Mengubah struktur Save Schema (`localStorage` key `business_simulator_save_v1`, versi 2) atau menghapus migrasi v1 → v2 — pemain nyata menyimpan progres di situ.
- ❌ Mengubah pengaturan Vercel, *environment variables*, atau *workflow* GitHub tanpa **persetujuan eksplisit** user.
- ❌ Pindah branch / push ke branch lain; kerja selalu di branch aktif.
- ❌ Memulai fitur besar tanpa persetujuan (modul Usaha dan katalog Item masih dalam tahap perencanaan).
- ❌ Menambahkan satu kata pun Bahasa Inggris ke UI, teks aksesibilitas, atau dokumen — lihat **Bagian 5A**.

## 5. Aturan Kode

- **Konstanta:** semua konstanta numerik tinggal di `CONFIG` (`core/config.js`); aset investasi di `core/assets.js`.
- **Simpan:** tulis lewat mesin simpan di `core/state.js` (dual throttle 500 ms / 5 dtk, *flush* saat tab disembunyikan). Jangan menulis `localStorage` langsung.
- **Format angka:** gunakan helper di `core/format.js` (mis. `formatCurrencyValue`, `formatCompact`, `formatSignedPercent`) — jangan format manual di modul tab. Mata uang tampilan: **USD** (lihat catatan di bagian atas).
- **Aksesibilitas:** hormati `prefers-reduced-motion`, sediakan `:focus-visible`, beri `aria-label` pada kontrol tanpa teks, `aria-hidden` untuk ikon dekoratif.
- **Bahasa UI:** Bahasa Indonesia penuh — lihat aturan nol toleransi di **Bagian 5A**.
- **Gambar PNG/JPG:** hanya untuk foto/ilustrasi; kompres dulu, beri `width`/`height` + `loading="lazy"`, `alt` yang bermakna. Ikon antarmuka tetap SVG.

## 5A. ATURAN UTAMA — Bahasa Indonesia Penuh (Nol Toleransi Bahasa Inggris)

**Game ini wajib berbahasa Indonesia penuh. Tidak boleh ada Bahasa Inggris sedikit pun di teks yang menyentuh pemain atau dokumen publik.**

**Berlaku untuk (wajib Indonesia):**

- Semua teks UI yang tampil ke pemain: judul, label, tombol, badge, chip, status, menu, toast, notifikasi, pesan error/empty-state, teks bantuan.
- Teks aksesibilitas: `aria-label`, `aria-description`, `alt`, `title`, teks yang diumumkan pembaca layar.
- Teks dinamis di JS (mis. `showToast`, `textContent`) — harus Indonesia; jangan ketik string tampilan berbahasa Inggris di modul mana pun.
- Dokumen publik: README, `manifest.webmanifest` (`name`/`short_name`/`description`), `<title>`, meta description/OG.
- Konversi angka tetap gaya Indonesia (`1.000,00`), simbol `$` untuk mata uang USD.

**Pengecualian yang diizinkan:**

- Merek/produk: `Business Tycoon Tap` (nama game) dan nama perusahaan/emiten di data aset (mis. `Apple`, `Amazon`).
- Kode mata uang internasional: `USD`; simbol `$`.
- Serapan baku KBBI yang sudah lazim dipakai (mis. `terminal`, `portofolio`, `pasif`, `kripto`, `ekuitas`). Ragu? Pakai kata Indonesia murni (`Dasbor`, `Alokasi`, `Langsung`, dsb).
- Identifier teknis: nama variabel, fungsi, tipe, kelas CSS, id HTML, komentar teknis **bukan bahasa game** dan tidak dihitung — namun komentar teknis direkomendasikan tetap Bahasa Indonesia seperti sisa repo.

**Penegakan (sebelum commit):**

1. Baca ulang diff; cari kata Inggris di teks tampilan.
2. `npm run lint` tetap wajib hijau (tidak mengecek bahasa — ini tanggung jawab reviewer/manusia).
3. PR/commit yang menambahkan teks Inggris di UI **harus ditolak**.

**Pelanggaran yang MASIH ADA (harus diseragamkan — jangan ditambah lagi):**

*Dasbor Investasi (commit `e3f622f`):*

- `investing.html`: `TERMINAL PORTOFOLIO` → usul `DASBOR PORTOFOLIO`; `LIVE · USD` → `LANGSUNG · USD`; `TOTAL PORTFOLIO VALUE` → `TOTAL NILAI PORTOFOLIO`; `LIVE · 3s` → `LANGSUNG · 3 dtk`; judul panel `Asset Allocation` → `Alokasi Aset`; `TOTAL PORTOFOLIO` (tetap — `portofolio` serapan); `TOP ALLOCATION` → `ALOKASI TERBESAR`; `TOTAL VALUE` (donut) → `TOTAL NILAI`; `DISTRIBUTION BY ASSET CLASS` → `DISTRIBUSI PER KELAS ASET`; `Allocation Breakdown` → `Rincian Alokasi`; `WEIGHT / SHARE` → `BOBOT / PORSI`.
- `investing.html` (rak, `aria-label` sudah Indonesia — OK) — periksa ulang `GESER` (Indonesia, OK).
- `investing.js` (`CATEGORY_META` subjudul): `Equities` → `Ekuitas`; `Real Estate` → `Real Estat`; `Digital Assets` → `Aset Digital`; `Currency` → `Mata Uang`.
- Layar detail aset: `Live · update 3 dtk` → mis. `Langsung · tiap 3 dtk`.

*Konfigurasi:*

- `core/config.js` — `INVEST_SUMMARY_LABELS.Kripto`: `Total nilai kriptocurrency` → `Total nilai kripto`.

*Catatan:* identifier (`heroPortfolioBtn`, `.alloc-row`, dst.) sengaja tidak diubah — bukan bahasa game. Brand `Business Tycoon Tap`, kode `USD`, dan format angka bukan pelanggaran.

## 6. Pengujian & Kualitas

- `npm run lint` — memverifikasi: `index.html` sinkron dengan sumber generate, JSON valid, SVG `<use>` cocok dengan `<symbol>`, ikon PWA ada, `prefers-reduced-motion` & `:focus-visible` ada, tidak ada magic number di modul non-`core`.
- `npm test` — smoke test: skema simpan v1→v2, format angka, kalkulasi biaya upgrade, batas offline 2 jam, buy/sell, jumlah 33 aset investasi.
- CI: `.github/workflows/static.yml` — menjalankan syntax check, `npm run lint`, dan `npm test` pada push/PR ke `main`.
