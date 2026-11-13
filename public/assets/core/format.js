/* ==========================================================================
   BUSINESS TYCOON TAP - FORMAT ANGKA & MATA UANG (murni, tanpa efek samping)
   ========================================================================== */

import { CONFIG } from './config.js';

export function formatFullCurrencyValue(amount) {
  const safeNumber = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  const fixed = safeNumber.toFixed(CONFIG.CURRENCY_DECIMALS);
  const parts = fixed.split('.');
  const integerWithDots = parts[0].replace(CONFIG.THOUSANDS_GROUP_REGEX, '.');
  return integerWithDots + ',' + parts[1];
}

/**
 * Memformat angka besar secara ringkas bergaya Indonesia (rb, jt, M, T).
 */
export function formatCompact(amount) {
  const safeNumber = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  if (safeNumber < CONFIG.COMPACT_THRESHOLD) {
    return formatFullCurrencyValue(safeNumber);
  }

  const units = CONFIG.COMPACT_UNITS;
  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    if (safeNumber >= unit.threshold) {
      const scaled = safeNumber / unit.threshold;
      if (scaled >= CONFIG.COMPACT_THRESHOLD && i > 0) {
        const upperUnit = units[i - 1];
        const upperScaled = safeNumber / upperUnit.threshold;
        const upperFormatted = upperScaled
          .toFixed(CONFIG.CURRENCY_DECIMALS)
          .replace(/\.?0+$/, '')
          .replace('.', ',');
        return upperFormatted + ' ' + upperUnit.suffix;
      }
      const formatted = scaled
        .toFixed(CONFIG.CURRENCY_DECIMALS)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
      return formatted + ' ' + unit.suffix;
    }
  }

  return formatFullCurrencyValue(safeNumber);
}

/**
 * Memformat nominal mata uang untuk tampilan UI.
 */
export function formatCurrencyValue(amount) {
  return formatCompact(amount);
}

/**
 * Memformat nominal Rupiah ringkas ("Rp25 rb", "Rp1,6 M") dengan guard Number.isFinite.
 */
export function formatRupiahCompact(amount) {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const prefix = Number.isFinite(amount) && amount < 0 ? '-Rp' : 'Rp';
  return prefix + formatCompact(safe);
}

/**
 * Memformat nominal Rupiah penuh ("Rp1.234.567,89") dengan guard Number.isFinite.
 */
export function formatRupiahFull(amount) {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const prefix = Number.isFinite(amount) && amount < 0 ? '-Rp' : 'Rp';
  return prefix + formatFullCurrencyValue(safe);
}

/**
 * Memformat persentase bertanda ("+1,25%" / "-0,40%") yang selalu finite 2 desimal.
 */
export function formatSignedPercent(pct) {
  const safe = Number.isFinite(pct) ? pct : 0;
  const sign = safe >= 0 ? '+' : '-';
  const absStr = Math.abs(safe).toFixed(CONFIG.CURRENCY_DECIMALS).replace('.', ',');
  return sign + absStr + '%';
}

/**
 * Menginisialisasi harga pasar & menghasilkan 60 titik riwayat mundur dengan random walk.
 */
export function formatTimeHHMM(timestamp) {
  const d = new Date(Number.isFinite(timestamp) ? timestamp : Date.now());
  const hh = String(d.getHours()).padStart(CONFIG.DATE_PAD_LENGTH, '0');
  const mm = String(d.getMinutes()).padStart(CONFIG.DATE_PAD_LENGTH, '0');
  return hh + ':' + mm;
}

/**
 * Menghitung jumlah unit beli & jual berdasarkan chip aktif ('1', '10', '100', 'max').
 */
export function formatIntegerID(value) {
  const safeInt = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  return String(safeInt).replace(CONFIG.THOUSANDS_GROUP_REGEX, '.');
}

/**
 * Memformat timestamp menjadi tanggal singkat DD/MM/YYYY.
 */
export function formatDateShort(timestamp) {
  const d = new Date(Number.isFinite(timestamp) ? timestamp : Date.now());
  const day = String(d.getDate()).padStart(CONFIG.DATE_PAD_LENGTH, '0');
  const month = String(d.getMonth() + 1).padStart(CONFIG.DATE_PAD_LENGTH, '0');
  const year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

/**
 * Menurunkan ID pemain netral (#BT-YYYY-XXXX) secara deterministik dari startDate.
 */
