# Business Tycoon Tap

Simulasi bisnis ketuk layar (*mobile-first*) berbasis web murni (**HTML5, CSS3, Vanilla JavaScript**) dengan dukungan pemasangan **PWA** dan mode luring (*offline*).

## Tautan Produksi

- **Vercel Production:** https://business-tycoon-tap.vercel.app
- **GitHub Pages:** https://thrive-sh.github.io/Business_Tycoon_Tap/

## Fitur Utama

- **Executive Black-Gold Precious Card:** Kartu saldo utama 100% Inline SVG & CSS murni (permukaan dua-rona diagonal *Matte Obsidian & Satin Gunmetal*, filigri 8-untai emas-amber, Chip EMV perak metalik, ikon Contactless NFC, tipografi perak emboss, emblem 3-pilar `TCB`, serta kilau spekular `.is-glinting` saat ketukan).
- **Bursa Investasi Live (Saham, Properti, Kripto, Forex):** 33 aset dengan simulasi pergerakan harga `random walk` setiap 3 detik, grafik garis Canvas 2D mulus (60 titik, DPR-scaled), transaksi atomik `[1][10][100][Maks]`, kalkulasi rata-rata beli (`avgEntry`) & P&L *real-time*, serta dividen saham dan pendapatan sewa properti pasif. Kategori Saham memakai emiten nyata (Amazon, Nvidia, Tesla, Google, Microsoft, Apple, Meta, Netflix) dengan logo vektor masing-masing.
- **Siklus Ekonomi Ketukan & 3 Tingkat Peningkatan:** Sarung Tangan (`+$1,00/ketuk`), Mesin Ketuk (`+$5,00/ketuk`), dan Tim Otomatis (`+$25,00/ketuk` & `+$10,00/dtk`) dengan eskalasi biaya `baseCost * 1.15^level`.
- **Pendapatan Pasif & Penghasilan Luring:** Dihitung otomatis dari `lastSeen` (efisiensi `50%`, batas maksimal `2 jam`) dan hanya merender DOM saat tab aktif terlihat.
- **Save Schema v2 & Dual Throttle (500ms / 5 dtk):** Menyimpan `holdings` dan `lastPrices` tanpa membebani ruang `localStorage`, migrasi otomatis dari format simpanan v1, statistik profil, konfirmasi reset dua langkah, serta *flush* seketika saat tab disembunyikan/ditutup.
- **Umpan Balik, Aksesibilitas & PWA:** Bunyi blip koin sintetis (*Web Audio API*), getar sentuh (`navigator.vibrate`), navigasi *keyboard* penuh, dukungan `prefers-reduced-motion`, ikon vektor SVG `<symbol>`, serta `Service Worker` *cache-first*.

## Struktur Proyek

```text
.
├── .github/
│   └── workflows/
│       └── static.yml          # Alur CI (check + test) & rilis GitHub Pages
├── public/                     # Direktori aplikasi web publik (siap tayang)
│   ├── assets/
│   │   ├── core/               # Fondasi bersama (dipakai semua tab):
│   │   │   ├── main.js         # Entry point ES Module (init, routing tab, loop pasif)
│   │   │   ├── config.js       # CONFIG terpusat (konstanta & 33 aset di assets.js)
│   │   │   ├── state.js        # State tunggal + mesin simpan (Save Schema v2)
│   │   │   └── …               # util DOM, format angka, audio/haptic, lencana, milestone, pratinjau
│   │   ├── tabs/               # Satu folder per tab — semua berkas tab tinggal di sini:
│   │   │   ├── earnings/       # Tab Pendapatan (.html markup, .css, .js)
│   │   │   ├── investing/      # Tab Investasi (.html — 3 layar: pasar, detail aset, portofolio)
│   │   │   ├── business/       # Tab Usaha (.html — dashboard + pilih kategori)
│   │   │   ├── items/          # Tab Item (.js — memakai pratinjau modul bersama)
│   │   │   └── profile/        # Tab Profil (.html — modal reset; panel statistik di shell)
│   │   └── icons/
│   │       ├── icon-192.png    # Ikon PWA 192x192
│   │       └── icon-512.png    # Ikon PWA 512x512
│   ├── index.template.html     # SUMBER index.html — jangan edit index.html langsung
│   ├── index.html              # HASIL GENERATE (npm run build) — jangan diedit manual
│   ├── manifest.webmanifest    # Metadata pemasangan aplikasi PWA
│   └── sw.js                   # Service Worker cache-first mode luring
├── scripts/
│   ├── build.js                # Perakit index.html dari template + partial tab
│   └── lint.js                 # Pemeriksa konsistensi aset, JSON, CSS & CONFIG
├── tests/
│   └── smoke.test.js           # Pengujian otomatis format angka, migrasi & throttle
├── .gitignore
├── LICENSE
├── package.json
├── README.md
└── vercel.json                 # Konfigurasi direktori publik & header keamanan Vercel
```

## Menjalankan Proyek Secara Lokal

Prasyarat: **Node.js >= 18** (dan `python3` untuk peladen HTTP lokal sederhana).

1. **Kloning repositori:**
   ```bash
   git clone https://github.com/Thrive-sh/Business_Tycoon_Tap.git
   cd Business_Tycoon_Tap
   ```

2. **Jalankan peladen pengembangan lokal:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:8080` pada peramban (disarankan mode tampilan seluler Android `360x800` atau `412x915`).

3. **Setelah mengubah markup apa pun** (`index.template.html` atau `assets/tabs/**/*.html`), rakit ulang `index.html` dan sertakan hasilnya pada commit:
   ```bash
   npm run build
   ```
   `npm run lint` akan gagal bila `public/index.html` tidak sinkron dengan sumbernya.

4. **Jalankan pemeriksaan statis (lint) dan pengujian:**
   ```bash
   npm run lint
   npm test
   ```

## Panduan Kontribusi

- Pertahankan pemisahan berkas aplikasi di dalam `public/` (ES Modules per tab di `assets/tabs/`, fondasi bersama di `assets/core/`) tanpa *framework* eksternal.
- **Jangan pernah mengedit `public/index.html` secara manual** — edit `public/index.template.html` atau partial `assets/tabs/<tab>/<tab>.html`, lalu jalankan `npm run build` dan commit hasilnya. Tab Item sengaja memakai pratinjau modul bersama di shell (tidak punya markup sendiri).
- Seluruh ikon antarmuka wajib menggunakan vektor SVG pada `<symbol>` di `public/index.html` (tanpa emoji standar).
- Letakkan seluruh konstanta numerik baru di dalam objek `CONFIG` pada `public/assets/core/config.js`.
- Markup bersama semua tab (bottom navigation, SVG symbol sprite, preview-screen, roadmap modal, milestone toast) tetap di `index.template.html`.
- Pastikan `npm run lint` dan `npm test` lulus sebelum membuka *Pull Request*.

## Lisensi

Dirilis di bawah [MIT License](./LICENSE).
