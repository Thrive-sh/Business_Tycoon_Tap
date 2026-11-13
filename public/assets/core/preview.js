/* ==========================================================================
   BUSINESS TYCOON TAP - LAYAR PRATINJAU MODUL (bersama untuk Toko & host Profil)
   ========================================================================== */

import { CONFIG } from './config.js';
import { hasDOM, getEl } from './dom.js';
import { state, runtime } from './state.js';
import { formatCurrencyValue } from './format.js';

const previewScreen = getEl('preview-screen');
const previewTitle = getEl('preview-title');
const previewDescription = getEl('preview-description');
const previewIconContainer = getEl('preview-icon-container');
const previewBalanceDisplay = getEl('preview-balance-display');
const previewProgressLabel = getEl('preview-progress-label');
const previewProgressbar = getEl('preview-progressbar');
const previewProgressFill = getEl('preview-progress-fill');
const previewFeaturesList = getEl('preview-features-list');
const profilePanel = getEl('profile-panel');
const backToEarningsBtn = getEl('back-to-earnings-btn');
const openRoadmapBtn = getEl('open-roadmap-btn');
const closeRoadmapBtn = getEl('close-roadmap-btn');
const roadmapModal = getEl('roadmap-modal');

/**
 * Menyembunyikan layar pratinjau modul (dipanggil saat pindah tab).
 */
export function hideModulePreview() {
  if (previewScreen) {
    previewScreen.hidden = true;
    previewScreen.classList.remove('screen--active');
  }
}

/**
 * Menampilkan modul "Dalam Pengembangan" berikut panel profil (khusus tab Profil).
 */
export function renderModulePreview(tabName) {
  const moduleInfo = CONFIG.MODULE_PREVIEWS[tabName] || CONFIG.MODULE_PREVIEWS.Business;
  if (previewTitle) {
    previewTitle.textContent = (moduleInfo.label || tabName) + ' — Dalam Pengembangan';
  }
  if (previewDescription) {
    previewDescription.textContent = moduleInfo.description;
  }
  if (previewIconContainer) {
    previewIconContainer.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' +
      moduleInfo.iconId +
      '"></use></svg>';
  }
  if (previewBalanceDisplay) {
    previewBalanceDisplay.textContent = '$ ' + formatCurrencyValue(state.balance);
  }

  if (previewProgressLabel && previewProgressFill && previewProgressbar) {
    previewProgressLabel.textContent = moduleInfo.progress + '%';
    previewProgressFill.style.width = moduleInfo.progress + '%';
    previewProgressbar.setAttribute('aria-valuenow', String(moduleInfo.progress));
  }

  if (previewFeaturesList) {
    previewFeaturesList.innerHTML = '';
    (moduleInfo.features || []).forEach(function (featText) {
      const li = document.createElement('li');
      li.textContent = featText;
      previewFeaturesList.appendChild(li);
    });
  }

  if (profilePanel) {
    profilePanel.hidden = tabName !== 'Profile';
    if (tabName === 'Profile' && typeof runtime.refreshProfileStats === 'function') {
      runtime.refreshProfileStats();
    }
  }

  if (previewScreen) {
    previewScreen.hidden = false;
    previewScreen.classList.add('screen--active');
  }
}

/**
 * Mendaftarkan interaksi layar pratinjau (kembali & modal peta jalan).
 */
export function bindPreviewEvents(onBackToEarnings) {
  if (!hasDOM) return;

  if (backToEarningsBtn && typeof onBackToEarnings === 'function') {
    backToEarningsBtn.addEventListener('click', function () {
      onBackToEarnings();
    });
  }
  if (openRoadmapBtn && roadmapModal) {
    openRoadmapBtn.addEventListener('click', function () {
      roadmapModal.hidden = false;
    });
  }
  if (closeRoadmapBtn && roadmapModal) {
    closeRoadmapBtn.addEventListener('click', function () {
      roadmapModal.hidden = true;
    });
  }
  if (roadmapModal) {
    roadmapModal.addEventListener('click', function (event) {
      if (event.target === roadmapModal) {
        roadmapModal.hidden = true;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !roadmapModal.hidden) {
        roadmapModal.hidden = true;
      }
    });
  }
}
