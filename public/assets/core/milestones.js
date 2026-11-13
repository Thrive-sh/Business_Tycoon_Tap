/* ==========================================================================
 BUSINESS TYCOON TAP - PENCAPAIAN (MILESTONE) & LENCANA PROFIL
 ========================================================================== */

import { CONFIG } from './config.js';
import { state, runtime, writeSaveImmediate } from './state.js';
import { showMilestoneToast } from './feedback.js';
import { setTabBadge } from './badges.js';

export function checkMilestones() {
  let newlyUnlocked = null;
  CONFIG.MILESTONES.forEach(function (m) {
    if (state.milestones[m.id]) return;
    const reached =
      m.type === 'taps'
        ? state.totalTaps >= m.threshold
        : Math.max(state.totalEarned, state.balance) >= m.threshold;
    if (reached) {
      state.milestones[m.id] = true;
      newlyUnlocked = m;
      if (state.activeTab !== 'Profile') {
        runtime.unseenMilestonesCount += 1;
        setTabBadge('Profile', runtime.unseenMilestonesCount);
      }
    }
  });

  if (newlyUnlocked) {
    writeSaveImmediate();
    showMilestoneToast(newlyUnlocked.title);
    if (state.activeTab === 'Profile') {
      if (typeof runtime.refreshProfileStats === 'function') { runtime.refreshProfileStats(); }
    }
  }
}

