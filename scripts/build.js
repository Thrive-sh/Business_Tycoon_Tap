/* ==========================================================================
   BUSINESS TYCOON TAP - BUILD ASSEMBLER (scripts/build.js)

   Menggabungkan `public/index.template.html` dengan partial markup per tab
   (`public/assets/tabs/<tab>/<tab>.html`) menjadi `public/index.html` yang
   siap saji. `index.html` adalah HASIL GENERATE — jangan diedit manual.

   Pemakaian:
     node scripts/build.js          Menulis ulang public/index.html
     node scripts/build.js --check  Memverifikasi index.html sinkron dengan
                                    template + partial (dipakai oleh lint/CI)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TEMPLATE_PATH = path.join(PUBLIC_DIR, 'index.template.html');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'index.html');

const INCLUDES = ['earnings', 'investing', 'business', 'profile'];

/**
 * Merakit isi index.html dari template + partial. Mengembalikan string hasil.
 */
export function assembleIndexHtml() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error('Template tidak ditemukan: ' + TEMPLATE_PATH);
  }
  let output = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  INCLUDES.forEach(function (name) {
    const partialPath = path.join(PUBLIC_DIR, 'assets', 'tabs', name, name + '.html');
    if (!fs.existsSync(partialPath)) {
      throw new Error('Partial tidak ditemukan untuk tab "' + name + '": ' + partialPath);
    }
    const partial = fs.readFileSync(partialPath, 'utf8');
    const placeholder = new RegExp('^    <!-- @include:' + name + ' -->\\n?', 'm');
    if (!placeholder.test(output)) {
      throw new Error('Placeholder @include:' + name + ' tidak ada di index.template.html.');
    }
    output = output.replace(placeholder, function () {
      return partial;
    });
  });

  return output;
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const check = process.argv.includes('--check');
  const assembled = assembleIndexHtml();

  if (check) {
    const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf8') : '';
    if (current !== assembled) {
      console.error(
        'public/index.html TIDAK sinkron dengan index.template.html + partial tab.\n' +
          'Jalankan: npm run build  (lalu commit hasilnya).'
      );
      process.exit(1);
    }
    console.log('index.html sinkron dengan template + partial.');
    process.exit(0);
  }

  fs.writeFileSync(OUTPUT_PATH, assembled);
  const lineCount = assembled.split('\n').length - 1;
  console.log('Build selesai: public/index.html (' + lineCount + ' baris).');
}
