'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// 1. Validasi berkas JSON
['package.json', 'public/manifest.webmanifest', 'vercel.json'].forEach(function (file) {
  const raw = readText(file);
  JSON.parse(raw);
});

// 2. Pastikan indeks HTML memiliki referensi SVG sprite & aset yang konsisten
const html = readText('public/index.html');
if (html.includes('7439') || html.includes('05/26')) {
  throw new Error('Detail kartu statis lama masih ditemukan di public/index.html.');
}
if (!html.includes('rel="manifest"')) {
  throw new Error('Tautan manifest PWA belum ada di public/index.html.');
}
if (!html.includes('assets/css/style.css') || !html.includes('assets/js/game.js')) {
  throw new Error('Jalur aset CSS/JS terstruktur belum terpasang di public/index.html.');
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

// 4. Pastikan aksesibilitas dasar di public/assets/css/style.css
const css = readText('public/assets/css/style.css');
if (!css.includes('prefers-reduced-motion: reduce')) {
  throw new Error('Aturan @media (prefers-reduced-motion: reduce) belum ada di style.css.');
}
if (!css.includes(':focus-visible')) {
  throw new Error('Aturan :focus-visible belum ada di style.css.');
}

// 5. Pastikan tidak ada magic number di luar blok deklarasi CONFIG/ASSETS pada game.js (kecuali 0, 1, 100)
const gameLines = readText('public/assets/js/game.js').split('\n');
let configEndIndex = -1;
for (let i = 0; i < gameLines.length; i += 1) {
  if (gameLines[i].trim() === '// END_CONFIG') {
    configEndIndex = i;
    break;
  }
}
if (configEndIndex < 0) {
  throw new Error('Penanda // END_CONFIG tidak ditemukan di public/assets/js/game.js.');
}

let inBlockComment = false;
for (let i = configEndIndex + 1; i < gameLines.length; i += 1) {
  const line = gameLines[i];
  if (line.includes('/*')) inBlockComment = true;
  if (inBlockComment) {
    if (line.includes('*/')) inBlockComment = false;
    continue;
  }
  const stripped = line
    .replace(/\/\/.*$/, '')
    .replace(/'[^']*'|\"[^\"]*\"/g, "''");
  const matches = stripped.match(/\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/g) || [];
  const invalid = matches.filter(function (n) {
    return n !== '0' && n !== '0.0' && n !== '1' && n !== '1.0' && n !== '100';
  });
  if (invalid.length > 0) {
    throw new Error(
      'Angka literal di luar CONFIG pada game.js baris ' +
        (i + 1) +
        ': ' +
        invalid.join(', ')
    );
  }
}

console.log('Pemeriksaan statis (lint) lulus tanpa masalah.');
