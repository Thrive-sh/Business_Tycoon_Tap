# Business Tycoon Tap

Simulasi bisnis ketuk layar (*mobile-first*) berbasis web murni (**HTML5, CSS3, Vanilla JavaScript**) dengan dukungan pemasangan **PWA** dan mode luring (*offline*).

## Tautan Produksi

- **Vercel Production:** https://business-tycoon-tap.vercel.app
- **GitHub Pages:** https://thrive-sh.github.io/Business_Tycoon_Tap/

## Fitur Utama

- **Executive Black-Gold Precious Card:** Kartu saldo utama 100% Inline SVG & CSS murni (permukaan dua-rona diagonal *Matte Obsidian & Satin Gunmetal*, filigri 8-untai emas-amber, Chip EMV perak metalik, ikon Contactless NFC, tipografi perak emboss, emblem 3-pilar `TCB`, serta kilau spekular `.is-glinting` saat ketukan).
- **Bursa Investasi Live (Saham, Properti, Kripto, Forex):** 18 aset dengan simulasi pergerakan harga `random walk` setiap 3 detik, grafik garis Canvas 2D mulus (60 titik, DPR-scaled), transaksi atomik `[1][10][100][Maks]`, kalkulasi rata-rata beli (`avgEntry`) & P&L *real-time*, serta dividen saham dan pendapatan sewa properti pasif.
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
│   │   ├── css/
│   │   │   └── style.css       # Tata letak mobile-first, fokus & animasi
│   │   ├── icons/
│   │   │   ├── icon-192.png    # Ikon PWA 192x192
│   │   │   └── icon-512.png    # Ikon PWA 512x512
│   │   └── js/
│   │       └── game.js         # Logika inti, CONFIG terpusat, save & audio
│   ├── index.html              # Antarmuka utama, SVG symbol sprite & modal
│   ├── manifest.webmanifest    # Metadata pemasangan aplikasi PWA
│   └── sw.js                   # Service Worker cache-first mode luring
├── scripts/
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

3. **Jalankan pemeriksaan statis (lint) dan pengujian:**
   ```bash
   npm run lint
   npm test
   ```

## Panduan Kontribusi

- Pertahankan pemisahan berkas aplikasi di dalam `public/` (`index.html`, `assets/css/style.css`, `assets/js/game.js`) tanpa *framework* eksternal.
- Seluruh ikon antarmuka wajib menggunakan vektor SVG pada `<symbol>` di `public/index.html` (tanpa emoji standar).
- Letakkan seluruh konstanta numerik baru di dalam objek `CONFIG` pada `public/assets/js/game.js`.
- Pastikan `npm run lint` dan `npm test` lulus sebelum membuka *Pull Request*.

## Lisensi

Dirilis di bawah [MIT License](./LICENSE).
