# Business Tycoon Tap

Simulasi bisnis ketuk layar (*mobile-first*) berbasis web murni (**HTML5, CSS3, Vanilla JavaScript**) dengan dukungan pemasangan **PWA** dan mode luring (*offline*).

## Tautan Produksi

- **Vercel Production:** https://business-tycoon-tap.vercel.app
- **GitHub Pages:** https://thrive-sh.github.io/Business_Tycoon_Tap/

## Fitur Utama

- **Siklus Ekonomi Ketukan & 3 Tingkat Peningkatan:** Sarung Tangan (`+$1/ketuk`), Mesin Ketuk (`+$5/ketuk`), dan Tim Otomatis (`+$25/ketuk` & `+$10/dtk`) dengan eskalasi biaya `baseCost * 1.15^level`.
- **Pendapatan Pasif & Penghasilan Luring:** Dihitung otomatis dari `lastSeen` (efisiensi `50%`, batas maksimal `2 jam`) dan hanya merender DOM saat tab aktif terlihat.
- **Format Angka Ringkas Indonesia:** Mendukung singkatan `rb`, `jt`, `M`, dan `T` dengan nominal penuh pada `title` dan `aria-label`.
- **Save Schema v2 & Throttle 500ms:** Migrasi otomatis dari format simpanan v1, pencatatan statistik profil, konfirmasi reset dua langkah, serta penyimpanan seketika saat tab disembunyikan/ditutup.
- **Umpan Balik & Pencapaian:** Bunyi blip koin sintetis (*Web Audio API*), getar sentuh (`navigator.vibrate`), preferensi ON/OFF tersimpan, dan notifikasi pencapaian satu kali.
- **Aksesibilitas WCAG AA & PWA:** Kontras teks terverifikasi, `:focus-visible`, dukungan `prefers-reduced-motion`, satu sumber ikon vektor SVG `<symbol>`, serta `Service Worker` *cache-first*.

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
