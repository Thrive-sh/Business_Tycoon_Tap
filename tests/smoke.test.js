'use strict';

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

test('formatCurrencyValue memformat angka kecil dan singkatan Indonesia (rb, jt, M, T)', function () {
  assert.equal(game.formatCurrencyValue(0), '0,00');
  assert.equal(game.formatCurrencyValue(1), '1,00');
  assert.equal(game.formatCurrencyValue(999.99), '999,99');
  assert.equal(game.formatCurrencyValue(1500), '1,5 rb');
  assert.equal(game.formatCurrencyValue(2500000), '2,5 jt');
  assert.equal(game.formatCurrencyValue(3250000000), '3,25 M');
  assert.equal(game.formatCurrencyValue(1500000000000), '1,5 T');
  assert.equal(game.formatFullCurrencyValue(2500000), '2.500.000,00');
});

test('loadState melakukan migrasi otomatis dari save v1 ke schema v2 tanpa kehilangan saldo', function () {
  mockStorage.clear();
  mockStorage.setItem(
    game.CONFIG.STORAGE_KEY,
    JSON.stringify({ balance: 142.5, perClick: 6 })
  );

  game.loadState();

  assert.equal(game.state.version, 2);
  assert.equal(game.state.balance, 142.5);
  assert.equal(game.state.totalEarned, 142.5);
  assert.equal(game.state.totalTaps, 0);

  const migratedRaw = mockStorage.getItem(game.CONFIG.STORAGE_KEY);
  assert.ok(migratedRaw, 'Data hasil migrasi harus tersimpan kembali ke localStorage');
  const migrated = JSON.parse(migratedRaw);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.balance, 142.5);
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

  // Offline 60 detik dengan rate $10/dtk dan efisiensi 50% => $300
  const oneMin = game.calculateOfflineBonus(10, 60 * 1000);
  assert.equal(oneMin.bonus, 300);

  // Offline 5 jam dibatasi maksimal 2 jam (7200 detik) => 10 * 7200 * 0.5 = $36.000
  const fiveHours = game.calculateOfflineBonus(10, 5 * 3600 * 1000);
  assert.equal(fiveHours.seconds, 7200);
  assert.equal(fiveHours.bonus, 36000);
});
