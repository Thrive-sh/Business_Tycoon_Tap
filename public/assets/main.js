/* ==========================================================================
   BUSINESS TYCOON TAP - ENTRY POINT APLIKASI (assets/main.js)
   Merangkai init, perpindahan tab, loop pendapatan pasif & harga pasar,
   serta migrasi penyimpanan Save Schema v1 -> v2.
   ========================================================================== */

import { CONFIG } from './core/config.js';
import { ASSETS } from './core/assets.js';
import { hasDOM, root, getEl } from './core/dom.js';
import {
  state,
  runtime,
  getStorage,
  calculateOfflineBonus,
  writeSaveImmediate,
  flushSaveState,
  saveState
} from './core/state.js';
import { setTabBadge } from './core/badges.js';
import { checkMilestones } from './core/milestones.js';
import { hideModulePreview, renderModulePreview, bindPreviewEvents } from './core/preview.js';
import {
  renderBankCardIdentity,
  renderStats,
  renderUpgrades,
  countAffordableUpgrades,
  recalculatePerClick,
  recalculatePerSecond,
  showOfflineWelcomeModal,
  bindEarningsEvents
} from './tabs/earnings/earnings.js';
import {
  initMarketData,
  getTotalInvestmentHourlyYield,
  runPriceTick,
  renderInvestingScreen,
  renderAssetDetailScreen,
  bindInvestingEvents
} from './tabs/investing/investing.js';
import { renderBusinessCompanies, bindBusinessEvents } from './tabs/business/business.js';
import { renderItemsTab } from './tabs/items/items.js';
import { renderProfileStats, bindProfileEvents } from './tabs/profile/profile.js';

const earningsScreen = getEl('earnings-screen');
const investingScreen = getEl('investing-screen');
const assetDetailScreen = getEl('asset-detail-screen');
const portfolioScreen = getEl('portfolio-screen');
const businessScreen = getEl('business-screen');
const businessCategoryScreen = getEl('business-category-screen');
const navTabs = hasDOM ? Array.from(document.querySelectorAll('.nav-tab')) : [];

let passiveIntervalId = null;
let priceIntervalId = null;

/**
 * Memuat data dari localStorage dengan migrasi otomatis dari Save Schema v1 ke v2.
 */
export function loadState() {
  const now = Date.now();
  const storage = getStorage();
  if (!storage) {
    state.startDate = now;
    state.lastSeen = now;
    initMarketData();
    return;
  }

  try {
    const raw = storage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) {
      state.startDate = now;
      state.lastSeen = now;
      initMarketData();
      return;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const isV2 = Number(parsed.version) >= CONFIG.SAVE_SCHEMA_VERSION;
      const loadedBalance = Number(parsed.balance);
      const loadedPerClick = Number(parsed.perClick);

      state.balance =
        Number.isFinite(loadedBalance) && loadedBalance >= 0
          ? Math.round(loadedBalance * 100) / 100
          : 0;

      CONFIG.UPGRADE_TIERS.forEach(function (tier) {
        const lvl =
          parsed.upgrades && typeof parsed.upgrades === 'object'
            ? Number(parsed.upgrades[tier.id])
            : 0;
        state.upgrades[tier.id] = Number.isFinite(lvl) && lvl >= 0 ? Math.floor(lvl) : 0;
      });

      const calculatedClick = recalculatePerClick();
      if (parsed.upgrades && typeof parsed.upgrades === 'object') {
        state.perClick = calculatedClick;
      } else if (Number.isFinite(loadedPerClick) && loadedPerClick > 0) {
        state.perClick = Math.round(loadedPerClick * 100) / 100;
      } else {
        state.perClick = CONFIG.BASE_PER_CLICK;
      }
      state.perSecond = recalculatePerSecond();

      if (parsed.settings && typeof parsed.settings === 'object') {
        state.settings.sound = parsed.settings.sound !== false;
        state.settings.haptic = parsed.settings.haptic !== false;
      } else {
        state.settings.sound = true;
        state.settings.haptic = true;
      }

      state.milestones = {};
      if (parsed.milestones && typeof parsed.milestones === 'object') {
        CONFIG.MILESTONES.forEach(function (m) {
          if (parsed.milestones[m.id]) {
            state.milestones[m.id] = true;
          }
        });
      }

      state.ownedBusinesses = Array.isArray(parsed.ownedBusinesses)
        ? parsed.ownedBusinesses.filter(function (business) {
            return business && typeof business === 'object' && typeof business.category === 'string' && business.category.trim();
          }).map(function (business) {
            return {
              category: business.category.trim(),
              count: Math.max(1, Math.floor(Number(business.count) || 1)),
              incomePerHour: Math.max(0, Number(business.incomePerHour) || 0),
              purchasedAt: Number(business.purchasedAt) || now
            };
          })
        : [];
      state.holdings = {};
      state.lastPrices = {};

      if (isV2) {
        if (parsed.holdings && typeof parsed.holdings === 'object') {
          ASSETS.forEach(function (asset) {
            const entry = parsed.holdings[asset.id];
            if (!entry || typeof entry !== 'object') return;
            const u = Number(entry.units);
            const avg = Number(entry.avgEntry);
            if (Number.isFinite(u) && u >= 1 && Number.isFinite(avg) && avg >= 0) {
              state.holdings[asset.id] = {
                units: Math.floor(u),
                avgEntry: Math.round(avg * 100) / 100
              };
            }
          });
        }

        if (parsed.lastPrices && typeof parsed.lastPrices === 'object') {
          ASSETS.forEach(function (asset) {
            const lp = Number(parsed.lastPrices[asset.id]);
            const minAllowed = asset.initialPrice * CONFIG.MIN_PRICE_FACTOR;
            if (Number.isFinite(lp) && lp >= minAllowed) {
              state.lastPrices[asset.id] = Math.round(lp * 100) / 100;
            }
          });
        }
      }

      // Bangkitkan ulang 60 titik grafik di sekitar lastPrices tanpa menyimpannya ke localStorage
      state.priceHistory = {};
      initMarketData();

      if (isV2) {
        const taps = Number(parsed.totalTaps);
        const earned = Number(parsed.totalEarned);
        const start = Number(parsed.startDate);
        const seen = Number(parsed.lastSeen);

        state.totalTaps = Number.isFinite(taps) && taps >= 0 ? Math.floor(taps) : 0;
        state.totalEarned =
          Number.isFinite(earned) && earned >= state.balance
            ? Math.round(earned * 100) / 100
            : state.balance;
        state.startDate = Number.isFinite(start) && start > 0 ? start : now;
        const previousSeen = Number.isFinite(seen) && seen > 0 ? seen : now;

        // Hitung penghasilan luring sejak lastSeen (Tim Otomatis + dividen/sewa portofolio)
        const totalOfflineRatePerSec =
          state.perSecond + getTotalInvestmentHourlyYield() / CONFIG.SECONDS_PER_HOUR;
        const offlineResult = calculateOfflineBonus(totalOfflineRatePerSec, now - previousSeen);
        if (offlineResult.bonus > 0) {
          state.balance = Math.round((state.balance + offlineResult.bonus) * 100) / 100;
          state.totalEarned = Math.round((state.totalEarned + offlineResult.bonus) * 100) / 100;
          state.lastSeen = now;
          writeSaveImmediate();
          showOfflineWelcomeModal(offlineResult.bonus, offlineResult.seconds);
        } else {
          state.lastSeen = now;
        }
      } else {
        // Migrasi otomatis dari v1 (version belum ada atau < 2): holdings & lastPrices baru, saldo tetap aman
        state.totalTaps = 0;
        state.totalEarned = state.balance;
        state.startDate = now;
        state.lastSeen = now;
        state.version = CONFIG.SAVE_SCHEMA_VERSION;
        writeSaveImmediate();
      }
    }
  } catch (error) {
    initMarketData();
  }
}


/**
 * Mengatur perpindahan tab pada Bottom Navigation Bar.
 */
export function switchTab(tabName) {
  state.activeTab = tabName;
  state.selectedAssetId = null;
  setTabBadge(tabName, 0);
  if (tabName === 'Earnings') {
    runtime.acknowledgedAffordableCount = countAffordableUpgrades();
  } else if (tabName === 'Profile') {
    runtime.unseenMilestonesCount = 0;
  }

  navTabs.forEach(function (tabBtn) {
    const tabAttr = tabBtn.getAttribute('data-tab');
    const isSelected = tabAttr === tabName;
    tabBtn.classList.toggle('nav-tab--active', isSelected);
    if (isSelected) {
      tabBtn.setAttribute('aria-current', 'page');
    } else {
      tabBtn.removeAttribute('aria-current');
    }
    if (tabAttr === 'Earnings') {
      if (isSelected) {
        tabBtn.style.setProperty('--coin-bg-fill', '#F97316');
        tabBtn.style.setProperty('--coin-bg-stroke', '#F97316');
        tabBtn.style.setProperty('--coin-ring-stroke', 'rgba(255,255,255,0.32)');
        tabBtn.style.setProperty('--coin-symbol-stroke', '#FFFFFF');
      } else {
        tabBtn.style.removeProperty('--coin-bg-fill');
        tabBtn.style.removeProperty('--coin-bg-stroke');
        tabBtn.style.removeProperty('--coin-ring-stroke');
        tabBtn.style.removeProperty('--coin-symbol-stroke');
      }
    }
  });

  if (!earningsScreen) return;

  earningsScreen.hidden = true;
  earningsScreen.classList.remove('screen--active');
  hideModulePreview();
  if (businessScreen) {
    businessScreen.hidden = true;
    businessScreen.classList.remove('screen--active');
  }
  if (businessCategoryScreen) {
    businessCategoryScreen.hidden = true;
    businessCategoryScreen.classList.remove('screen--active');
  }
  if (investingScreen) {
    investingScreen.hidden = true;
    investingScreen.classList.remove('screen--active');
  }
  if (assetDetailScreen) {
    assetDetailScreen.hidden = true;
    assetDetailScreen.classList.remove('screen--active');
  }
  if (portfolioScreen) {
    portfolioScreen.hidden = true;
    portfolioScreen.classList.remove('screen--active');
  }

  if (tabName === 'Earnings') {
    earningsScreen.hidden = false;
    earningsScreen.classList.add('screen--active');
  } else if (tabName === 'Investing' && investingScreen) {
    investingScreen.hidden = false;
    investingScreen.classList.add('screen--active');
    renderInvestingScreen();
  } else if (tabName === 'Business' && businessScreen) {
    businessScreen.hidden = false;
    businessScreen.classList.add('screen--active');
    renderBusinessCompanies();
  } else if (tabName === 'Items') {
    renderItemsTab();
  } else {
    renderModulePreview(tabName);
  }
}

/**
 * Mendaftarkan event navigasi global & penangan siklus visibilitas dokumen.
 */
function bindGlobalEvents() {
  if (!hasDOM) return;

  navTabs.forEach(function (tabBtn) {
    tabBtn.addEventListener('click', function () {
      const targetTab = tabBtn.getAttribute('data-tab');
      if (targetTab) {
        switchTab(targetTab);
      }
    });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      flushSaveState();
    } else if (document.visibilityState === 'visible') {
      renderStats();
      renderUpgrades();
      if (state.activeTab === 'Investing') {
        if (state.selectedAssetId) {
          renderAssetDetailScreen();
        } else {
          renderInvestingScreen();
        }
      } else if (state.activeTab === 'Profile') {
        renderProfileStats();
      }
    }
  });
  root.addEventListener('beforeunload', flushSaveState);
  root.addEventListener('pagehide', flushSaveState);
}

/**
 * Satu siklus pendapatan pasif per detik (termasuk dividen Saham & sewa Properti).
 */
export function runPassiveTick() {
  const hourlyYield = getTotalInvestmentHourlyYield();
  const investPerSec = hourlyYield / CONFIG.SECONDS_PER_HOUR;
  if (Number.isFinite(investPerSec) && investPerSec > 0) {
    runtime.investmentYieldCarry += investPerSec;
  }

  const realizedInvest = Math.floor(runtime.investmentYieldCarry * 100) / 100;
  if (realizedInvest > 0) {
    runtime.investmentYieldCarry = Math.max(0, runtime.investmentYieldCarry - realizedInvest);
  }

  const totalGain = state.perSecond + realizedInvest;
  if (!Number.isFinite(totalGain) || totalGain <= 0) return;

  state.balance = Math.round((state.balance + totalGain) * 100) / 100;
  state.totalEarned = Math.round((state.totalEarned + totalGain) * 100) / 100;
  saveState();

  if (hasDOM && document.visibilityState === 'visible') {
    renderStats();
    renderUpgrades();
    if (state.activeTab === 'Investing') {
      if (state.selectedAssetId) {
        renderAssetDetailScreen();
      } else {
        renderInvestingScreen();
      }
    } else if (state.activeTab === 'Profile') {
      renderProfileStats();
    }
    checkMilestones();
  }
}

/**
 * Memulai interval untuk pendapatan pasif.
 */
function startPassiveIncomeLoop() {
  if (passiveIntervalId) {
    root.clearInterval(passiveIntervalId);
  }
  passiveIntervalId = root.setInterval(runPassiveTick, CONFIG.PASSIVE_TICK_MS);
}

/**
 * Memulai interval pergerakan harga pasar setiap 3 detik.
 */
function startMarketPriceLoop() {
  if (priceIntervalId) {
    root.clearInterval(priceIntervalId);
  }
  priceIntervalId = root.setInterval(runPriceTick, CONFIG.PRICE_TICK_MS);
}

/**
 * Mendaftarkan Service Worker untuk dukungan PWA luring.
 */
function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && root.addEventListener) {
    root.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {
        // Abaikan jika dijalankan dari protokol file:// lokal
      });
    });
  }
}

// Inisialisasi aplikasi saat berada di lingkungan DOM peramban
function init() {
  setTabBadge('Earnings', 0);
  setTabBadge('Profile', 0);
  loadState();
  renderBankCardIdentity();
  renderStats();
  renderUpgrades();
  renderProfileStats();
  renderInvestingScreen();
  bindGlobalEvents();
  bindEarningsEvents();
  bindInvestingEvents();
  bindBusinessEvents();
  bindPreviewEvents(function () {
    switchTab('Earnings');
  });
  bindProfileEvents();
  startPassiveIncomeLoop();
  startMarketPriceLoop();
  registerServiceWorker();
}

if (hasDOM) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
