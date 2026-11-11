/* ==========================================================================
   BUSINESS TYCOON TAP - CORE GAME LOGIC & UI CONTROLLER (game.js)
   ========================================================================== */

(function () {
  'use strict';

  // Konfigurasi terpusat: seluruh konstanta & parameter permainan dikumpulkan di sini
  const CONFIG = Object.freeze({
    STORAGE_KEY: 'business_simulator_save_v1',
    SAVE_SCHEMA_VERSION: 2,
    TOUCH_DEDUP_MS: 500,
    SAVE_THROTTLE_MS: 500,
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
    THOUSANDS_GROUP_REGEX: /\B(?=(\d{3})+(?!\d))/g,
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
      Investing: {
        progress: 15,
        iconId: 'icon-investing',
        description:
          'Instrumen pasar modal dan properti sedang dirancang agar modal Anda bisa berkembang secara pasif.',
        features: [
          'Bursa saham perusahaan dengan dividen berkala',
          'Investasi properti sewa berimbal hasil stabil',
          'Ringkasan portofolio dan riwayat imbal hasil'
        ]
      },
      Business: {
        progress: 20,
        iconId: 'icon-business',
        description:
          'Sistem pendirian dan pengelolaan unit usaha sedang disiapkan untuk ekspansi pendapatan.',
        features: [
          'Pembukaan gerai ritel dan kedai kopi pertama',
          'Peningkatan kapasitas produksi dan manajer operasional',
          'Laporan arus kas bisnis per detik'
        ]
      },
      Items: {
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
      { id: 'earned_100', type: 'earned', threshold: 100, title: 'Total Pendapatan $100' },
      { id: 'earned_1000', type: 'earned', threshold: 1000, title: 'Total Pendapatan $1 rb' },
      { id: 'earned_10000', type: 'earned', threshold: 10000, title: 'Total Pendapatan $10 rb' }
    ]
  });

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
    settings: {
      sound: true,
      haptic: true
    },
    milestones: {},
    startDate: Date.now(),
    lastSeen: Date.now(),
    activeTab: 'Earnings'
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
  const previewScreen = getEl('preview-screen');
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
  let audioCtx = null;
  let hasPendingSave = false;
  let acknowledgedAffordableCount = 0;
  let unseenMilestonesCount = 0;

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
   * Menampilkan toast pencapaian baru selama beberapa detik.
   */
  function showMilestoneToast(title) {
    if (!milestoneToast || !milestoneToastTitle) return;
    milestoneToastTitle.textContent = title;
    milestoneToast.hidden = false;
    announceScreenReader('Pencapaian baru terbuka: ' + title, true);

    if (toastHideTimer) {
      root.clearTimeout(toastHideTimer);
    }
    toastHideTimer = root.setTimeout(function () {
      milestoneToast.hidden = true;
      toastHideTimer = null;
    }, CONFIG.TOAST_DURATION_MS);
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
      srAnnouncer.textContent = 'Saldo saat ini $ ' + formatCurrencyValue(state.balance);
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
      return;
    }

    try {
      const raw = storage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) {
        state.startDate = now;
        state.lastSeen = now;
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
      // Abaikan jika penyimpanan lokal dibatasi oleh pengaturan privasi peramban
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
   * Merender statistik dasar & pengaturan preferensi pemain pada tab Profile.
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
          tabBtn.style.setProperty('--coin-bg-fill', '#2563EB');
          tabBtn.style.setProperty('--coin-bg-stroke', '#2563EB');
          tabBtn.style.setProperty('--coin-ring-stroke', 'rgba(255,255,255,0.26)');
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

    if (tabName === 'Earnings') {
      previewScreen.hidden = true;
      earningsScreen.hidden = false;
      earningsScreen.classList.add('screen--active');
      previewScreen.classList.remove('screen--active');
    } else {
      const moduleInfo = CONFIG.MODULE_PREVIEWS[tabName] || CONFIG.MODULE_PREVIEWS.Investing;
      if (previewTitle) {
        previewTitle.textContent = '';
        const brandSpan = document.createElement('span');
        brandSpan.setAttribute('lang', 'en');
        brandSpan.textContent = tabName;
        previewTitle.appendChild(brandSpan);
        previewTitle.appendChild(document.createTextNode(' — Dalam Pengembangan'));
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

      earningsScreen.hidden = true;
      previewScreen.hidden = false;
      earningsScreen.classList.remove('screen--active');
      previewScreen.classList.add('screen--active');
    }
  }

  /**
   * Mendaftarkan seluruh event listener sentuhan, klik, dan navigasi.
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
        if (state.activeTab === 'Profile') {
          renderProfileStats();
        }
      }
    });
    root.addEventListener('beforeunload', flushSaveState);
    root.addEventListener('pagehide', flushSaveState);
  }

  /**
   * Satu siklus pendapatan pasif per detik (hanya merender DOM jika tab terlihat).
   */
  function runPassiveTick() {
    if (state.perSecond <= 0) return;

    state.balance = Math.round((state.balance + state.perSecond) * 100) / 100;
    state.totalEarned = Math.round((state.totalEarned + state.perSecond) * 100) / 100;
    saveState();

    if (hasDOM && document.visibilityState === 'visible') {
      renderStats();
      renderUpgrades();
      if (state.activeTab === 'Profile') {
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
    bindEvents();
    startPassiveIncomeLoop();
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
      CONFIG: CONFIG,
      state: state,
      formatCurrencyValue: formatCurrencyValue,
      formatFullCurrencyValue: formatFullCurrencyValue,
      formatCompact: formatCompact,
      getUpgradeCost: getUpgradeCost,
      recalculatePerClick: recalculatePerClick,
      recalculatePerSecond: recalculatePerSecond,
      calculateOfflineBonus: calculateOfflineBonus,
      derivePlayerCardId: derivePlayerCardId,
      loadState: loadState,
      saveState: saveState,
      writeSaveImmediate: writeSaveImmediate,
      flushSaveState: flushSaveState,
      resetAllData: resetAllData,
      buyUpgrade: buyUpgrade,
      processTap: processTap,
      runPassiveTick: runPassiveTick
    };
  }
})();
