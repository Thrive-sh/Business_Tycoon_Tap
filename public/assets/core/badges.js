/* ==========================================================================
   BUSINESS TYCOON TAP - LENCANA (BADGE) NAVIGASI BAWAH
   ========================================================================== */

import { hasDOM } from './dom.js';

const navBadges = {
  Earnings: hasDOM ? document.querySelector('[data-nav-badge="Earnings"]') : null,
  Profile: hasDOM ? document.querySelector('[data-nav-badge="Profile"]') : null
};

/**
 * Mengatur tampilan lencana notifikasi dinamis pada tab navigasi.
 */
export function setTabBadge(tabName, count) {
  const badgeEl = navBadges[tabName];
  if (!badgeEl) return;

  if (count > 0) {
    badgeEl.textContent = String(count);
    badgeEl.hidden = false;
    badgeEl.style.display = 'flex';
  } else {
    badgeEl.textContent = '';
    badgeEl.hidden = true;
    badgeEl.style.display = 'none';
  }
}
