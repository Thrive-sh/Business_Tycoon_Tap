/* ==========================================================================
   BUSINESS TYCOON TAP - UTILITAS DOM & LINGKUNGAN (root / hasDOM / getEl)
   ========================================================================== */

export const root = typeof window !== 'undefined' ? window : globalThis;
export const hasDOM = typeof document !== 'undefined';

export function getEl(id) {
  return hasDOM ? document.getElementById(id) : null;
}
