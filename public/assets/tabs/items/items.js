/* ==========================================================================
   BUSINESS TYCOON TAP - TAB TOKO / ITEMS
   Saat ini menampilkan pratinjau modul "Dalam Pengembangan" (CONFIG.MODULE_PREVIEWS.Items).
   Seluruh logika & gaya spesifik tab Toko ke depannya diletakkan di folder ini.
   ========================================================================== */

import { renderModulePreview } from '../../core/preview.js';

/**
 * Merender tab Toko (pratinjau modul koleksi aset).
 */
export function renderItemsTab() {
  renderModulePreview('Items');
}
