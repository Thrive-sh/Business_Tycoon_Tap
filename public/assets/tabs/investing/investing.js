/* ==========================================================================
   BUSINESS TYCOON TAP - TAB INVESTASI (Saham / Properti / Kripto / Forex & Detail Aset)
   ========================================================================== */

import { CONFIG } from '../../core/config.js';
import { ASSETS } from '../../core/assets.js';
import { hasDOM, root, getEl } from '../../core/dom.js';
import {
  state,
  runtime,
  getAssetById,
  getCurrentAssetPrice,
  saveState,
  saveMarketPricesThrottled
} from '../../core/state.js';
import {
  formatCurrencyValue,
  formatFullCurrencyValue,
  formatRupiahCompact,
  formatRupiahFull,
  formatSignedPercent,
  formatIntegerID,
  formatTimeHHMM
} from '../../core/format.js';
import { triggerHaptic, playCoinBlip, showToast } from '../../core/feedback.js';
import { checkMilestones } from '../../core/milestones.js';
import { renderStats, renderUpgrades } from '../earnings/earnings.js';

// Referensi elemen DOM (null di lingkungan pengujian Node)
const investingScreen = getEl('investing-screen');
const assetDetailScreen = getEl('asset-detail-screen');
const portfolioScreen = getEl('portfolio-screen');
const investWalletBalance = getEl('invest-wallet-balance');
const investSummaryLabel = getEl('invest-summary-label');
const investSummaryTotal = getEl('invest-summary-total');
const investSummaryPnl = getEl('invest-summary-pnl');
const investSummaryYield = getEl('invest-summary-yield');
const investAssetList = getEl('invest-asset-list');
const investSummaryCard = getEl('invest-summary-card');
const portfolioBackBtn = getEl('portfolio-back-btn');
const portfolioTotalValue = getEl('portfolio-total-value');
const portfolioTotalPnl = getEl('portfolio-total-pnl');
const portfolioHoldingsCount = getEl('portfolio-holdings-count');
const portfolioHoldingsList = getEl('portfolio-holdings-list');
const investSubtabs = hasDOM ? Array.from(document.querySelectorAll('.invest-subtab')) : [];
const assetDetailBackBtn = getEl('asset-detail-back-btn');
const detailAssetName = getEl('detail-asset-name');
const detailAssetCategory = getEl('detail-asset-category');
const detailWalletBalance = getEl('detail-wallet-balance');
const detailMarketPriceHero = getEl('detail-market-price-hero');
const detailPriceChange = getEl('detail-price-change');
const assetPriceCanvas = getEl('asset-price-canvas');
const detailOwnedUnits = getEl('detail-owned-units');
const detailMarketPrice = getEl('detail-market-price');
const detailAvgEntry = getEl('detail-avg-entry');
const detailMarketValue = getEl('detail-market-value');
const detailTotalCost = getEl('detail-total-cost');
const detailUnrealizedPnl = getEl('detail-unrealized-pnl');
const detailYieldRow = getEl('detail-yield-row');
const detailHourlyYield = getEl('detail-hourly-yield');
const detailQtyChips = hasDOM ? Array.from(document.querySelectorAll('[data-trade-qty]')) : [];
const detailTradeNotice = getEl('detail-trade-notice');
const detailSellBtn = getEl('detail-sell-btn');
const detailBuyBtn = getEl('detail-buy-btn');
const roadmapModal = getEl('roadmap-modal');
const resetModal = getEl('reset-modal');
const offlineModal = getEl('offline-modal');

/**
 * Menginisialisasi harga pasar & menghasilkan 60 titik riwayat mundur dengan random walk.
 */
export function initMarketData() {
  const now = Date.now();
  ASSETS.forEach(function (asset) {
    const savedPrice = Number(state.lastPrices[asset.id]);
    const minAllowed = asset.initialPrice * CONFIG.MIN_PRICE_FACTOR;
    const basePrice =
      Number.isFinite(savedPrice) && savedPrice >= minAllowed
        ? savedPrice
        : asset.initialPrice;

    const roundedBase = Math.round(basePrice * 100) / 100;
    state.lastPrices[asset.id] = roundedBase;

    const points = new Array(CONFIG.HISTORY_MAX);
    let cursorPrice = roundedBase;
    points[CONFIG.HISTORY_MAX - 1] = { ts: now, price: cursorPrice };

    for (let k = CONFIG.HISTORY_MAX - 1; k > 0; k -= 1) {
      const step =
        (Math.random() - CONFIG.RANDOM_WALK_CENTER) *
        CONFIG.RANDOM_WALK_SPREAD *
        asset.volatility;
      const denom = 1 + step;
      const prevRaw = denom > CONFIG.MIN_PRICE_FACTOR ? cursorPrice / denom : cursorPrice;
      const clampedPrev = Math.max(prevRaw, minAllowed);
      cursorPrice =
        Math.round((Number.isFinite(clampedPrev) ? clampedPrev : roundedBase) * 100) / 100;
      points[k - 1] = {
        ts: now - (CONFIG.HISTORY_MAX - k) * CONFIG.PRICE_TICK_MS,
        price: cursorPrice
      };
    }

    state.priceHistory[asset.id] = points;
  });
}

/**
 * Menghitung total estimasi pendapatan per jam dari seluruh aset berimbal hasil (Saham & Properti).
 */
export function getTotalInvestmentHourlyYield() {
  let total = 0;
  ASSETS.forEach(function (asset) {
    if (asset.yieldRate <= 0) return;
    const holding = state.holdings[asset.id];
    const units = holding && Number.isFinite(Number(holding.units)) ? Number(holding.units) : 0;
    if (units <= 0) return;
    const val = units * getCurrentAssetPrice(asset.id) * asset.yieldRate;
    if (Number.isFinite(val) && val > 0) {
      total += val;
    }
  });
  return Number.isFinite(total) ? total : 0;
}

/**
 * Satu siklus pergerakan harga pasar (setiap 3 detik) menggunakan random walk terukur.
 */
export function runPriceTick() {
  const now = Date.now();
  ASSETS.forEach(function (asset) {
    const current = getCurrentAssetPrice(asset.id);
    const minAllowed = asset.initialPrice * CONFIG.MIN_PRICE_FACTOR;
    const change =
      (Math.random() - CONFIG.RANDOM_WALK_CENTER) *
      CONFIG.RANDOM_WALK_SPREAD *
      asset.volatility;
    const candidate = current * (1 + change);
    const safeCandidate = Number.isFinite(candidate) ? candidate : current;
    const nextPrice = Math.round(Math.max(safeCandidate, minAllowed) * 100) / 100;

    state.lastPrices[asset.id] = nextPrice;

    if (!Array.isArray(state.priceHistory[asset.id])) {
      state.priceHistory[asset.id] = [];
    }
    state.priceHistory[asset.id].push({ ts: now, price: nextPrice });
    while (state.priceHistory[asset.id].length > CONFIG.HISTORY_MAX) {
      state.priceHistory[asset.id].shift();
    }
  });

  if (hasDOM && document.visibilityState === 'visible' && state.activeTab === 'Investing') {
    if (state.selectedAssetId) {
      renderAssetDetailScreen();
    } else {
      renderInvestingScreen();
    }
  }

  saveMarketPricesThrottled();
}

/**
 * Menghitung persentase perubahan harga aset terhadap titik awal riwayat.
 */
export function getAssetChangePercent(assetId) {
  const history = state.priceHistory[assetId];
  if (!Array.isArray(history) || history.length === 0) {
    return 0;
  }
  const firstPrice = Number(history[0].price);
  const currentPrice = getCurrentAssetPrice(assetId);
  if (!Number.isFinite(firstPrice) || firstPrice <= 0 || !Number.isFinite(currentPrice)) {
    return 0;
  }
  const pct = ((currentPrice - firstPrice) / firstPrice) * 100;
  return Number.isFinite(pct) ? pct : 0;
}

/**
 * Menghitung ringkasan nilai portofolio, P&L, dan pendapatan/jam untuk satu kategori.
 */
export function getCategorySummary(category) {
  let totalValue = 0;
  let totalCost = 0;
  let hourlyYield = 0;

  ASSETS.forEach(function (asset) {
    if (asset.category !== category) return;
    const holding = state.holdings[asset.id];
    const units = holding && Number.isFinite(Number(holding.units)) ? Number(holding.units) : 0;
    const avgEntry =
      holding && Number.isFinite(Number(holding.avgEntry)) ? Number(holding.avgEntry) : 0;
    if (units <= 0) return;

    const marketPrice = getCurrentAssetPrice(asset.id);
    const positionValue = units * marketPrice;
    const positionCost = units * avgEntry;

    if (Number.isFinite(positionValue)) {
      totalValue += positionValue;
    }
    if (Number.isFinite(positionCost)) {
      totalCost += positionCost;
    }
    if (asset.yieldRate > 0 && Number.isFinite(positionValue)) {
      hourlyYield += positionValue * asset.yieldRate;
    }
  });

  const pnlValue = totalCost > 0 ? totalValue - totalCost : 0;
  const rawPct = totalCost > 0 ? (pnlValue / totalCost) * 100 : 0;
  const pnlPct = Number.isFinite(rawPct) ? rawPct : 0;

  return {
    totalValue: Number.isFinite(totalValue) ? totalValue : 0,
    totalCost: Number.isFinite(totalCost) ? totalCost : 0,
    pnlValue: Number.isFinite(pnlValue) ? pnlValue : 0,
    pnlPct: pnlPct,
    hourlyYield: Number.isFinite(hourlyYield) ? hourlyYield : 0
  };
}

/**
 * Membuka layar portofolio yang berisi seluruh aset milik pemain.
 */
export function openPortfolio() {
  if (!investingScreen || !portfolioScreen) return;
  investingScreen.hidden = true;
  investingScreen.classList.remove('screen--active');
  portfolioScreen.hidden = false;
  portfolioScreen.classList.add('screen--active');
  renderPortfolio();
}

/**
 * Menampilkan ringkasan nilai dan daftar aset yang benar-benar dimiliki pemain.
 */
export function renderPortfolio() {
  if (!portfolioHoldingsList) return;
  const holdings = [];
  let totalValue = 0;
  let totalCost = 0;

  ASSETS.forEach(function (asset) {
    const holding = state.holdings[asset.id];
    const units = holding && Number.isFinite(Number(holding.units)) ? Number(holding.units) : 0;
    if (units <= 0) return;
    const avgEntry = holding && Number.isFinite(Number(holding.avgEntry)) ? Number(holding.avgEntry) : 0;
    const marketPrice = getCurrentAssetPrice(asset.id);
    const value = units * marketPrice;
    const cost = units * avgEntry;
    totalValue += value;
    totalCost += cost;
    holdings.push({ asset: asset, units: units, value: value, pnl: value - cost });
  });

  const pnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  if (portfolioTotalValue) portfolioTotalValue.textContent = formatRupiahCompact(totalValue);
  if (portfolioTotalPnl) {
    portfolioTotalPnl.textContent = (pnl > 0 ? '+' : '') + formatRupiahCompact(pnl) + ' (' + formatSignedPercent(pnlPct) + ')';
    portfolioTotalPnl.classList.toggle('pnl--positive', pnl >= 0);
    portfolioTotalPnl.classList.toggle('pnl--negative', pnl < 0);
  }
  if (portfolioHoldingsCount) portfolioHoldingsCount.textContent = holdings.length + ' aset';
  portfolioHoldingsList.innerHTML = '';

  if (holdings.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'portfolio-empty';
    empty.textContent = 'Belum ada saham atau aset yang dimiliki. Beli aset dari daftar Investasi untuk mulai membangun portofolio.';
    portfolioHoldingsList.appendChild(empty);
    return;
  }

  holdings.forEach(function (item) {
    const card = document.createElement('article');
    card.className = 'portfolio-holding-card';
    const main = document.createElement('div');
    main.className = 'portfolio-holding-card__main';
    const name = document.createElement('strong');
    name.className = 'portfolio-holding-card__name';
    name.textContent = item.asset.name;
    const meta = document.createElement('span');
    meta.className = 'portfolio-holding-card__meta';
    meta.textContent = item.asset.category + ' · ' + formatIntegerID(item.units) + ' ' + item.asset.unitLabel;
    main.appendChild(name);
    main.appendChild(meta);
    const value = document.createElement('div');
    value.className = 'portfolio-holding-card__value';
    const market = document.createElement('strong');
    market.textContent = formatRupiahCompact(item.value);
    const profit = document.createElement('span');
    profit.className = item.pnl >= 0 ? 'pnl--positive' : 'pnl--negative';
    profit.textContent = (item.pnl > 0 ? '+' : '') + formatRupiahCompact(item.pnl);
    value.appendChild(market);
    value.appendChild(profit);
    card.appendChild(main);
    card.appendChild(value);
    portfolioHoldingsList.appendChild(card);
  });
}
/**
 * Merender layar utama Investasi (4 sub-tab, kartu ringkasan, dan daftar aset).
 */
export function renderInvestingScreen() {
  if (!investingScreen) return;
  const cat = state.activeInvestCategory;

  if (investWalletBalance) {
    investWalletBalance.textContent = formatRupiahCompact(state.balance);
    investWalletBalance.title = formatRupiahFull(state.balance);
  }

  investSubtabs.forEach(function (btn) {
    const isSelected = btn.getAttribute('data-invest-cat') === cat;
    btn.classList.toggle('invest-subtab--active', isSelected);
    btn.setAttribute('aria-pressed', String(isSelected));
    if (isSelected) {
      btn.setAttribute('aria-current', 'true');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  const summary = getCategorySummary(cat);
  if (investSummaryLabel) {
    investSummaryLabel.textContent =
      CONFIG.INVEST_SUMMARY_LABELS[cat] || CONFIG.INVEST_SUMMARY_LABELS.Saham;
  }
  if (investSummaryTotal) {
    investSummaryTotal.textContent = formatRupiahCompact(summary.totalValue);
    investSummaryTotal.title = formatRupiahFull(summary.totalValue);
  }
  if (investSummaryPnl) {
    const isPositive = summary.pnlValue >= 0;
    const pnlPrefix = summary.pnlValue > 0 ? '+' : '';
    investSummaryPnl.textContent =
      pnlPrefix +
      formatRupiahCompact(summary.pnlValue) +
      ' (' +
      formatSignedPercent(summary.pnlPct) +
      ') sepanjang waktu';
    investSummaryPnl.classList.toggle('pnl--positive', isPositive);
    investSummaryPnl.classList.toggle('pnl--negative', !isPositive);
  }
  if (investSummaryYield) {
    if (cat === 'Saham' || cat === 'Properti') {
      investSummaryYield.textContent = formatRupiahCompact(summary.hourlyYield) + '/jam';
      investSummaryYield.title = formatRupiahFull(summary.hourlyYield) + ' per jam';
    } else {
      investSummaryYield.textContent = '—';
      investSummaryYield.removeAttribute('title');
    }
  }

  if (!investAssetList) return;
  const categoryAssets = ASSETS.filter(function (a) {
    return a.category === cat;
  });

  if (
    runtime.renderedListCategory !== cat ||
    investAssetList.childElementCount !== categoryAssets.length
  ) {
    investAssetList.innerHTML = '';
    categoryAssets.forEach(function (asset) {
      const cardBtn = document.createElement('button');
      cardBtn.type = 'button';
      cardBtn.className = 'asset-card';
      cardBtn.setAttribute('data-asset-id', asset.id);

      const left = document.createElement('div');
      left.className = 'asset-card__left';

      const avatar = document.createElement('span');
      avatar.className = 'asset-card__avatar';
      if (asset.iconId) {
        avatar.classList.add('asset-card__avatar--logo');
        avatar.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' +
          asset.iconId +
          '"></use></svg>';
      } else {
        avatar.style.backgroundColor = asset.color;
        avatar.textContent = asset.symbol;
      }

      const meta = document.createElement('div');
      meta.className = 'asset-card__meta';

      const nameEl = document.createElement('span');
      nameEl.className = 'asset-card__name';
      nameEl.textContent = asset.name;

      const ownedEl = document.createElement('span');
      ownedEl.className = 'asset-card__owned';

      meta.appendChild(nameEl);
      meta.appendChild(ownedEl);
      left.appendChild(avatar);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'asset-card__right';

      const priceEl = document.createElement('span');
      priceEl.className = 'asset-card__price';

      const changeEl = document.createElement('span');
      changeEl.className = 'asset-card__change';

      right.appendChild(priceEl);
      right.appendChild(changeEl);

      cardBtn.appendChild(left);
      cardBtn.appendChild(right);
      investAssetList.appendChild(cardBtn);
    });
    runtime.renderedListCategory = cat;
  }

  categoryAssets.forEach(function (asset, idx) {
    const cardBtn = investAssetList.children[idx];
    if (!cardBtn) return;
    const holding = state.holdings[asset.id];
    const units = holding && Number.isFinite(Number(holding.units)) ? Number(holding.units) : 0;
    const currentPrice = getCurrentAssetPrice(asset.id);
    const changePct = getAssetChangePercent(asset.id);
    const isUp = changePct >= 0;

    const ownedEl = cardBtn.querySelector('.asset-card__owned');
    const priceEl = cardBtn.querySelector('.asset-card__price');
    const changeEl = cardBtn.querySelector('.asset-card__change');

    if (ownedEl) {
      ownedEl.textContent = formatIntegerID(units) + ' ' + asset.unitLabel;
    }
    if (priceEl) {
      priceEl.textContent = formatRupiahCompact(currentPrice);
      priceEl.title = formatRupiahFull(currentPrice);
    }
    if (changeEl) {
      changeEl.className = 'asset-card__change ' + (isUp ? 'pnl--positive' : 'pnl--negative');
      changeEl.textContent = formatSignedPercent(changePct);
    }
  });
}
export function resolveTradeQuantities(currentPrice, ownedUnits) {
  const safePrice = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : 0;
  const safeOwned = Number.isFinite(ownedUnits) && ownedUnits > 0 ? Math.floor(ownedUnits) : 0;
  const maxAffordable =
    safePrice > 0 && Number.isFinite(state.balance) && state.balance >= safePrice
      ? Math.floor(state.balance / safePrice)
      : 0;

  if (state.selectedQtyMode === 'max') {
    return {
      buyQty: maxAffordable,
      sellQty: safeOwned,
      maxAffordable: maxAffordable
    };
  }

  const parsed = Number(state.selectedQtyMode);
  const fixedQty = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
  return {
    buyQty: fixedQty,
    sellQty: fixedQty,
    maxAffordable: maxAffordable
  };
}

/**
 * Menggambar grafik riwayat harga aset di Canvas 2D (DPR-scaled, mulus, tanpa library luar).
 */
export function renderAssetPriceChart(asset) {
  if (!assetPriceCanvas || typeof assetPriceCanvas.getContext !== 'function') return;
  const ctx = assetPriceCanvas.getContext('2d');
  if (!ctx) return;

  const rect = assetPriceCanvas.getBoundingClientRect();
  const cssWidth = rect && rect.width > 0 ? rect.width : CONFIG.CHART_FALLBACK_WIDTH_PX;
  const cssHeight = CONFIG.CHART_CSS_HEIGHT_PX;
  const dpr =
    Number.isFinite(root.devicePixelRatio) && root.devicePixelRatio > 0
      ? root.devicePixelRatio
      : 1;

  const targetW = Math.round(cssWidth * dpr);
  const targetH = Math.round(cssHeight * dpr);
  if (assetPriceCanvas.width !== targetW || assetPriceCanvas.height !== targetH) {
    assetPriceCanvas.width = targetW;
    assetPriceCanvas.height = targetH;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const rawHistory = Array.isArray(state.priceHistory[asset.id])
    ? state.priceHistory[asset.id]
    : [];
  const fallbackNow = Date.now();
  const fallbackPrice = getCurrentAssetPrice(asset.id);
  const points = rawHistory.filter(function (pt) {
    return pt && Number.isFinite(pt.price) && pt.price > 0;
  });
  if (points.length === 0) {
    points.push(
      { ts: fallbackNow - CONFIG.PRICE_TICK_MS, price: fallbackPrice },
      { ts: fallbackNow, price: fallbackPrice }
    );
  } else if (points.length === 1) {
    points.unshift({ ts: points[0].ts - CONFIG.PRICE_TICK_MS, price: points[0].price });
  }

  let minPrice = points[0].price;
  let maxPrice = points[0].price;
  points.forEach(function (pt) {
    if (pt.price < minPrice) minPrice = pt.price;
    if (pt.price > maxPrice) maxPrice = pt.price;
  });

  const displayMin = minPrice;
  const displayMax = maxPrice;

  if (maxPrice <= minPrice) {
    const flatSpread = Math.max(minPrice * CONFIG.CHART_FLAT_SPREAD_RATIO, 1);
    minPrice = Math.max(0, minPrice - flatSpread);
    maxPrice = maxPrice + flatSpread;
  } else {
    const range = maxPrice - minPrice;
    minPrice = Math.max(0, minPrice - range * CONFIG.CHART_RANGE_PAD_RATIO);
    maxPrice = maxPrice + range * CONFIG.CHART_RANGE_PAD_RATIO;
  }
  const safeSpan = maxPrice - minPrice > 0 ? maxPrice - minPrice : 1;

  const plotLeft = CONFIG.CHART_PAD_LEFT;
  const plotRight = cssWidth - CONFIG.CHART_PAD_RIGHT;
  const plotTop = CONFIG.CHART_PAD_TOP;
  const plotBottom = cssHeight - CONFIG.CHART_PAD_BOTTOM;
  const plotW = Math.max(1, plotRight - plotLeft);
  const plotH = Math.max(1, plotBottom - plotTop);

  // Grid horizontal tipis (atas, tengah, bawah)
  ctx.strokeStyle = CONFIG.CHART_GRID_COLOR;
  ctx.lineWidth = 1;
  const midGridY = (plotTop + plotBottom) / CONFIG.CHART_MID_DIVISOR;
  [plotTop, midGridY, plotBottom].forEach(function (gy) {
    ctx.beginPath();
    ctx.moveTo(plotLeft, gy);
    ctx.lineTo(plotRight, gy);
    ctx.stroke();
  });

  const coords = points.map(function (pt, idx) {
    const x = plotLeft + (idx / (points.length - 1)) * plotW;
    const y = plotBottom - ((pt.price - minPrice) / safeSpan) * plotH;
    return { x: x, y: y };
  });

  // Helper untuk membangun kurva mulus (quadratic midpoint)
  function traceSmoothCurve() {
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i += 1) {
      const midX = (coords[i].x + coords[i + 1].x) / CONFIG.CHART_MID_DIVISOR;
      const midY = (coords[i].y + coords[i + 1].y) / CONFIG.CHART_MID_DIVISOR;
      if (i === 0) {
        ctx.lineTo(midX, midY);
      } else {
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, midX, midY);
      }
    }
    const last = coords[coords.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  // Area gradient orange muda di bawah garis
  const lastCoord = coords[coords.length - 1];
  ctx.beginPath();
  traceSmoothCurve();
  ctx.lineTo(lastCoord.x, plotBottom);
  ctx.lineTo(coords[0].x, plotBottom);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
  grad.addColorStop(0, CONFIG.CHART_FILL_TOP);
  grad.addColorStop(1, CONFIG.CHART_FILL_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fill();

  // Garis utama #F97316 tebal 2px
  ctx.beginPath();
  traceSmoothCurve();
  ctx.strokeStyle = CONFIG.CHART_STROKE_COLOR;
  ctx.lineWidth = CONFIG.CHART_LINE_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Titik harga terakhir di ujung kanan
  ctx.beginPath();
  ctx.arc(lastCoord.x, lastCoord.y, CONFIG.CHART_DOT_OUTER_RADIUS, 0, Math.PI * CONFIG.CHART_MID_DIVISOR);
  ctx.fillStyle = CONFIG.CHART_DOT_BG_COLOR;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lastCoord.x, lastCoord.y, CONFIG.CHART_DOT_INNER_RADIUS, 0, Math.PI * CONFIG.CHART_MID_DIVISOR);
  ctx.fillStyle = CONFIG.CHART_STROKE_COLOR;
  ctx.fill();

  // Label Y-axis (Maks & Min) + X-axis (HH:MM)
  ctx.font = CONFIG.CHART_FONT;
  ctx.fillStyle = CONFIG.CHART_LABEL_COLOR;

  ctx.textAlign = 'left';
  ctx.fillText('Maks ' + formatRupiahCompact(displayMax), plotLeft, CONFIG.CHART_LABEL_OFFSET_TOP_Y);
  ctx.textAlign = 'right';
  ctx.fillText('Min ' + formatRupiahCompact(displayMin), plotRight, CONFIG.CHART_LABEL_OFFSET_TOP_Y);

  const firstTs = points[0].ts;
  const midTs = points[Math.floor(points.length / CONFIG.CHART_MID_DIVISOR)].ts;
  const lastTs = points[points.length - 1].ts;
  const xLabelY = plotBottom + CONFIG.CHART_X_LABEL_OFFSET_Y;

  ctx.textAlign = 'left';
  ctx.fillText(formatTimeHHMM(firstTs), plotLeft, xLabelY);
  ctx.textAlign = 'center';
  ctx.fillText(formatTimeHHMM(midTs), plotLeft + plotW / CONFIG.CHART_MID_DIVISOR, xLabelY);
  ctx.textAlign = 'right';
  ctx.fillText(formatTimeHHMM(lastTs), plotRight, xLabelY);
}
/**
 * Merender informasi layar detail aset yang dipilih beserta grafik Canvas 2D.
 */
export function renderAssetDetailScreen() {
  if (!assetDetailScreen || !state.selectedAssetId) return;
  const asset = getAssetById(state.selectedAssetId);
  if (!asset) return;

  const currentPrice = getCurrentAssetPrice(asset.id);
  const changePct = getAssetChangePercent(asset.id);
  const holding = state.holdings[asset.id];
  const units = holding && Number.isFinite(Number(holding.units)) ? Number(holding.units) : 0;
  const avgEntry =
    holding && Number.isFinite(Number(holding.avgEntry)) ? Number(holding.avgEntry) : 0;
  const totalCost = units > 0 ? units * avgEntry : 0;
  const marketValue = units > 0 ? units * currentPrice : 0;
  const unrealizedValue = units > 0 ? marketValue - totalCost : 0;
  const rawPct = totalCost > 0 ? (unrealizedValue / totalCost) * 100 : 0;
  const unrealizedPct = Number.isFinite(rawPct) ? rawPct : 0;
  const assetHourlyYield =
    asset.yieldRate > 0 && units > 0 ? marketValue * asset.yieldRate : 0;

  if (detailAssetName) detailAssetName.textContent = asset.name;
  if (detailAssetCategory) detailAssetCategory.textContent = asset.category;
  if (detailWalletBalance) {
    detailWalletBalance.textContent = formatRupiahCompact(state.balance);
    detailWalletBalance.title = formatRupiahFull(state.balance);
  }
  if (detailMarketPriceHero) {
    detailMarketPriceHero.textContent = formatRupiahCompact(currentPrice);
    detailMarketPriceHero.title = formatRupiahFull(currentPrice);
  }
  if (detailPriceChange) {
    const up = changePct >= 0;
    detailPriceChange.textContent = formatSignedPercent(changePct);
    detailPriceChange.classList.toggle('pnl--positive', up);
    detailPriceChange.classList.toggle('pnl--negative', !up);
  }
  if (detailOwnedUnits) {
    detailOwnedUnits.textContent = formatIntegerID(units) + ' ' + asset.unitLabel;
  }
  if (detailMarketPrice) {
    detailMarketPrice.textContent = formatRupiahFull(currentPrice);
  }
  if (detailAvgEntry) {
    detailAvgEntry.textContent = units > 0 ? formatRupiahFull(avgEntry) : '—';
  }
  if (detailMarketValue) {
    detailMarketValue.textContent = formatRupiahFull(marketValue);
  }
  if (detailTotalCost) {
    detailTotalCost.textContent = formatRupiahFull(totalCost);
  }
  if (detailUnrealizedPnl) {
    const pos = unrealizedValue >= 0;
    const prefix = unrealizedValue > 0 ? '+' : '';
    detailUnrealizedPnl.textContent =
      prefix +
      formatRupiahCompact(unrealizedValue) +
      ' (' +
      formatSignedPercent(unrealizedPct) +
      ')';
    detailUnrealizedPnl.classList.toggle('pnl--positive', pos);
    detailUnrealizedPnl.classList.toggle('pnl--negative', !pos);
  }
  if (detailYieldRow && detailHourlyYield) {
    if (asset.yieldRate > 0) {
      detailYieldRow.hidden = false;
      detailHourlyYield.textContent = formatRupiahCompact(assetHourlyYield) + '/jam';
      detailHourlyYield.title = formatRupiahFull(assetHourlyYield) + ' per jam';
    } else {
      detailYieldRow.hidden = true;
    }
  }

  // Status chip jumlah [1] [10] [100] [Maks] & tombol BELI / JUAL
  detailQtyChips.forEach(function (chip) {
    const active = chip.getAttribute('data-trade-qty') === state.selectedQtyMode;
    chip.classList.toggle('qty-chip--active', active);
    chip.setAttribute('aria-pressed', String(active));
  });

  const trade = resolveTradeQuantities(currentPrice, units);
  const estBuyCost = trade.buyQty * currentPrice;
  const canBuy =
    trade.buyQty >= 1 &&
    Number.isFinite(estBuyCost) &&
    estBuyCost > 0 &&
    state.balance >= estBuyCost;
  const canSell = units > 0 && trade.sellQty >= 1 && trade.sellQty <= units;

  if (detailBuyBtn) {
    detailBuyBtn.disabled = !canBuy;
  }
  if (detailSellBtn) {
    detailSellBtn.disabled = !canSell;
  }
  if (detailTradeNotice) {
    if (!canBuy) {
      detailTradeNotice.textContent = 'Saldo tidak cukup';
      detailTradeNotice.classList.add('detail-trade-notice--error');
    } else if (state.selectedQtyMode === 'max') {
      detailTradeNotice.textContent =
        'Maks beli: ' +
        formatIntegerID(trade.buyQty) +
        ' ' +
        asset.unitLabel +
        ' (' +
        formatRupiahCompact(estBuyCost) +
        ')';
      detailTradeNotice.classList.remove('detail-trade-notice--error');
    } else {
      detailTradeNotice.textContent =
        formatIntegerID(trade.buyQty) +
        ' ' +
        asset.unitLabel +
        ' · ' +
        formatRupiahCompact(estBuyCost);
      detailTradeNotice.classList.remove('detail-trade-notice--error');
    }
  }

  renderAssetPriceChart(asset);
}
/**
 * Membeli aset secara atomik menggunakan saldo dompet pemain.
 * Mengembalikan true jika transaksi berhasil, false jika dibatalkan.
 */
export function buyAsset(assetId, requestedQty) {
  const asset = getAssetById(assetId);
  if (!asset) return false;

  const currentPrice = getCurrentAssetPrice(asset.id);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return false;

  const existing = state.holdings[asset.id];
  const oldUnits =
    existing && Number.isFinite(Number(existing.units)) && Number(existing.units) > 0
      ? Math.floor(Number(existing.units))
      : 0;
  const oldAvg =
    existing && Number.isFinite(Number(existing.avgEntry)) && Number(existing.avgEntry) >= 0
      ? Number(existing.avgEntry)
      : 0;

  const qty =
    requestedQty !== undefined
      ? Math.floor(Number(requestedQty))
      : resolveTradeQuantities(currentPrice, oldUnits).buyQty;

  if (!Number.isFinite(qty) || qty < 1) return false;

  const cost = Math.round(qty * currentPrice * 100) / 100;
  if (!Number.isFinite(cost) || cost <= 0 || state.balance < cost) {
    return false;
  }

  const newUnits = oldUnits + qty;
  const rawNewAvg = (oldUnits * oldAvg + qty * currentPrice) / newUnits;
  const newAvg = Number.isFinite(rawNewAvg) ? Math.round(rawNewAvg * 100) / 100 : currentPrice;

  state.balance = Math.max(0, Math.round((state.balance - cost) * 100) / 100);
  state.holdings[asset.id] = {
    units: newUnits,
    avgEntry: newAvg
  };

  saveState();
  renderStats();
  renderUpgrades();
  renderInvestingScreen();
  if (state.selectedAssetId === asset.id) {
    renderAssetDetailScreen();
  }
  triggerHaptic();
  playCoinBlip();
  showToast('Transaksi Investasi', 'Beli ' + formatIntegerID(qty) + ' ' + asset.name + ' berhasil');
  return true;
}

/**
 * Menjual aset yang dimiliki secara atomik dan menambahkannya ke saldo dompet pemain.
 * Mengembalikan true jika transaksi berhasil, false jika dibatalkan.
 */
export function sellAsset(assetId, requestedQty) {
  const asset = getAssetById(assetId);
  if (!asset) return false;

  const existing = state.holdings[asset.id];
  const oldUnits =
    existing && Number.isFinite(Number(existing.units)) && Number(existing.units) > 0
      ? Math.floor(Number(existing.units))
      : 0;
  const oldAvg =
    existing && Number.isFinite(Number(existing.avgEntry)) && Number(existing.avgEntry) >= 0
      ? Number(existing.avgEntry)
      : 0;

  if (oldUnits < 1) return false;

  const currentPrice = getCurrentAssetPrice(asset.id);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return false;

  const qty =
    requestedQty !== undefined
      ? Math.floor(Number(requestedQty))
      : resolveTradeQuantities(currentPrice, oldUnits).sellQty;

  if (!Number.isFinite(qty) || qty < 1 || qty > oldUnits) {
    return false;
  }

  const proceeds = Math.round(qty * currentPrice * 100) / 100;
  if (!Number.isFinite(proceeds) || proceeds < 0) return false;

  const realizedProfit = qty * (currentPrice - oldAvg);
  state.balance = Math.round((state.balance + proceeds) * 100) / 100;
  if (Number.isFinite(realizedProfit) && realizedProfit > 0) {
    state.totalEarned = Math.round((state.totalEarned + realizedProfit) * 100) / 100;
  }

  const remainingUnits = oldUnits - qty;
  if (remainingUnits <= 0) {
    delete state.holdings[asset.id];
  } else {
    state.holdings[asset.id] = {
      units: remainingUnits,
      avgEntry: oldAvg
    };
  }

  saveState();
  renderStats();
  renderUpgrades();
  renderInvestingScreen();
  if (state.selectedAssetId === asset.id) {
    renderAssetDetailScreen();
  }
  checkMilestones();
  triggerHaptic();
  playCoinBlip();
  showToast('Transaksi Investasi', 'Jual ' + formatIntegerID(qty) + ' ' + asset.name + ' berhasil');
  return true;
}

/**
 */
export function openAssetDetail(assetId) {
  const asset = getAssetById(assetId);
  if (!asset || !assetDetailScreen || !investingScreen) return;
  state.selectedAssetId = asset.id;
  state.selectedQtyMode = CONFIG.DEFAULT_TRADE_QTY;
  investingScreen.hidden = true;
  investingScreen.classList.remove('screen--active');
  assetDetailScreen.hidden = false;
  assetDetailScreen.classList.add('screen--active');
  renderAssetDetailScreen();
}

/**
 * Menutup layar detail aset dan kembali ke daftar investasi.
 */
export function closeAssetDetail() {
  state.selectedAssetId = null;
  if (portfolioScreen) {
    portfolioScreen.hidden = true;
    portfolioScreen.classList.remove('screen--active');
  }
  if (assetDetailScreen) {
    assetDetailScreen.hidden = true;
    assetDetailScreen.classList.remove('screen--active');
  }
  if (investingScreen && state.activeTab === 'Investing') {
    investingScreen.hidden = false;
    investingScreen.classList.add('screen--active');
    renderInvestingScreen();
  }
}

/**
 * Mendaftarkan seluruh event listener khusus tab Investasi (termasuk portofolio & detail aset).
 */
export function bindInvestingEvents() {
  if (!hasDOM) return;

  // Sub-tab kategori investasi (Saham, Properti, Kripto, Forex)
  investSubtabs.forEach(function (subBtn) {
    subBtn.addEventListener('click', function () {
      const cat = subBtn.getAttribute('data-invest-cat');
      if (cat) {
        state.activeInvestCategory = cat;
        renderInvestingScreen();
      }
    });
  });

  if (investSummaryCard) {
    investSummaryCard.addEventListener('click', openPortfolio);
    investSummaryCard.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPortfolio();
      }
    });
  }

  if (portfolioBackBtn) {
    portfolioBackBtn.addEventListener('click', function () {
      if (portfolioScreen) {
        portfolioScreen.hidden = true;
        portfolioScreen.classList.remove('screen--active');
      }
      if (investingScreen && state.activeTab === 'Investing') {
        investingScreen.hidden = false;
        investingScreen.classList.add('screen--active');
        renderInvestingScreen();
      }
    });
  }

  // Klik kartu aset pada daftar investasi -> buka layar detail
  if (investAssetList) {
    investAssetList.addEventListener('click', function (event) {
      const card = event.target.closest('[data-asset-id]');
      if (!card) return;
      const assetId = card.getAttribute('data-asset-id');
      if (assetId) {
        openAssetDetail(assetId);
      }
    });
  }

  if (assetDetailBackBtn) {
    assetDetailBackBtn.addEventListener('click', function () {
      closeAssetDetail();
    });
  }

  detailQtyChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      const mode = chip.getAttribute('data-trade-qty');
      if (mode) {
        state.selectedQtyMode = mode;
        renderAssetDetailScreen();
      }
    });
  });

  if (detailBuyBtn) {
    detailBuyBtn.addEventListener('click', function () {
      if (!detailBuyBtn.disabled && state.selectedAssetId) {
        buyAsset(state.selectedAssetId);
      }
    });
  }

  if (detailSellBtn) {
    detailSellBtn.addEventListener('click', function () {
      if (!detailSellBtn.disabled && state.selectedAssetId) {
        sellAsset(state.selectedAssetId);
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (
      event.key === 'Escape' &&
      assetDetailScreen &&
      !assetDetailScreen.hidden &&
      (!roadmapModal || roadmapModal.hidden) &&
      (!resetModal || resetModal.hidden) &&
      (!offlineModal || offlineModal.hidden)
    ) {
      closeAssetDetail();
    }
  });

  if (root.addEventListener) {
    root.addEventListener('resize', function () {
      if (assetDetailScreen && !assetDetailScreen.hidden && state.selectedAssetId) {
        const currentAsset = getAssetById(state.selectedAssetId);
        if (currentAsset) {
          renderAssetPriceChart(currentAsset);
        }
      }
    });
  }
}
