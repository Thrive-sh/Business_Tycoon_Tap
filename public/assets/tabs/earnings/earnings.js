/* ==========================================================================
   BUSINESS TYCOON TAP - TAB PENDAPATAN (Kartu Saldo, Area Tap & Peningkatan)
   ========================================================================== */

import { CONFIG } from '../../core/config.js';
import { hasDOM, root, getEl } from '../../core/dom.js';
import { state, runtime, saveState, writeSaveImmediate } from '../../core/state.js';
import {
  formatCurrencyValue,
  formatFullCurrencyValue,
  formatRupiahCompact
} from '../../core/format.js';
import {
  triggerHaptic,
  playCoinBlip,
  prefersReducedMotion,
  announceScreenReader
} from '../../core/feedback.js';
import { checkMilestones } from '../../core/milestones.js';
import { setTabBadge } from '../../core/badges.js';

// Referensi elemen DOM (null di lingkungan pengujian Node)
const bankCard = getEl('bank-card');
const balanceDisplay = getEl('balance-display');
const playerCardId = getEl('player-card-id');
const previewBalanceDisplay = getEl('preview-balance-display');
const perClickDisplay = getEl('per-click-display');
const tapArea = getEl('tap-area');
const tapHandIcon = getEl('tap-hand-icon');
const tapEffectsLayer = getEl('tap-effects-layer');
const upgradesList = getEl('upgrades-list');
const investWalletBalance = getEl('invest-wallet-balance');
const detailWalletBalance = getEl('detail-wallet-balance');
const offlineModal = getEl('offline-modal');
const offlineModalTitle = getEl('offline-modal-title');
const offlineModalDesc = getEl('offline-modal-desc');
const closeOfflineModalBtn = getEl('close-offline-modal-btn');

let lastTouchTimestamp = 0;
let pulseCleanupTimer = null;
let cardGlintTimer = null;

/**
 * Menghitung biaya peningkatan tingkat berikutnya.
 */
export function getUpgradeCost(tier, level) {
  const safeLevel = Number.isFinite(level) && level >= 0 ? Math.floor(level) : 0;
  const rawCost = tier.baseCost * Math.pow(CONFIG.COST_GROWTH_FACTOR, safeLevel);
  return Math.round(rawCost * 100) / 100;
}

/**
 * Menghitung ulang nilai perClick berdasarkan tingkat seluruh peningkatan.
 */
export function recalculatePerClick() {
  let total = CONFIG.BASE_PER_CLICK;
  CONFIG.UPGRADE_TIERS.forEach(function (tier) {
    const lvl = Number(state.upgrades[tier.id]) || 0;
    total += lvl * tier.clickBonus;
  });
  return Math.round(total * 100) / 100;
}

/**
 * Menghitung ulang nilai pendapatan pasif per detik berdasarkan tingkat peningkatan.
 */
export function recalculatePerSecond() {
  let total = 0;
  CONFIG.UPGRADE_TIERS.forEach(function (tier) {
    const lvl = Number(state.upgrades[tier.id]) || 0;
    total += lvl * (tier.passiveBonus || 0);
  });
  return Math.round(total * 100) / 100;
}
/**
 * Menampilkan modal sambutan pendapatan luring jika bonus > 0.
 */
export function showOfflineWelcomeModal(bonus, seconds) {
  if (!offlineModal || !offlineModalTitle || bonus <= 0) return;
  offlineModalTitle.textContent =
    'Selamat datang kembali, +$' + formatCurrencyValue(bonus);
  if (offlineModalDesc) {
    const minutes = Math.max(1, Math.round(seconds / CONFIG.SECONDS_PER_MINUTE));
    offlineModalDesc.textContent =
      'Penghasilan pasif dikumpulkan selama ' +
      (seconds < CONFIG.SECONDS_PER_MINUTE ? seconds + ' detik' : minutes + ' menit') +
      ' Anda tidak aktif (efisiensi 50%, batas maksimal 2 jam).';
  }
  offlineModal.hidden = false;
}
/**
 * Menurunkan ID pemain netral (#BT-YYYY-XXXX) secara deterministik dari startDate.
 */
export function derivePlayerCardId(timestamp) {
  const safeTs = Number.isFinite(timestamp) && timestamp > 0 ? Math.floor(timestamp) : Date.now();
  const year = new Date(safeTs).getFullYear();
  const hash = ((safeTs * CONFIG.PLAYER_ID_HASH_PRIME) >>> 0) % CONFIG.PLAYER_ID_MODULO;
  const digits = String(hash).padStart(CONFIG.PLAYER_ID_PAD_LENGTH, '0');
  return '#BT-' + year + '-' + digits;
}

/**
 * Memperbarui label ID pemain pada Kartu Utama.
 */
export function renderBankCardIdentity() {
  if (playerCardId) {
    playerCardId.textContent = derivePlayerCardId(state.startDate);
  }
}
/**
 * Merender daftar tingkat peningkatan beserta status tombol beli.
 */
export function renderUpgrades() {
  if (!upgradesList) return;

  if (upgradesList.childElementCount === 0) {
    CONFIG.UPGRADE_TIERS.forEach(function (tier) {
      const row = document.createElement('div');
      row.className = 'upgrade-item';
      row.setAttribute('data-tier-row', tier.id);

      const info = document.createElement('div');
      info.className = 'upgrade-item__info';

      const top = document.createElement('div');
      top.className = 'upgrade-item__top';

      const nameEl = document.createElement('span');
      nameEl.className = 'upgrade-item__name';
      nameEl.textContent = tier.name;

      const levelEl = document.createElement('span');
      levelEl.className = 'upgrade-item__level';
      levelEl.setAttribute('data-upgrade-level', tier.id);

      top.appendChild(nameEl);
      top.appendChild(levelEl);

      const effectEl = document.createElement('span');
      effectEl.className = 'upgrade-item__effect';
      effectEl.setAttribute('data-upgrade-effect', tier.id);

      info.appendChild(top);
      info.appendChild(effectEl);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'upgrade-btn';
      btn.setAttribute('data-upgrade-id', tier.id);

      row.appendChild(info);
      row.appendChild(btn);
      upgradesList.appendChild(row);
    });
  }

  CONFIG.UPGRADE_TIERS.forEach(function (tier) {
    const level = Number(state.upgrades[tier.id]) || 0;
    const cost = getUpgradeCost(tier, level);
    const canAfford = state.balance >= cost;

    const levelEl = upgradesList.querySelector('[data-upgrade-level="' + tier.id + '"]');
    const effectEl = upgradesList.querySelector('[data-upgrade-effect="' + tier.id + '"]');
    const btn = upgradesList.querySelector('[data-upgrade-id="' + tier.id + '"]');

    if (levelEl) {
      levelEl.textContent = 'Tk. ' + level;
    }
    if (effectEl) {
      const passivePart =
        tier.passiveBonus > 0
          ? ' • +$' + formatCurrencyValue(tier.passiveBonus) + '/dtk'
          : '';
      effectEl.textContent =
        '+$' + formatCurrencyValue(tier.clickBonus) + ' per ketuk' + passivePart;
    }
    if (btn) {
      btn.textContent = 'Beli $ ' + formatCurrencyValue(cost);
      btn.title = 'Biaya: $ ' + formatFullCurrencyValue(cost);
      btn.disabled = !canAfford;
    }
  });

  updateDynamicBadges();
}

/**
 * Menghitung berapa banyak peningkatan yang saat ini terjangkau oleh saldo.
 */
export function countAffordableUpgrades() {
  let count = 0;
  CONFIG.UPGRADE_TIERS.forEach(function (tier) {
    const level = Number(state.upgrades[tier.id]) || 0;
    const cost = getUpgradeCost(tier, level);
    if (state.balance >= cost) {
      count += 1;
    }
  });
  return count;
}

/**
 * Memperbarui lencana dinamis berdasarkan kondisi nyata (peningkatan terjangkau).
 */
export function updateDynamicBadges() {
  const affordable = countAffordableUpgrades();
  if (state.activeTab === 'Earnings') {
    runtime.acknowledgedAffordableCount = affordable;
    setTabBadge('Earnings', 0);
  } else if (affordable > runtime.acknowledgedAffordableCount) {
    setTabBadge('Earnings', affordable);
  } else if (affordable === 0) {
    runtime.acknowledgedAffordableCount = 0;
    setTabBadge('Earnings', 0);
  }
}

/**
 * Membeli peningkatan berdasarkan id jika saldo mencukupi.
 */
export function buyUpgrade(upgradeId) {
  const tier = CONFIG.UPGRADE_TIERS.find(function (item) {
    return item.id === upgradeId;
  });
  if (!tier) return false;

  const currentLevel = Number(state.upgrades[tier.id]) || 0;
  const cost = getUpgradeCost(tier, currentLevel);
  if (state.balance < cost) {
    return false;
  }

  state.balance = Math.round((state.balance - cost) * 100) / 100;
  state.upgrades[tier.id] = currentLevel + 1;
  state.perClick = recalculatePerClick();
  state.perSecond = recalculatePerSecond();
  writeSaveImmediate();
  renderStats();
  renderUpgrades();
  announceScreenReader(
    tier.name +
      ' naik ke tingkat ' +
      state.upgrades[tier.id] +
      '. Saldo $ ' +
      formatCurrencyValue(state.balance),
    true
  );
  return true;
}

/**
 * Memperbarui teks saldo utama, nominal per ketuk/detik, dan ukuran font adaptif.
 */
export function renderStats() {
  if (!balanceDisplay || !previewBalanceDisplay || !perClickDisplay) return;

  const formattedBalance = '$ ' + formatCurrencyValue(state.balance);
  const fullBalance = '$ ' + formatFullCurrencyValue(state.balance);
  const passiveLabel =
    state.perSecond > 0 ? ' • +$ ' + formatCurrencyValue(state.perSecond) + '/dtk' : '';
  const passiveFull =
    state.perSecond > 0 ? ' dan +$ ' + formatFullCurrencyValue(state.perSecond) + ' per detik' : '';
  const formattedPerClick = '$ ' + formatCurrencyValue(state.perClick) + ' per ketuk' + passiveLabel;
  const fullPerClick = '$ ' + formatFullCurrencyValue(state.perClick) + ' per ketuk' + passiveFull;

  balanceDisplay.textContent = formattedBalance;
  balanceDisplay.title = fullBalance;
  balanceDisplay.setAttribute('aria-label', 'Saldo: ' + fullBalance);

  previewBalanceDisplay.textContent = formattedBalance;
  previewBalanceDisplay.title = fullBalance;
  previewBalanceDisplay.setAttribute('aria-label', 'Saldo tersimpan: ' + fullBalance);

  perClickDisplay.textContent = formattedPerClick;
  perClickDisplay.title = fullPerClick;
  perClickDisplay.setAttribute('aria-label', fullPerClick);

  if (investWalletBalance) {
    investWalletBalance.textContent = formatRupiahCompact(state.balance);
  }
  if (detailWalletBalance) {
    detailWalletBalance.textContent = formatRupiahCompact(state.balance);
  }

  // Sesuaikan ukuran huruf bila saldo panjang
  balanceDisplay.classList.remove(
    'bank-card__balance--compact',
    'bank-card__balance--ultra-compact'
  );
  if (formattedBalance.length > CONFIG.BALANCE_ULTRA_COMPACT_LEN) {
    balanceDisplay.classList.add('bank-card__balance--ultra-compact');
  } else if (formattedBalance.length > CONFIG.BALANCE_COMPACT_LEN) {
    balanceDisplay.classList.add('bank-card__balance--compact');
  }
}

/**
 * Memicu kilau spekular ringan pada kartu eksekutif tanpa memaksa reflow berat saat ketuk cepat.
 */
export function triggerCardGlint() {
  if (!bankCard || prefersReducedMotion() || cardGlintTimer) return;
  bankCard.classList.add('is-glinting');
  cardGlintTimer = root.setTimeout(function () {
    bankCard.classList.remove('is-glinting');
    cardGlintTimer = null;
  }, CONFIG.CARD_GLINT_DURATION_MS);
}

/**
 * Memberikan animasi memantul halus pada ikon tangan SVG.
 */
export function triggerHandPulse() {
  if (!tapHandIcon || prefersReducedMotion()) return;
  tapHandIcon.classList.remove('is-pulsing');
  void tapHandIcon.offsetWidth;
  tapHandIcon.classList.add('is-pulsing');

  if (pulseCleanupTimer) {
    root.clearTimeout(pulseCleanupTimer);
  }
  pulseCleanupTimer = root.setTimeout(function () {
    tapHandIcon.classList.remove('is-pulsing');
  }, CONFIG.PULSE_DURATION_MS);
}

/**
 * Memunculkan efek riak sentuh & teks angka melayang di titik sentuhan jari.
 */
export function spawnFloatingFeedback(clientX, clientY, amount) {
  if (!tapArea || !tapEffectsLayer || prefersReducedMotion()) return;
  const rect = tapArea.getBoundingClientRect();

  let localX = rect.width / CONFIG.TAP_CENTER_DIVISOR;
  let localY = rect.height / CONFIG.TAP_CENTER_DIVISOR - CONFIG.TAP_FALLBACK_OFFSET_Y;

  if (typeof clientX === 'number' && typeof clientY === 'number' && (clientX !== 0 || clientY !== 0)) {
    localX = clientX - rect.left;
    localY = clientY - rect.top;
  }

  const clampedX = Math.max(
    CONFIG.TAP_CLAMP_PAD_X,
    Math.min(rect.width - CONFIG.TAP_CLAMP_PAD_X, localX)
  );
  const clampedY = Math.max(
    CONFIG.TAP_CLAMP_MIN_Y,
    Math.min(rect.height - CONFIG.TAP_CLAMP_MAX_PAD_Y, localY)
  );

  const jitterX = (Math.random() - CONFIG.TAP_JITTER_CENTER) * CONFIG.TAP_JITTER_SPREAD_PX;

  while (tapEffectsLayer.childElementCount >= CONFIG.MAX_PARTICLES) {
    if (tapEffectsLayer.firstElementChild) {
      tapEffectsLayer.firstElementChild.remove();
    } else {
      break;
    }
  }

  const rippleEl = document.createElement('span');
  rippleEl.className = 'tap-ripple';
  rippleEl.style.left = clampedX + 'px';
  rippleEl.style.top = clampedY + 'px';
  rippleEl.addEventListener('animationend', function () {
    rippleEl.remove();
  });

  const floatEl = document.createElement('span');
  floatEl.className = 'floating-earning';
  floatEl.textContent = '+$' + formatCurrencyValue(amount);
  floatEl.style.left = (clampedX + jitterX) + 'px';
  floatEl.style.top = clampedY + 'px';
  floatEl.addEventListener('animationend', function () {
    floatEl.remove();
  });

  tapEffectsLayer.appendChild(rippleEl);
  tapEffectsLayer.appendChild(floatEl);
}

/**
 * Memproses satu ketukan pada area ketuk interaktif.
 */
export function processTap(clientX, clientY) {
  state.balance = Math.round((state.balance + state.perClick) * 100) / 100;
  state.totalTaps += 1;
  state.totalEarned = Math.round((state.totalEarned + state.perClick) * 100) / 100;
  saveState();
  renderStats();
  renderUpgrades();
  if (state.activeTab === 'Profile') {
    if (typeof runtime.refreshProfileStats === 'function') { runtime.refreshProfileStats(); }
  }
  triggerHaptic();
  playCoinBlip();
  triggerCardGlint();
  triggerHandPulse();
  spawnFloatingFeedback(clientX, clientY, state.perClick);
  checkMilestones();
  announceScreenReader('', false);
}

/**
 * Mendaftarkan seluruh event listener khusus tab Pendapatan.
 */
export function bindEarningsEvents() {
  if (!hasDOM) return;

  if (tapArea) {
    tapArea.addEventListener(
      'touchstart',
      function (event) {
        if (event.cancelable) {
          event.preventDefault();
        }
        lastTouchTimestamp = Date.now();

        const touches = event.changedTouches;
        for (let i = 0; i < touches.length; i += 1) {
          processTap(touches[i].clientX, touches[i].clientY);
        }
      },
      { passive: false }
    );

    tapArea.addEventListener('click', function (event) {
      if (Date.now() - lastTouchTimestamp < CONFIG.TOUCH_DEDUP_MS) {
        return;
      }
      processTap(event.clientX, event.clientY);
    });

    tapArea.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        processTap(0, 0);
      }
    });

    tapArea.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });
  }

  document.addEventListener('dblclick', function (event) {
    event.preventDefault();
  });

  if (upgradesList) {
    upgradesList.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-upgrade-id]');
      if (!btn || btn.disabled) return;
      const upgradeId = btn.getAttribute('data-upgrade-id');
      if (upgradeId) {
        buyUpgrade(upgradeId);
      }
    });
  }

  if (closeOfflineModalBtn && offlineModal) {
    closeOfflineModalBtn.addEventListener('click', function () {
      offlineModal.hidden = true;
    });
  }
  if (offlineModal) {
    offlineModal.addEventListener('click', function (event) {
      if (event.target === offlineModal) {
        offlineModal.hidden = true;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !offlineModal.hidden) {
        offlineModal.hidden = true;
      }
    });
  }
}
