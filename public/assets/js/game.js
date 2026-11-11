/* ==========================================================================
   BUSINESS TYCOON TAP - CORE GAME LOGIC & INVESTMENT MODULE (game.js)
   ========================================================================== */

(function () {
  'use strict';

  // Definisi 18 aset investasi fiktif & instrumen pasar (Saham, Properti, Kripto, Forex)
  const ASSETS = Object.freeze([
    // 1. Saham (yield dividen per jam)
    {
      id: 'teknonusa',
      name: 'TeknoNusa',
      category: 'Saham',
      initialPrice: 25000,
      volatility: 0.010,
      yieldRate: 0.004,
      color: '#EA580C',
      symbol: 'TN',
      unitLabel: 'pcs.'
    },
    {
      id: 'bankartha',
      name: 'BankArtha',
      category: 'Saham',
      initialPrice: 8500,
      volatility: 0.008,
      yieldRate: 0.003,
      color: '#D97706',
      symbol: 'BA',
      unitLabel: 'pcs.'
    },
    {
      id: 'energiku',
      name: 'EnergiKu',
      category: 'Saham',
      initialPrice: 12000,
      volatility: 0.012,
      yieldRate: 0.005,
      color: '#16A34A',
      symbol: 'EK',
      unitLabel: 'pcs.'
    },
    {
      id: 'pangansehat',
      name: 'PanganSehat',
      category: 'Saham',
      initialPrice: 5200,
      volatility: 0.007,
      yieldRate: 0.003,
      color: '#65A30D',
      symbol: 'PS',
      unitLabel: 'pcs.'
    },
    {
      id: 'mediakita',
      name: 'MediaKita',
      category: 'Saham',
      initialPrice: 3800,
      volatility: 0.015,
      yieldRate: 0.006,
      color: '#DB2777',
      symbol: 'MK',
      unitLabel: 'pcs.'
    },

    // 2. Properti (yield sewa per jam)
    {
      id: 'apt_sudirman',
      name: 'Apartemen Sudirman',
      category: 'Properti',
      initialPrice: 850000000,
      volatility: 0.004,
      yieldRate: 0.002,
      color: '#C2410C',
      symbol: 'AS',
      unitLabel: 'unit'
    },
    {
      id: 'ruko_kemang',
      name: 'Ruko Kemang',
      category: 'Properti',
      initialPrice: 1200000000,
      volatility: 0.005,
      yieldRate: 0.0025,
      color: '#B45309',
      symbol: 'RK',
      unitLabel: 'unit'
    },
    {
      id: 'villa_bali',
      name: 'Villa Bali',
      category: 'Properti',
      initialPrice: 2500000000,
      volatility: 0.006,
      yieldRate: 0.003,
      color: '#059669',
      symbol: 'VB',
      unitLabel: 'unit'
    },
    {
      id: 'tanah_ikn',
      name: 'Tanah IKN',
      category: 'Properti',
      initialPrice: 500000000,
      volatility: 0.003,
      yieldRate: 0.0015,
      color: '#CA8A04',
      symbol: 'TI',
      unitLabel: 'unit'
    },

    // 3. Kripto (tanpa yield, volatilitas tinggi)
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      category: 'Kripto',
      initialPrice: 1600000000,
      volatility: 0.030,
      yieldRate: 0,
      color: '#F97316',
      symbol: 'BTC',
      unitLabel: 'koin'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      category: 'Kripto',
      initialPrice: 55000000,
      volatility: 0.028,
      yieldRate: 0,
      color: '#7C3AED',
      symbol: 'ETH',
      unitLabel: 'koin'
    },
    {
      id: 'solana',
      name: 'Solana',
      category: 'Kripto',
      initialPrice: 2800000,
      volatility: 0.035,
      yieldRate: 0,
      color: '#9333EA',
      symbol: 'SOL',
      unitLabel: 'koin'
    },
    {
      id: 'dogecoin',
      name: 'DogeCoin',
      category: 'Kripto',
      initialPrice: 2500,
      volatility: 0.045,
      yieldRate: 0,
      color: '#D97706',
      symbol: 'DOGE',
      unitLabel: 'koin'
    },
    {
      id: 'ripplex',
      name: 'RippleX',
      category: 'Kripto',
      initialPrice: 9800,
      volatility: 0.032,
      yieldRate: 0,
      color: '#57534E',
      symbol: 'XRP',
      unitLabel: 'koin'
    },

    // 4. Forex (tanpa yield, volatilitas rendah)
    {
      id: 'usd_idr',
      name: 'USD/IDR',
      category: 'Forex',
      initialPrice: 16200,
      volatility: 0.002,
      yieldRate: 0,
      color: '#15803D',
      symbol: 'USD',
      unitLabel: 'unit'
    },
    {
      id: 'eur_usd',
      name: 'EUR/USD',
      category: 'Forex',
      initialPrice: 17500,
      volatility: 0.002,
      yieldRate: 0,
      color: '#B91C1C',
      symbol: 'EUR',
      unitLabel: 'unit'
    },
    {
      id: 'gbp_usd',
      name: 'GBP/USD',
      category: 'Forex',
      initialPrice: 20600,
      volatility: 0.0025,
      yieldRate: 0,
      color: '#9A3412',
      symbol: 'GBP',
      unitLabel: 'unit'
    },
    {
      id: 'jpy_usd',
      name: 'JPY/USD',
      category: 'Forex',
      initialPrice: 105,
      volatility: 0.002,
      yieldRate: 0,
      color: '#DC2626',
      symbol: 'JPY',
      unitLabel: 'unit'
    }
  ]);

  // Konfigurasi terpusat: seluruh konstanta & parameter permainan dikumpulkan di sini
  const CONFIG = Object.freeze({
    STORAGE_KEY: 'business_simulator_save_v1',
    SAVE_SCHEMA_VERSION: 2,
    TOUCH_DEDUP_MS: 500,
    SAVE_THROTTLE_MS: 500,
    PRICE_SAVE_THROTTLE_MS: 5000,
    PRICE_TICK_MS: 3000,
    HISTORY_MAX: 60,
    MIN_PRICE_FACTOR: 0.01,
    RANDOM_WALK_CENTER: 0.5,
    RANDOM_WALK_SPREAD: 2,
    SECONDS_PER_HOUR: 3600,
    SR_ANNOUNCE_THROTTLE_MS: 4000,
    PASSIVE_TICK_MS: 1000,
    MS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MAX_OFFLINE_SECONDS: 7200,
    OFFLINE_EFFICIENCY: 0.5,
    MAX_PARTICLES: 40,
    BASE_PER_CLICK: 1.0,
    COST_GROWTH_FACTOR: 1.15,
    CURRENCY_DECIMALS: 2,
    COMPACT_THRESHOLD: 1000,
    DATE_PAD_LENGTH: 2,
    PLAYER_ID_PAD_LENGTH: 4,
    PLAYER_ID_MODULO: 10000,
    PLAYER_ID_HASH_PRIME: 2654435761,
    HAPTIC_DURATION_MS: 10,
    SOUND_FREQ_START_HZ: 800,
    SOUND_FREQ_END_HZ: 1200,
    SOUND_DURATION_SEC: 0.06,
    SOUND_GAIN_START: 0.08,
    SOUND_GAIN_END: 0.001,
    TOAST_DURATION_MS: 3200,
    PULSE_DURATION_MS: 240,
    BALANCE_COMPACT_LEN: 14,
    BALANCE_ULTRA_COMPACT_LEN: 18,
    TAP_CENTER_DIVISOR: 2,
    TAP_FALLBACK_OFFSET_Y: 24,
    TAP_CLAMP_PAD_X: 46,
    TAP_CLAMP_MIN_Y: 28,
    TAP_CLAMP_MAX_PAD_Y: 24,
    TAP_JITTER_CENTER: 0.5,
    TAP_JITTER_SPREAD_PX: 12,
    CHART_CSS_HEIGHT_PX: 160,
    CHART_FALLBACK_WIDTH_PX: 320,
    CHART_LINE_WIDTH: 2,
    CHART_DOT_OUTER_RADIUS: 4.5,
    CHART_DOT_INNER_RADIUS: 2.5,
    CHART_PAD_TOP: 22,
    CHART_PAD_RIGHT: 12,
    CHART_PAD_BOTTOM: 22,
    CHART_PAD_LEFT: 12,
    CHART_MID_DIVISOR: 2,
    CHART_FLAT_SPREAD_RATIO: 0.01,
    CHART_RANGE_PAD_RATIO: 0.12,
    CHART_LABEL_OFFSET_TOP_Y: 13,
    CHART_LABEL_OFFSET_BOTTOM_Y: 6,
    CHART_X_LABEL_OFFSET_Y: 16,
    CHART_STROKE_COLOR: '#F97316',
    CHART_DOT_BG_COLOR: '#FFFFFF',
    CHART_FILL_TOP: 'rgba(249, 115, 22, 0.25)',
    CHART_FILL_BOTTOM: 'rgba(249, 115, 22, 0.0)',
    CHART_GRID_COLOR: 'rgba(249, 115, 22, 0.16)',
    CHART_LABEL_COLOR: '#78716C',
    CHART_FONT: '600 10px Inter, system-ui, -apple-system, sans-serif',
    DEFAULT_TRADE_QTY: '1',
    THOUSANDS_GROUP_REGEX: /\B(?=(\d{3})+(?!\d))/g,
    INVEST_SUMMARY_LABELS: {
      Saham: 'Total nilai saham',
      Properti: 'Total nilai properti',
      Kripto: 'Total nilai kriptocurrency',
      Forex: 'Total nilai forex'
    },
    COMPACT_UNITS: [
      { threshold: 1e12, suffix: 'T' },
      { threshold: 1e9, suffix: 'M' },
      { threshold: 1e6, suffix: 'jt' },
      { threshold: 1e3, suffix: 'rb' }
    ],
    UPGRADE_TIERS: [
      {
        id: 'gloves',
        name: 'Sarung Tangan',
        baseCost: 15,
        clickBonus: 1,
        passiveBonus: 0
      },
      {
        id: 'tap_machine',
        name: 'Mesin Ketuk',
        baseCost: 100,
        clickBonus: 5,
        passiveBonus: 0
      },
      {
        id: 'auto_team',
        name: 'Tim Otomatis',
        baseCost: 500,
        clickBonus: 25,
        passiveBonus: 10
      }
    ],
    MODULE_PREVIEWS: {
      Business: {
        label: 'Usaha',
        progress: 20,
        iconId: 'icon-business',
        description:
          'Sistem pendirian dan pengelolaan unit usaha sedang disiapkan untuk ekspansi pendapatan.',
        features: [
          'Pembukaan gerai ritel dan kedai kopi pertama',
          'Peningkatan kapasitas produksi dan manajer operasional',
          'Laporan arus kas usaha per jam'
        ]
      },
      Items: {
        label: 'Toko',
        progress: 10,
        iconId: 'icon-items',
        description:
          'Katalog koleksi aset dan barang prestisius sedang disusun sebagai target jangka panjang.',
        features: [
          'Koleksi kendaraan eksekutif dan properti pribadi',
          'Galeri pencapaian koleksi langka',
          'Bonus reputasi dari kepemilikan aset'
        ]
      },
      Profile: {
        label: 'Profil',
        progress: 25,
        iconId: 'icon-profile',
        description:
          'Halaman profil pemain untuk memantau statistik ketukan, pencapaian, dan pengelolaan data.',
        features: [
          'Catatan total ketukan dan total pendapatan sepanjang waktu',
          'Daftar pencapaian pemain berdasarkan target',
          'Pengaturan preferensi dan manajemen data tersimpan'
        ]
      }
    },
    MILESTONES: [
      { id: 'taps_100', type: 'taps', threshold: 100, title: '100 Ketukan Pertama' },
      { id: 'taps_500', type: 'taps', threshold: 500, title: '500 Ketukan Aktif' },
      { id: 'taps_1000', type: 'taps', threshold: 1000, title: '1.000 Ketukan Tekun' },
      { id: 'earned_100', type: 'earned', threshold: 100, title: 'Total Pendapatan 100' },
      { id: 'earned_1000', type: 'earned', threshold: 1000, title: 'Total Pendapatan 1 rb' },
      { id: 'earned_10000', type: 'earned', threshold: 10000, title: 'Total Pendapatan 10 rb' }
    ]
  });
  // END_CONFIG

  const root = typeof window !== 'undefined' ? window : globalThis;
  const hasDOM = typeof document !== 'undefined';

  function getEl(id) {
    return hasDOM ? document.getElementById(id) : null;
  }

  // State utama permainan (Save Schema v2)
  const state = {
    version: CONFIG.SAVE_SCHEMA_VERSION,
    balance: 0.0,
    perClick: CONFIG.BASE_PER_CLICK,
    perSecond: 0.0,
    totalTaps: 0,
    totalEarned: 0.0,
    upgrades: {
      gloves: 0,
      tap_machine: 0,
      auto_team: 0
    },
    holdings: {},
    lastPrices: {},
    priceHistory: {},
    settings: {
      sound: true,
      haptic: true
    },
    milestones: {},
    startDate: Date.now(),
    lastSeen: Date.now(),
    activeTab: 'Earnings',
    activeInvestCategory: 'Saham',
    selectedAssetId: null,
    selectedQtyMode: '1'
  };

  // Referensi elemen DOM
  const balanceDisplay = getEl('balance-display');
  const playerCardId = getEl('player-card-id');
  const previewBalanceDisplay = getEl('preview-balance-display');
  const perClickDisplay = getEl('per-click-display');
  const tapArea = getEl('tap-area');
  const tapHandIcon = getEl('tap-hand-icon');
  const tapEffectsLayer = getEl('tap-effects-layer');
  const upgradesList = getEl('upgrades-list');

  const earningsScreen = getEl('earnings-screen');
  const investingScreen = getEl('investing-screen');
  const assetDetailScreen = getEl('asset-detail-screen');
  const previewScreen = getEl('preview-screen');

  const investWalletBalance = getEl('invest-wallet-balance');
  const investSummaryLabel = getEl('invest-summary-label');
  const investSummaryTotal = getEl('invest-summary-total');
  const investSummaryPnl = getEl('invest-summary-pnl');
  const investSummaryYield = getEl('invest-summary-yield');
  const investAssetList = getEl('invest-asset-list');
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

  const previewTitle = getEl('preview-title');
  const previewDescription = getEl('preview-description');
  const previewIconContainer = getEl('preview-icon-container');
  const previewProgressLabel = getEl('preview-progress-label');
  const previewProgressbar = getEl('preview-progressbar');
  const previewProgressFill = getEl('preview-progress-fill');
  const previewFeaturesList = getEl('preview-features-list');
  const backToEarningsBtn = getEl('back-to-earnings-btn');
  const openRoadmapBtn = getEl('open-roadmap-btn');
  const closeRoadmapBtn = getEl('close-roadmap-btn');
  const roadmapModal = getEl('roadmap-modal');

  const profilePanel = getEl('profile-panel');
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
  const offlineModalTitle = getEl('offline-modal-title');
  const offlineModalDesc = getEl('offline-modal-desc');
  const closeOfflineModalBtn = getEl('close-offline-modal-btn');
  const milestoneToast = getEl('milestone-toast');
  const milestoneToastTitle = getEl('milestone-toast-title');
  const srAnnouncer = getEl('sr-announcer');
  const navTabs = hasDOM ? Array.from(document.querySelectorAll('.nav-tab')) : [];
  const navBadges = {
    Earnings: hasDOM ? document.querySelector('[data-nav-badge="Earnings"]') : null,
    Profile: hasDOM ? document.querySelector('[data-nav-badge="Profile"]') : null
  };

  let lastTouchTimestamp = 0;
  let pulseCleanupTimer = null;
  let saveThrottleTimer = null;
  let srAnnounceTimer = null;
  let toastHideTimer = null;
  let passiveIntervalId = null;
  let priceIntervalId = null;
  let audioCtx = null;
  let hasPendingSave = false;
  let acknowledgedAffordableCount = 0;
  let unseenMilestonesCount = 0;
  let investmentYieldCarry = 0;
  let renderedListCategory = null;

  /**
   * Mengambil instance penyimpanan lokal yang tersedia.
   */
  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mencari definisi aset berdasarkan id.
   */
  function getAssetById(assetId) {
    return (
      ASSETS.find(function (item) {
        return item.id === assetId;
      }) || null
    );
  }

  /**
   * Memicu umpan balik getar singkat pada perangkat yang mendukung.
   */
  function triggerHaptic() {
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
  function playCoinBlip() {
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
  function showToast(label, title) {
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
  function showMilestoneToast(title) {
    showToast('Pencapaian Baru', title);
  }

  /**
   * Mengecek dan mencatat pencapaian baru agar hanya muncul satu kali.
   */
  function checkMilestones() {
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
          unseenMilestonesCount += 1;
          setTabBadge('Profile', unseenMilestonesCount);
        }
      }
    });

    if (newlyUnlocked) {
      writeSaveImmediate();
      showMilestoneToast(newlyUnlocked.title);
      if (state.activeTab === 'Profile') {
        renderProfileStats();
      }
    }
  }

  /**
   * Mengecek apakah pengguna mengaktifkan preferensi pengurangan gerak.
   */
  function prefersReducedMotion() {
    return Boolean(
      root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  /**
   * Mengumumkan pesan ke pembaca layar secara ter-throttle atau seketika saat peristiwa penting.
   */
  function announceScreenReader(message, immediate) {
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
      srAnnouncer.textContent = 'Saldo saat ini Rp' + formatCurrencyValue(state.balance);
    }, CONFIG.SR_ANNOUNCE_THROTTLE_MS);
  }

  /**
   * Memformat angka penuh ke pemisah ribuan titik (.) dan desimal koma (,).
   */
  function formatFullCurrencyValue(amount) {
    const safeNumber = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    const fixed = safeNumber.toFixed(CONFIG.CURRENCY_DECIMALS);
    const parts = fixed.split('.');
    const integerWithDots = parts[0].replace(CONFIG.THOUSANDS_GROUP_REGEX, '.');
    return integerWithDots + ',' + parts[1];
  }

  /**
   * Memformat angka besar secara ringkas bergaya Indonesia (rb, jt, M, T).
   */
  function formatCompact(amount) {
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
  function formatCurrencyValue(amount) {
    return formatCompact(amount);
  }

  /**
   * Memformat nominal Rupiah ringkas ("Rp25 rb", "Rp1,6 M") dengan guard Number.isFinite.
   */
  function formatRupiahCompact(amount) {
    const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
    const prefix = Number.isFinite(amount) && amount < 0 ? '-Rp' : 'Rp';
    return prefix + formatCompact(safe);
  }

  /**
   * Memformat nominal Rupiah penuh ("Rp1.234.567,89") dengan guard Number.isFinite.
   */
  function formatRupiahFull(amount) {
    const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
    const prefix = Number.isFinite(amount) && amount < 0 ? '-Rp' : 'Rp';
    return prefix + formatFullCurrencyValue(safe);
  }

  /**
   * Memformat persentase bertanda ("+1,25%" / "-0,40%") yang selalu finite 2 desimal.
   */
  function formatSignedPercent(pct) {
    const safe = Number.isFinite(pct) ? pct : 0;
    const sign = safe >= 0 ? '+' : '-';
    const absStr = Math.abs(safe).toFixed(CONFIG.CURRENCY_DECIMALS).replace('.', ',');
    return sign + absStr + '%';
  }

  /**
   * Menginisialisasi harga pasar & menghasilkan 60 titik riwayat mundur dengan random walk.
   */
  function initMarketData() {
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
  function getTotalInvestmentHourlyYield() {
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
  function runPriceTick() {
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
  }

  /**
   * Mengambil harga pasar terkini suatu aset (dijamin finite > 0).
   */
  function getCurrentAssetPrice(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return 0;
    const p = Number(state.lastPrices[assetId]);
    if (Number.isFinite(p) && p > 0) {
      return p;
    }
    return asset.initialPrice;
  }

  /**
   * Menghitung persentase perubahan harga aset terhadap titik awal riwayat.
   */
  function getAssetChangePercent(assetId) {
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
  function getCategorySummary(category) {
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
   * Merender layar utama Investasi (4 sub-tab, kartu ringkasan, dan daftar aset).
   */
  function renderInvestingScreen() {
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
      renderedListCategory !== cat ||
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
        avatar.style.backgroundColor = asset.color;
        avatar.textContent = asset.symbol;

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
      renderedListCategory = cat;
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

  /**
   * Memformat timestamp menjadi jam singkat HH:MM untuk sumbu X grafik.
   */
  function formatTimeHHMM(timestamp) {
    const d = new Date(Number.isFinite(timestamp) ? timestamp : Date.now());
    const hh = String(d.getHours()).padStart(CONFIG.DATE_PAD_LENGTH, '0');
    const mm = String(d.getMinutes()).padStart(CONFIG.DATE_PAD_LENGTH, '0');
    return hh + ':' + mm;
  }

  /**
   * Menghitung jumlah unit beli & jual berdasarkan chip aktif ('1', '10', '100', 'max').
   */
  function resolveTradeQuantities(currentPrice, ownedUnits) {
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
  function renderAssetPriceChart(asset) {
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
  function renderAssetDetailScreen() {
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
        detailTradeNotice.classList.add('detail-trade-card__notice--error');
      } else if (state.selectedQtyMode === 'max') {
        detailTradeNotice.textContent =
          'Maks beli: ' +
          formatIntegerID(trade.buyQty) +
          ' ' +
          asset.unitLabel +
          ' (' +
          formatRupiahCompact(estBuyCost) +
          ')';
        detailTradeNotice.classList.remove('detail-trade-card__notice--error');
      } else {
        detailTradeNotice.textContent =
          formatIntegerID(trade.buyQty) +
          ' ' +
          asset.unitLabel +
          ' · ' +
          formatRupiahCompact(estBuyCost);
        detailTradeNotice.classList.remove('detail-trade-card__notice--error');
      }
    }

    renderAssetPriceChart(asset);
  }

  /**
   * Membeli aset secara atomik menggunakan saldo dompet pemain.
   * Mengembalikan true jika transaksi berhasil, false jika dibatalkan.
   */
  function buyAsset(assetId, requestedQty) {
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
  function sellAsset(assetId, requestedQty) {
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
   * Membuka layar detail untuk aset tertentu.
   */
  function openAssetDetail(assetId) {
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
  function closeAssetDetail() {
    state.selectedAssetId = null;
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
   * Menghitung biaya peningkatan tingkat berikutnya.
   */
  function getUpgradeCost(tier, level) {
    const safeLevel = Number.isFinite(level) && level >= 0 ? Math.floor(level) : 0;
    const rawCost = tier.baseCost * Math.pow(CONFIG.COST_GROWTH_FACTOR, safeLevel);
    return Math.round(rawCost * 100) / 100;
  }

  /**
   * Menghitung ulang nilai perClick berdasarkan tingkat seluruh peningkatan.
   */
  function recalculatePerClick() {
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
  function recalculatePerSecond() {
    let total = 0;
    CONFIG.UPGRADE_TIERS.forEach(function (tier) {
      const lvl = Number(state.upgrades[tier.id]) || 0;
      total += lvl * (tier.passiveBonus || 0);
    });
    return Math.round(total * 100) / 100;
  }

  /**
   * Menghitung bonus luring berdasarkan batas waktu maksimum dan efisiensi.
   */
  function calculateOfflineBonus(ratePerSecond, elapsedMs) {
    if (!Number.isFinite(ratePerSecond) || ratePerSecond <= 0) {
      return { bonus: 0, seconds: 0 };
    }
    const rawSeconds = Math.floor((Number(elapsedMs) || 0) / CONFIG.MS_PER_SECOND);
    if (rawSeconds <= 0) {
      return { bonus: 0, seconds: 0 };
    }
    const cappedSeconds = Math.min(rawSeconds, CONFIG.MAX_OFFLINE_SECONDS);
    const bonus =
      Math.round(ratePerSecond * cappedSeconds * CONFIG.OFFLINE_EFFICIENCY * 100) / 100;
    return { bonus: bonus, seconds: cappedSeconds };
  }

  /**
   * Menampilkan modal sambutan pendapatan luring jika bonus > 0.
   */
  function showOfflineWelcomeModal(bonus, seconds) {
    if (!offlineModal || !offlineModalTitle || bonus <= 0) return;
    offlineModalTitle.textContent =
      'Selamat datang kembali, +$' + formatCurrencyValue(bonus);
    if (offlineModalDesc) {
      const minutes = Math.max(1, Math.round(seconds / CONFIG.SECONDS_PER_MINUTE));
      offlineModalDesc.textContent =
        'Tim Otomatis mengumpulkan penghasilan selama ' +
        (seconds < CONFIG.SECONDS_PER_MINUTE ? seconds + ' detik' : minutes + ' menit') +
        ' Anda tidak aktif (efisiensi 50%, batas maksimal 2 jam).';
    }
    offlineModal.hidden = false;
  }

  /**
   * Memformat bilangan bulat dengan pemisah ribuan titik (.).
   */
  function formatIntegerID(value) {
    const safeInt = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    return String(safeInt).replace(CONFIG.THOUSANDS_GROUP_REGEX, '.');
  }

  /**
   * Memformat timestamp menjadi tanggal singkat DD/MM/YYYY.
   */
  function formatDateShort(timestamp) {
    const d = new Date(Number.isFinite(timestamp) ? timestamp : Date.now());
    const day = String(d.getDate()).padStart(CONFIG.DATE_PAD_LENGTH, '0');
    const month = String(d.getMonth() + 1).padStart(CONFIG.DATE_PAD_LENGTH, '0');
    const year = d.getFullYear();
    return day + '/' + month + '/' + year;
  }

  /**
   * Menurunkan ID pemain netral (#BT-YYYY-XXXX) secara deterministik dari startDate.
   */
  function derivePlayerCardId(timestamp) {
    const safeTs = Number.isFinite(timestamp) && timestamp > 0 ? Math.floor(timestamp) : Date.now();
    const year = new Date(safeTs).getFullYear();
    const hash = ((safeTs * CONFIG.PLAYER_ID_HASH_PRIME) >>> 0) % CONFIG.PLAYER_ID_MODULO;
    const digits = String(hash).padStart(CONFIG.PLAYER_ID_PAD_LENGTH, '0');
    return '#BT-' + year + '-' + digits;
  }

  /**
   * Memperbarui label ID pemain pada Kartu Utama.
   */
  function renderBankCardIdentity() {
    if (playerCardId) {
      playerCardId.textContent = derivePlayerCardId(state.startDate);
    }
  }

  /**
   * Memuat data dari localStorage dengan migrasi otomatis dari Save Schema v1 ke v2.
   */
  function loadState() {
    const now = Date.now();
    const storage = getStorage();
    if (!storage) {
      state.startDate = now;
      state.lastSeen = now;
      initMarketData();
      return;
    }

    try {
      const raw = storage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) {
        state.startDate = now;
        state.lastSeen = now;
        initMarketData();
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const isV2 = Number(parsed.version) >= CONFIG.SAVE_SCHEMA_VERSION;
        const loadedBalance = Number(parsed.balance);
        const loadedPerClick = Number(parsed.perClick);

        state.balance =
          Number.isFinite(loadedBalance) && loadedBalance >= 0
            ? Math.round(loadedBalance * 100) / 100
            : 0;

        CONFIG.UPGRADE_TIERS.forEach(function (tier) {
          const lvl =
            parsed.upgrades && typeof parsed.upgrades === 'object'
              ? Number(parsed.upgrades[tier.id])
              : 0;
          state.upgrades[tier.id] = Number.isFinite(lvl) && lvl >= 0 ? Math.floor(lvl) : 0;
        });

        const calculatedClick = recalculatePerClick();
        if (parsed.upgrades && typeof parsed.upgrades === 'object') {
          state.perClick = calculatedClick;
        } else if (Number.isFinite(loadedPerClick) && loadedPerClick > 0) {
          state.perClick = Math.round(loadedPerClick * 100) / 100;
        } else {
          state.perClick = CONFIG.BASE_PER_CLICK;
        }
        state.perSecond = recalculatePerSecond();

        if (parsed.settings && typeof parsed.settings === 'object') {
          state.settings.sound = parsed.settings.sound !== false;
          state.settings.haptic = parsed.settings.haptic !== false;
        } else {
          state.settings.sound = true;
          state.settings.haptic = true;
        }

        state.milestones = {};
        if (parsed.milestones && typeof parsed.milestones === 'object') {
          CONFIG.MILESTONES.forEach(function (m) {
            if (parsed.milestones[m.id]) {
              state.milestones[m.id] = true;
            }
          });
        }

        state.holdings = {};
        state.lastPrices = {};
        initMarketData();

        if (isV2) {
          const taps = Number(parsed.totalTaps);
          const earned = Number(parsed.totalEarned);
          const start = Number(parsed.startDate);
          const seen = Number(parsed.lastSeen);

          state.totalTaps = Number.isFinite(taps) && taps >= 0 ? Math.floor(taps) : 0;
          state.totalEarned =
            Number.isFinite(earned) && earned >= state.balance
              ? Math.round(earned * 100) / 100
              : state.balance;
          state.startDate = Number.isFinite(start) && start > 0 ? start : now;
          const previousSeen = Number.isFinite(seen) && seen > 0 ? seen : now;

          // Hitung penghasilan luring sejak lastSeen
          const offlineResult = calculateOfflineBonus(state.perSecond, now - previousSeen);
          if (offlineResult.bonus > 0) {
            state.balance = Math.round((state.balance + offlineResult.bonus) * 100) / 100;
            state.totalEarned = Math.round((state.totalEarned + offlineResult.bonus) * 100) / 100;
            state.lastSeen = now;
            writeSaveImmediate();
            showOfflineWelcomeModal(offlineResult.bonus, offlineResult.seconds);
          } else {
            state.lastSeen = now;
          }
        } else {
          // Migrasi otomatis dari v1 (version belum ada)
          state.totalTaps = 0;
          state.totalEarned = state.balance;
          state.startDate = now;
          state.lastSeen = now;
          state.version = CONFIG.SAVE_SCHEMA_VERSION;
          writeSaveImmediate();
        }
      }
    } catch (error) {
      initMarketData();
    }
  }

  /**
   * Menulis payload Save Schema v2 secara sinkron ke localStorage.
   */
  function writeSaveImmediate() {
    if (saveThrottleTimer) {
      root.clearTimeout(saveThrottleTimer);
      saveThrottleTimer = null;
    }
    hasPendingSave = false;
    state.lastSeen = Date.now();
    const storage = getStorage();
    if (!storage) return;

    try {
      const payload = JSON.stringify({
        version: CONFIG.SAVE_SCHEMA_VERSION,
        balance: state.balance,
        perClick: state.perClick,
        totalTaps: state.totalTaps,
        totalEarned: state.totalEarned,
        upgrades: Object.assign({}, state.upgrades),
        settings: Object.assign({}, state.settings),
        milestones: Object.assign({}, state.milestones),
        startDate: state.startDate,
        lastSeen: state.lastSeen
      });
      storage.setItem(CONFIG.STORAGE_KEY, payload);
    } catch (error) {
      // Abaikan jika kuota penyimpanan penuh atau mode privat ketat
    }
  }

  /**
   * Memastikan penyimpanan tertunda langsung ditulis (saat tab ditutup/sembunyi).
   */
  function flushSaveState() {
    writeSaveImmediate();
  }

  /**
   * Menyimpan payload Save Schema v2 ke localStorage dengan throttle trailing-edge.
   */
  function saveState() {
    state.lastSeen = Date.now();
    hasPendingSave = true;
    if (saveThrottleTimer) {
      return;
    }
    saveThrottleTimer = root.setTimeout(function () {
      saveThrottleTimer = null;
      if (hasPendingSave) {
        writeSaveImmediate();
      }
    }, CONFIG.SAVE_THROTTLE_MS);
  }

  /**
   * Merender statistik dasar & pengaturan preferensi pemain pada tab Profil.
   */
  function renderProfileStats() {
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
  function resetAllData() {
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
    investmentYieldCarry = 0;
    renderedListCategory = null;
    initMarketData();
    state.settings = { sound: true, haptic: true };
    state.milestones = {};
    state.startDate = now;
    state.lastSeen = now;
    acknowledgedAffordableCount = 0;
    unseenMilestonesCount = 0;
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

  /**
   * Merender daftar tingkat peningkatan beserta status tombol beli.
   */
  function renderUpgrades() {
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
  function countAffordableUpgrades() {
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
   * Mengatur tampilan lencana notifikasi dinamis pada tab navigasi.
   */
  function setTabBadge(tabName, count) {
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

  /**
   * Memperbarui lencana dinamis berdasarkan kondisi nyata (peningkatan terjangkau).
   */
  function updateDynamicBadges() {
    const affordable = countAffordableUpgrades();
    if (state.activeTab === 'Earnings') {
      acknowledgedAffordableCount = affordable;
      setTabBadge('Earnings', 0);
    } else if (affordable > acknowledgedAffordableCount) {
      setTabBadge('Earnings', affordable);
    } else if (affordable === 0) {
      acknowledgedAffordableCount = 0;
      setTabBadge('Earnings', 0);
    }
  }

  /**
   * Membeli peningkatan berdasarkan id jika saldo mencukupi.
   */
  function buyUpgrade(upgradeId) {
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
  function renderStats() {
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
   * Memberikan animasi memantul halus pada ikon tangan SVG.
   */
  function triggerHandPulse() {
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
  function spawnFloatingFeedback(clientX, clientY, amount) {
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
  function processTap(clientX, clientY) {
    state.balance = Math.round((state.balance + state.perClick) * 100) / 100;
    state.totalTaps += 1;
    state.totalEarned = Math.round((state.totalEarned + state.perClick) * 100) / 100;
    saveState();
    renderStats();
    renderUpgrades();
    if (state.activeTab === 'Profile') {
      renderProfileStats();
    }
    triggerHaptic();
    playCoinBlip();
    triggerHandPulse();
    spawnFloatingFeedback(clientX, clientY, state.perClick);
    checkMilestones();
    announceScreenReader('', false);
  }

  /**
   * Mengatur perpindahan tab pada Bottom Navigation Bar.
   */
  function switchTab(tabName) {
    state.activeTab = tabName;
    state.selectedAssetId = null;
    setTabBadge(tabName, 0);
    if (tabName === 'Earnings') {
      acknowledgedAffordableCount = countAffordableUpgrades();
    } else if (tabName === 'Profile') {
      unseenMilestonesCount = 0;
    }

    navTabs.forEach(function (tabBtn) {
      const tabAttr = tabBtn.getAttribute('data-tab');
      const isSelected = tabAttr === tabName;
      tabBtn.classList.toggle('nav-tab--active', isSelected);
      if (isSelected) {
        tabBtn.setAttribute('aria-current', 'page');
      } else {
        tabBtn.removeAttribute('aria-current');
      }
      if (tabAttr === 'Earnings') {
        if (isSelected) {
          tabBtn.style.setProperty('--coin-bg-fill', '#F97316');
          tabBtn.style.setProperty('--coin-bg-stroke', '#F97316');
          tabBtn.style.setProperty('--coin-ring-stroke', 'rgba(255,255,255,0.32)');
          tabBtn.style.setProperty('--coin-symbol-stroke', '#FFFFFF');
        } else {
          tabBtn.style.removeProperty('--coin-bg-fill');
          tabBtn.style.removeProperty('--coin-bg-stroke');
          tabBtn.style.removeProperty('--coin-ring-stroke');
          tabBtn.style.removeProperty('--coin-symbol-stroke');
        }
      }
    });

    if (!earningsScreen || !previewScreen) return;

    earningsScreen.hidden = true;
    earningsScreen.classList.remove('screen--active');
    previewScreen.hidden = true;
    previewScreen.classList.remove('screen--active');
    if (investingScreen) {
      investingScreen.hidden = true;
      investingScreen.classList.remove('screen--active');
    }
    if (assetDetailScreen) {
      assetDetailScreen.hidden = true;
      assetDetailScreen.classList.remove('screen--active');
    }

    if (tabName === 'Earnings') {
      earningsScreen.hidden = false;
      earningsScreen.classList.add('screen--active');
    } else if (tabName === 'Investing' && investingScreen) {
      investingScreen.hidden = false;
      investingScreen.classList.add('screen--active');
      renderInvestingScreen();
    } else {
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
        if (tabName === 'Profile') {
          renderProfileStats();
        }
      }

      previewScreen.hidden = false;
      previewScreen.classList.add('screen--active');
    }
  }

  /**
   * Mendaftarkan seluruh event listener sentuhan, klik, investasi, dan navigasi.
   */
  function bindEvents() {
    if (!hasDOM || !tapArea) return;

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
    document.addEventListener('dblclick', function (event) {
      event.preventDefault();
    });

    navTabs.forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        const targetTab = tabBtn.getAttribute('data-tab');
        if (targetTab) {
          switchTab(targetTab);
        }
      });
    });

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

    if (backToEarningsBtn) {
      backToEarningsBtn.addEventListener('click', function () {
        switchTab('Earnings');
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

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        flushSaveState();
      } else if (document.visibilityState === 'visible') {
        renderStats();
        renderUpgrades();
        if (state.activeTab === 'Investing') {
          if (state.selectedAssetId) {
            renderAssetDetailScreen();
          } else {
            renderInvestingScreen();
          }
        } else if (state.activeTab === 'Profile') {
          renderProfileStats();
        }
      }
    });
    root.addEventListener('beforeunload', flushSaveState);
    root.addEventListener('pagehide', flushSaveState);
  }

  /**
   * Satu siklus pendapatan pasif per detik (termasuk dividen Saham & sewa Properti).
   */
  function runPassiveTick() {
    const hourlyYield = getTotalInvestmentHourlyYield();
    const investPerSec = hourlyYield / CONFIG.SECONDS_PER_HOUR;
    if (Number.isFinite(investPerSec) && investPerSec > 0) {
      investmentYieldCarry += investPerSec;
    }

    const realizedInvest = Math.floor(investmentYieldCarry * 100) / 100;
    if (realizedInvest > 0) {
      investmentYieldCarry = Math.max(0, investmentYieldCarry - realizedInvest);
    }

    const totalGain = state.perSecond + realizedInvest;
    if (!Number.isFinite(totalGain) || totalGain <= 0) return;

    state.balance = Math.round((state.balance + totalGain) * 100) / 100;
    state.totalEarned = Math.round((state.totalEarned + totalGain) * 100) / 100;
    saveState();

    if (hasDOM && document.visibilityState === 'visible') {
      renderStats();
      renderUpgrades();
      if (state.activeTab === 'Investing') {
        if (state.selectedAssetId) {
          renderAssetDetailScreen();
        } else {
          renderInvestingScreen();
        }
      } else if (state.activeTab === 'Profile') {
        renderProfileStats();
      }
      checkMilestones();
    }
  }

  /**
   * Memulai interval untuk pendapatan pasif.
   */
  function startPassiveIncomeLoop() {
    if (passiveIntervalId) {
      root.clearInterval(passiveIntervalId);
    }
    passiveIntervalId = root.setInterval(runPassiveTick, CONFIG.PASSIVE_TICK_MS);
  }

  /**
   * Memulai interval pergerakan harga pasar setiap 3 detik.
   */
  function startMarketPriceLoop() {
    if (priceIntervalId) {
      root.clearInterval(priceIntervalId);
    }
    priceIntervalId = root.setInterval(runPriceTick, CONFIG.PRICE_TICK_MS);
  }

  /**
   * Mendaftarkan Service Worker untuk dukungan PWA luring.
   */
  function registerServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && root.addEventListener) {
      root.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () {
          // Abaikan jika dijalankan dari protokol file:// lokal
        });
      });
    }
  }

  // Inisialisasi aplikasi saat berada di lingkungan DOM peramban
  function init() {
    setTabBadge('Earnings', 0);
    setTabBadge('Profile', 0);
    loadState();
    renderBankCardIdentity();
    renderStats();
    renderUpgrades();
    renderProfileStats();
    renderInvestingScreen();
    bindEvents();
    startPassiveIncomeLoop();
    startMarketPriceLoop();
    registerServiceWorker();
  }

  if (hasDOM) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Ekspor fungsi inti untuk pengujian otomatis (Node.js)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ASSETS: ASSETS,
      CONFIG: CONFIG,
      state: state,
      formatCurrencyValue: formatCurrencyValue,
      formatFullCurrencyValue: formatFullCurrencyValue,
      formatCompact: formatCompact,
      formatRupiahCompact: formatRupiahCompact,
      formatRupiahFull: formatRupiahFull,
      formatSignedPercent: formatSignedPercent,
      getUpgradeCost: getUpgradeCost,
      recalculatePerClick: recalculatePerClick,
      recalculatePerSecond: recalculatePerSecond,
      calculateOfflineBonus: calculateOfflineBonus,
      derivePlayerCardId: derivePlayerCardId,
      getCategorySummary: getCategorySummary,
      getTotalInvestmentHourlyYield: getTotalInvestmentHourlyYield,
      initMarketData: initMarketData,
      runPriceTick: runPriceTick,
      loadState: loadState,
      saveState: saveState,
      writeSaveImmediate: writeSaveImmediate,
      flushSaveState: flushSaveState,
      resetAllData: resetAllData,
      buyUpgrade: buyUpgrade,
      buyAsset: buyAsset,
      sellAsset: sellAsset,
      processTap: processTap,
      runPassiveTick: runPassiveTick
    };
  }
})();
