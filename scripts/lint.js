import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// 1. Validasi berkas JSON
['package.json', 'public/manifest.webmanifest', 'vercel.json'].forEach(function (file) {
  const raw = readText(file);
  JSON.parse(raw);
});

// 2. Pastikan indeks HTML bebas merek dunia nyata (Trademark-Safe) & memiliki referensi SVG/aset konsisten
const html = readText('public/index.html');
if (/\b(Danamon|JCB)\b/i.test(html) || html.includes('05/26')) {
  throw new Error('Merek kartu dunia nyata atau detail kedaluwarsa lama masih ditemukan di public/index.html.');
}
if (!html.includes('rel="manifest"')) {
  throw new Error('Tautan manifest PWA belum ada di public/index.html.');
}
if (!html.includes('assets/core/base.css') || !html.includes('assets/main.js')) {
  throw new Error('Jalur aset CSS inti/JS terstruktur belum terpasang di public/index.html.');
}
if (html.includes('assets/js/game.js') || html.includes('assets/css/style.css')) {
  throw new Error('Referensi berkas lama (game.js/style.css) masih tersisa di public/index.html.');
}

const definedSymbols = new Set(
  Array.from(html.matchAll(/<symbol\s+id="([^"]+)"/g), function (m) {
    return m[1];
  })
);
const usedSymbols = Array.from(html.matchAll(/<use\s+href="#([^"]+)"/g), function (m) {
  return m[1];
});
usedSymbols.forEach(function (symId) {
  if (!definedSymbols.has(symId)) {
    throw new Error('Ikon SVG <use href="#' + symId + '"> tidak ditemukan di sprite.');
  }
});

// 3. Pastikan berkas ikon PWA tersedia di public/assets/icons/
['public/assets/icons/icon-192.png', 'public/assets/icons/icon-512.png'].forEach(function (iconPath) {
  if (!fs.existsSync(path.join(ROOT, iconPath))) {
    throw new Error('Berkas ikon tidak ditemukan: ' + iconPath);
  }
});

// 4. Pastikan aksesibilitas dasar tersedia pada gabungan berkas CSS (dipecah per folder)
const cssFiles = [
  'public/assets/core/base.css',
  'public/assets/core/preview.css',
  'public/assets/core/responsive.css',
  'public/assets/tabs/earnings/earnings.css',
  'public/assets/tabs/investing/investing.css',
  'public/assets/tabs/business/business.css',
  'public/assets/tabs/profile/profile.css'
];
const allCss = cssFiles.map(readText).join('\n');
if (!allCss.includes('prefers-reduced-motion: reduce')) {
  throw new Error('Aturan @media (prefers-reduced-motion: reduce) belum ada di berkas CSS.');
}
if (!allCss.includes(':focus-visible')) {
  throw new Error('Aturan :focus-visible belum ada di berkas CSS.');
}

// 5. Pastikan tidak ada magic number di luar blok deklarasi CONFIG/ASSETS (kecuali 0, 1, 100)
//    CONFIG dan ASSETS sengaja dikecualikan karena seluruh konstanta tinggal di sana.
const jsFiles = [
  'public/assets/main.js',
  'public/assets/core/dom.js',
  'public/assets/core/format.js',
  'public/assets/core/state.js',
  'public/assets/core/feedback.js',
  'public/assets/core/badges.js',
  'public/assets/core/milestones.js',
  'public/assets/core/preview.js',
  'public/assets/tabs/earnings/earnings.js',
  'public/assets/tabs/investing/investing.js',
  'public/assets/tabs/business/business.js',
  'public/assets/tabs/items/items.js',
  'public/assets/tabs/profile/profile.js'
];

jsFiles.forEach(function (relPath) {
  const gameLines = readText(relPath).split('\n');
  let inBlockComment = false;
  for (let i = 0; i < gameLines.length; i += 1) {
    const line = gameLines[i];
    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    const stripped = line
      .replace(/\/\/.*$/, '')
      .replace(/'[^']*'|"[^"]*"/g, "''");
    const matches = stripped.match(/\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/g) || [];
    const invalid = matches.filter(function (n) {
      return n !== '0' && n !== '0.0' && n !== '1' && n !== '1.0' && n !== '100';
    });
    if (invalid.length > 0) {
      throw new Error(
        'Angka literal di luar CONFIG pada ' +
          relPath +
          ' baris ' +
          (i + 1) +
          ': ' +
          invalid.join(', ')
      );
    }
  }
});

console.log('Pemeriksaan statis (lint) lulus tanpa masalah.');
