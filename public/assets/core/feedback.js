/* ==========================================================================
 BUSINESS TYCOON TAP - UMPAN BALIK: GETAR, AUDIO, TOAST & PENGUMUMAN LAYAR
 ========================================================================== */

import { CONFIG } from './config.js';
import { root, getEl } from './dom.js';
import { state } from './state.js';
import { formatCurrencyValue } from './format.js';

const milestoneToast = getEl('milestone-toast');
const milestoneToastTitle = getEl('milestone-toast-title');
const srAnnouncer = getEl('sr-announcer');

let toastHideTimer = null;
let srAnnounceTimer = null;
let audioCtx = null;

export function triggerHaptic() {
  if (!state.settings.haptic) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(CONFIG.HAPTIC_DURATION_MS);
    }
  } catch (error) {
    // Abaikan jika perangkat tidak mendukung getar
  }
}

/**
 * Memainkan bunyi blip koin sintetis via Web Audio API tanpa berkas eksternal.
 */
export function playCoinBlip() {
  if (!state.settings.sound) return;
  const AudioContextClass = root.AudioContext || root.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    const nowTime = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(CONFIG.SOUND_FREQ_START_HZ, nowTime);
    osc.frequency.exponentialRampToValueAtTime(
      CONFIG.SOUND_FREQ_END_HZ,
      nowTime + CONFIG.SOUND_DURATION_SEC
    );

    gain.gain.setValueAtTime(CONFIG.SOUND_GAIN_START, nowTime);
    gain.gain.exponentialRampToValueAtTime(
      CONFIG.SOUND_GAIN_END,
      nowTime + CONFIG.SOUND_DURATION_SEC
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(nowTime);
    osc.stop(nowTime + CONFIG.SOUND_DURATION_SEC);
  } catch (error) {
    // Abaikan jika konteks audio diblokir peramban
  }
}

/**
 * Menampilkan toast notifikasi singkat di atas navigasi bawah.
 */
export function showToast(label, title) {
  if (!milestoneToast || !milestoneToastTitle) return;
  const labelEl = milestoneToast.querySelector('.milestone-toast__label');
  if (labelEl) {
    labelEl.textContent = label;
  }
  milestoneToastTitle.textContent = title;
  milestoneToast.hidden = false;
  announceScreenReader(label + ': ' + title, true);

  if (toastHideTimer) {
    root.clearTimeout(toastHideTimer);
  }
  toastHideTimer = root.setTimeout(function () {
    milestoneToast.hidden = true;
    toastHideTimer = null;
  }, CONFIG.TOAST_DURATION_MS);
}

/**
 * Menampilkan toast pencapaian baru selama beberapa detik.
 */
export function showMilestoneToast(title) {
  showToast('Pencapaian Baru', title);
}

/**
 * Mengecek dan mencatat pencapaian baru agar hanya muncul satu kali.
 */
export function prefersReducedMotion() {
  return Boolean(
    root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Mengumumkan pesan ke pembaca layar secara ter-throttle atau seketika saat peristiwa penting.
 */
export function announceScreenReader(message, immediate) {
  if (!srAnnouncer) return;
  if (immediate) {
    if (srAnnounceTimer) {
      root.clearTimeout(srAnnounceTimer);
      srAnnounceTimer = null;
    }
    srAnnouncer.textContent = message;
    return;
  }
  if (srAnnounceTimer) return;
  srAnnounceTimer = root.setTimeout(function () {
    srAnnounceTimer = null;
    srAnnouncer.textContent = 'Saldo saat ini $ ' + formatCurrencyValue(state.balance);
  }, CONFIG.SR_ANNOUNCE_THROTTLE_MS);
}

/**
 * Memformat angka penuh ke pemisah ribuan titik (.) dan desimal koma (,).
 */
