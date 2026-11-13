/* ==========================================================================
   BUSINESS TYCOON TAP - TAB PROFIL (Statistik, Pengaturan & Reset Data)
   ========================================================================== */

import { CONFIG } from '../../core/config.js';
import { hasDOM, getEl } from '../../core/dom.js';
import { state, runtime, getStorage, writeSaveImmediate } from '../../core/state.js';
import {
  formatCurrencyValue,
  formatFullCurrencyValue,
  formatIntegerID,
  formatDateShort
} from '../../core/format.js';
import { playCoinBlip, triggerHaptic } from '../../core/feedback.js';
import { setTabBadge } from '../../core/badges.js';
import {
  renderBankCardIdentity,
  renderStats,
  renderUpgrades
} from '../earnings/earnings.js';
import { initMarketData, renderInvestingScreen } from '../investing/investing.js';

const statTotalTaps = getEl('stat-total-taps');
const statTotalEarned = getEl('stat-total-earned');
const statStartDate = getEl('stat-start-date');
const statMilestones = getEl('stat-milestones');
const toggleSoundBtn = getEl('toggle-sound-btn');
const toggleSoundText = getEl('toggle-sound-text');
const toggleHapticBtn = getEl('toggle-haptic-btn');
const toggleHapticText = getEl('toggle-haptic-text');
const openResetModalBtn = getEl('open-reset-modal-btn');
const resetModal = getEl('reset-modal');
const resetConfirmCheckbox = getEl('reset-confirm-checkbox');
const cancelResetBtn = getEl('cancel-reset-btn');
const confirmResetBtn = getEl('confirm-reset-btn');
const offlineModal = getEl('offline-modal');
const milestoneToast = getEl('milestone-toast');

/**
 * Merender statistik dasar & pengaturan preferensi pemain pada tab Profil.
 */
export function renderProfileStats() {
  if (statTotalTaps) {
    statTotalTaps.textContent = formatIntegerID(state.totalTaps);
  }
  if (statTotalEarned) {
    const fullEarned = '$ ' + formatFullCurrencyValue(state.totalEarned);
    statTotalEarned.textContent = '$ ' + formatCurrencyValue(state.totalEarned);
    statTotalEarned.title = fullEarned;
    statTotalEarned.setAttribute('aria-label', fullEarned);
  }
  if (statStartDate) {
    statStartDate.textContent = formatDateShort(state.startDate);
  }
  if (statMilestones) {
    let unlockedCount = 0;
    CONFIG.MILESTONES.forEach(function (m) {
      if (state.milestones[m.id]) unlockedCount += 1;
    });
    statMilestones.textContent = unlockedCount + ' / ' + CONFIG.MILESTONES.length;
  }
  if (toggleSoundBtn && toggleSoundText) {
    toggleSoundBtn.setAttribute('aria-checked', String(Boolean(state.settings.sound)));
    toggleSoundText.textContent = state.settings.sound ? 'AKTIF' : 'MATI';
  }
  if (toggleHapticBtn && toggleHapticText) {
    toggleHapticBtn.setAttribute('aria-checked', String(Boolean(state.settings.haptic)));
    toggleHapticText.textContent = state.settings.haptic ? 'AKTIF' : 'MATI';
  }
}

/**
 * Mereset seluruh data permainan ke nilai awal.
 */
export function resetAllData() {
  const now = Date.now();
  state.version = CONFIG.SAVE_SCHEMA_VERSION;
  state.balance = 0.0;
  state.perClick = CONFIG.BASE_PER_CLICK;
  state.perSecond = 0.0;
  state.totalTaps = 0;
  state.totalEarned = 0.0;
  CONFIG.UPGRADE_TIERS.forEach(function (tier) {
    state.upgrades[tier.id] = 0;
  });
  state.holdings = {};
  state.lastPrices = {};
  state.priceHistory = {};
  runtime.investmentYieldCarry = 0;
  runtime.renderedListCategory = null;
  initMarketData();
  state.settings = { sound: true, haptic: true };
  state.milestones = {};
  state.startDate = now;
  state.lastSeen = now;
  runtime.acknowledgedAffordableCount = 0;
  runtime.unseenMilestonesCount = 0;
  if (offlineModal) {
    offlineModal.hidden = true;
  }
  if (milestoneToast) {
    milestoneToast.hidden = true;
  }

  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(CONFIG.STORAGE_KEY);
    } catch (error) {
      // Abaikan jika penyimpanan dibatasi
    }
  }
  writeSaveImmediate();
  setTabBadge('Earnings', 0);
  setTabBadge('Profile', 0);
  renderBankCardIdentity();
  renderStats();
  renderUpgrades();
  renderProfileStats();
  renderInvestingScreen();
}

// Daftarkan hook agar modul core (pratinjau & milestone) dapat me-render ulang
// statistik Profil tanpa impor melingkar antar tab.
runtime.refreshProfileStats = renderProfileStats;

/**
 * Mendaftarkan event listener khusus tab Profil (preferensi & reset data).
 */
export function bindProfileEvents() {
  if (!hasDOM) return;

  if (toggleSoundBtn) {
    toggleSoundBtn.addEventListener('click', function () {
      state.settings.sound = !state.settings.sound;
      renderProfileStats();
      writeSaveImmediate();
      if (state.settings.sound) {
        playCoinBlip();
      }
    });
  }
  if (toggleHapticBtn) {
    toggleHapticBtn.addEventListener('click', function () {
      state.settings.haptic = !state.settings.haptic;
      renderProfileStats();
      writeSaveImmediate();
      if (state.settings.haptic) {
        triggerHaptic();
      }
    });
  }

  if (openResetModalBtn && resetModal && resetConfirmCheckbox && confirmResetBtn) {
    openResetModalBtn.addEventListener('click', function () {
      resetConfirmCheckbox.checked = false;
      confirmResetBtn.disabled = true;
      resetModal.hidden = false;
    });

    resetConfirmCheckbox.addEventListener('change', function () {
      confirmResetBtn.disabled = !resetConfirmCheckbox.checked;
    });

    confirmResetBtn.addEventListener('click', function () {
      if (!resetConfirmCheckbox.checked) return;
      resetAllData();
      resetModal.hidden = true;
    });
  }
  if (cancelResetBtn && resetModal) {
    cancelResetBtn.addEventListener('click', function () {
      resetModal.hidden = true;
    });
  }
  if (resetModal) {
    resetModal.addEventListener('click', function (event) {
      if (event.target === resetModal) {
        resetModal.hidden = true;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !resetModal.hidden) {
        resetModal.hidden = true;
      }
    });
  }
}
