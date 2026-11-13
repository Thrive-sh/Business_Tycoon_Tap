'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

// Mock localStorage in-memory yang mencatat jumlah pemanggilan setItem
function createMockStorage() {
  const store = new Map();
  let setCount = 0;
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      setCount += 1;
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
      setCount = 0;
    },
    getWriteCount() {
      return setCount;
    },
    resetWriteCount() {
      setCount = 0;
    }
  };
}

const mockStorage = createMockStorage();
globalThis.localStorage = mockStorage;

const game = require('../public/assets/js/game.js');

test('formatCurrencyValue, formatRupiah*, dan formatSignedPercent anti-NaN/Infinity', function () {
  assert.equal(game.formatCurrencyValue(0), '0,00');
  assert.equal(game.formatCurrencyValue(1), '1,00');
  assert.equal(game.formatCurrencyValue(999.99), '999,99');
  assert.equal(game.formatCurrencyValue(1500), '1,5 rb');
  assert.equal(game.formatCurrencyValue(2500000), '2,5 jt');
  assert.equal(game.formatCurrencyValue(3250000000), '3,25 M');
  assert.equal(game.formatCurrencyValue(1500000000000), '1,5 T');
  assert.equal(game.formatFullCurrencyValue(2500000), '2.500.000,00');

  assert.equal(game.formatRupiahFull(1234567.89), 'Rp1.234.567,89');
  assert.equal(game.formatRupiahCompact(25000), 'Rp25 rb');
  assert.equal(game.formatRupiahCompact(3600000), 'Rp3,6 jt');
  assert.equal(game.formatRupiahCompact(1600000000), 'Rp1,6 M');
  assert.equal(game.formatRupiahCompact(NaN), 'Rp0,00');
  assert.equal(game.formatRupiahFull(Infinity), 'Rp0,00');

  assert.equal(game.formatSignedPercent(1.25), '+1,25%');
  assert.equal(game.formatSignedPercent(-0.4), '-0,40%');
  assert.equal(game.formatSignedPercent(0), '+0,00%');
  assert.equal(game.formatSignedPercent(NaN), '+0,00%');
  assert.equal(game.formatSignedPercent(Infinity), '+0,00%');
});

test('Executive Black-Gold Precious Card: struktur SVG, branding fiktif, dan bebas merek nyata', function () {
  const rootDir = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(rootDir, 'public/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'public/assets/css/style.css'), 'utf8');

  assert.equal(/\b(Danamon|JCB)\b/i.test(html), false, 'index.html harus bebas merek nyata');
  assert.ok(html.includes('content="#1B202C"'), 'meta theme-color harus #1B202C');
  assert.ok(html.includes('id="bank-card"'), 'Elemen #bank-card wajib ada');
  assert.ok(html.includes('TYCOON'), 'Institusi fiktif TYCOON wajib ada');
  assert.ok(html.includes('PRECIOUS'), 'Tier PRECIOUS wajib ada');
  assert.ok(html.includes('TYCOON EXECUTIVE'), 'Pemegang kartu TYCOON EXECUTIVE wajib ada');
  assert.ok(html.includes('05/29'), 'Valid thru 05/29 wajib ada');
  assert.ok(html.includes('id="balance-display"') && html.includes('aria-live="polite"'));
  assert.ok(html.includes('id="per-click-display"'));
  assert.ok(html.includes('id="preview-balance-display"'));

  assert.ok(css.includes('--header-grad-start: #242A38'));
  assert.ok(css.includes('--accent-gold: #F59E0B'));
  assert.ok(css.includes('.bank-card.is-glinting::before'));
  assert.ok(css.includes('.bank-card__balance--compact'));
  assert.ok(css.includes('.bank-card__balance--ultra-compact'));
});

test('INV-02 & INV-03: 21 aset investasi valid, 60 titik riwayat awal, dan tick harga finite', function () {
  mockStorage.clear();
  game.resetAllData();

  assert.equal(game.ASSETS.length, 21);
  const byCategory = { Saham: 0, Properti: 0, Kripto: 0, Forex: 0 };
  game.ASSETS.forEach(function (asset) {
    byCategory[asset.category] += 1;
    const history = game.state.priceHistory[asset.id];
    assert.ok(Array.isArray(history), 'Riwayat harga harus berupa array');
    assert.equal(history.length, 60, 'Riwayat awal harus 60 titik');
    history.forEach(function (pt) {
      assert.ok(Number.isFinite(pt.price) && pt.price >= asset.initialPrice * 0.01);
    });
  });

  assert.deepEqual(byCategory, { Saham: 8, Properti: 4, Kripto: 5, Forex: 4 });

  // Jalankan beberapa tick harga 3 detik dan pastikan semua tetap finite dan dibatasi 60 titik
  for (let i = 0; i < 5; i += 1) {
    game.runPriceTick();
  }
  game.ASSETS.forEach(function (asset) {
    const p = game.state.lastPrices[asset.id];
    assert.ok(Number.isFinite(p) && p >= asset.initialPrice * 0.01);
    assert.equal(game.state.priceHistory[asset.id].length, 60);
  });
});

test('INV-03 & INV-05: buyAsset/sellAsset atomik, weighted avgEntry, hapus saat 0, dan dividen pasif', function () {
  mockStorage.clear();
  game.resetAllData();

  // Set harga deterministik untuk pengujian Apple
  game.state.lastPrices.saham_apple = 100000;
  game.state.balance = 1000000;

  // Gagal beli 20 lembar karena butuh Rp2.000.000 (atomik: saldo & holdings tidak berubah)
  assert.equal(game.buyAsset('saham_apple', 20), false);
  assert.equal(game.state.balance, 1000000);
  assert.equal(game.state.holdings.saham_apple, undefined);

  // Beli 2 lembar @ Rp100.000 = Rp200.000
  assert.equal(game.buyAsset('saham_apple', 2), true);
  assert.equal(game.state.balance, 800000);
  assert.deepEqual(game.state.holdings.saham_apple, { units: 2, avgEntry: 100000 });

  // Harga naik ke Rp150.000, beli 1 lembar lagi -> avgEntry = (2*100000 + 1*150000)/3 = 116666,67
  game.state.lastPrices.saham_apple = 150000;
  assert.equal(game.buyAsset('saham_apple', 1), true);
  assert.equal(game.state.balance, 650000);
  assert.equal(game.state.holdings.saham_apple.units, 3);
  assert.equal(game.state.holdings.saham_apple.avgEntry, 116666.67);

  // Ringkasan kategori Saham: nilai 3 * 150000 = 450000, yieldPerHour = 450000 * 0.004 = Rp1.800/jam (Rp0,50/dtk)
  const summary = game.getCategorySummary('Saham');
  assert.equal(summary.totalValue, 450000);
  assert.equal(summary.hourlyYield, 1800);
  assert.ok(Number.isFinite(summary.pnlPct) && summary.pnlValue > 0);

  // Tick pasif 1 detik menyalurkan dividen Rp1.800 / 3600 = Rp0,50 ke saldo pemain
  const balBeforePassive = game.state.balance;
  game.runPassiveTick();
  assert.equal(game.state.balance, Math.round((balBeforePassive + 0.5) * 100) / 100);

  // Gagal jual lebih banyak dari yang dimiliki
  assert.equal(game.sellAsset('saham_apple', 5), false);
  assert.equal(game.state.holdings.saham_apple.units, 3);

  // Jual sebagian (1 lembar): avgEntry tetap sama
  assert.equal(game.sellAsset('saham_apple', 1), true);
  assert.equal(game.state.holdings.saham_apple.units, 2);
  assert.equal(game.state.holdings.saham_apple.avgEntry, 116666.67);

  // Jual sisa 2 lembar -> entry dihapus bersih dari holdings
  assert.equal(game.sellAsset('saham_apple', 2), true);
  assert.equal(game.state.holdings.saham_apple, undefined);
});

test('INV-06: loadState migrasi v1 ke v2 dan persistensi holdings + lastPrices tanpa array riwayat', function () {
  mockStorage.clear();
  mockStorage.setItem(
    game.CONFIG.STORAGE_KEY,
    JSON.stringify({ balance: 142.5, perClick: 6 })
  );

  game.loadState();

  assert.equal(game.state.version, 2);
  assert.equal(game.state.balance, 142.5);
  assert.deepEqual(game.state.holdings, {});

  // Simpan kepemilikan dan harga baru pada schema v2
  game.state.balance = 500000;
  game.state.lastPrices.kripto_solana = 2450000;
  game.state.holdings.kripto_solana = { units: 4, avgEntry: 2200000 };
  game.writeSaveImmediate();

  const savedRaw = mockStorage.getItem(game.CONFIG.STORAGE_KEY);
  const saved = JSON.parse(savedRaw);
  assert.equal(saved.version, 2);
  assert.deepEqual(saved.holdings.kripto_solana, { units: 4, avgEntry: 2200000 });
  assert.equal(saved.lastPrices.kripto_solana, 2450000);
  assert.equal(saved.priceHistory, undefined, 'Riwayat 60 titik tidak boleh disimpan ke localStorage');

  // Muat ulang ke memori segar dan pastikan holdings, lastPrices, serta 60 titik grafik pulih
  game.state.holdings = {};
  game.state.lastPrices = {};
  game.state.priceHistory = {};
  game.loadState();

  assert.deepEqual(game.state.holdings.kripto_solana, { units: 4, avgEntry: 2200000 });
  assert.equal(game.state.lastPrices.kripto_solana, 2450000);
  assert.equal(game.state.priceHistory.kripto_solana.length, 60);
});

test('saveState menerapkan throttle 500ms (20 tap cepat <= 3 penulisan localStorage)', async function () {
  mockStorage.clear();
  game.resetAllData();
  mockStorage.resetWriteCount();

  for (let i = 0; i < 20; i += 1) {
    game.processTap(0, 0);
  }

  // Selama < 500ms, penulisan terjadwal belum dieksekusi berulang-ulang
  assert.ok(mockStorage.getWriteCount() <= 1);

  await new Promise(function (resolve) {
    setTimeout(resolve, 600);
  });

  assert.ok(
    mockStorage.getWriteCount() >= 1 && mockStorage.getWriteCount() <= 3,
    '20 tap cepat harus menghasilkan antara 1 hingga maksimal 3 penulisan localStorage'
  );

  const saved = JSON.parse(mockStorage.getItem(game.CONFIG.STORAGE_KEY));
  assert.equal(saved.balance, 20);
  assert.equal(saved.totalTaps, 20);
  assert.equal(saved.totalEarned, 20);
});

test('buyUpgrade mengurangi saldo, menaikkan perClick/perSecond, dan calculateOfflineBonus menghormati batas 2 jam', function () {
  mockStorage.clear();
  game.resetAllData();

  game.state.balance = 600;
  assert.equal(game.buyUpgrade('gloves'), true);
  assert.equal(game.state.balance, 585);
  assert.equal(game.state.perClick, 2);

  assert.equal(game.buyUpgrade('auto_team'), true);
  assert.equal(game.state.balance, 85);
  assert.equal(game.state.perClick, 27);
  assert.equal(game.state.perSecond, 10);

  // Offline 60 detik dengan rate Rp10/dtk dan efisiensi 50% => Rp300
  const oneMin = game.calculateOfflineBonus(10, 60 * 1000);
  assert.equal(oneMin.bonus, 300);

  // Offline 5 jam dibatasi maksimal 2 jam (7200 detik) => 10 * 7200 * 0.5 = Rp36.000
  const fiveHours = game.calculateOfflineBonus(10, 5 * 3600 * 1000);
  assert.equal(fiveHours.seconds, 7200);
  assert.equal(fiveHours.bonus, 36000);
});
