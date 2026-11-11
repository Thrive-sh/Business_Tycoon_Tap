/* ==========================================================================
   BUSINESS SIMULATOR - CORE GAME LOGIC & UI CONTROLLER (game.js)
   ========================================================================== */

(function () {
  'use strict';

  // Kunci penyimpanan otomatis di localStorage
  const STORAGE_KEY = 'business_simulator_save_v1';
  const SAVE_SCHEMA_VERSION = 2;
  const SAVE_THROTTLE_MS = 500;
  const PASSIVE_TICK_MS = 1000;
  const MAX_OFFLINE_SECONDS = 7200;
  const OFFLINE_EFFICIENCY = 0.5;
  const MAX_ACTIVE_PARTICLES = 40;
  const BASE_PER_CLICK = 1.0;
  const COST_GROWTH_FACTOR = 1.15;

  // Definisi 3 tingkat peningkatan per ketuk & pasif
  const UPGRADE_TIERS = [
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
  ];

  // Data status pengembangan, progres, rencana fitur, & ID ikon SVG sprite untuk tab non-Earnings
  const MODULE_PREVIEWS = {
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
  };

  // State utama permainan (Save Schema v2)
  const state = {
    version: SAVE_SCHEMA_VERSION,
    balance: 0.0,
    perClick: BASE_PER_CLICK,
    perSecond: 0.0,
    totalTaps: 0,
    totalEarned: 0.0,
    upgrades: {
      gloves: 0,
      tap_machine: 0,
      auto_team: 0
    },
    startDate: Date.now(),
    lastSeen: Date.now(),
    activeTab: 'Earnings'
  };

  // Referensi elemen DOM
  const balanceDisplay = document.getElementById('balance-display');
  const previewBalanceDisplay = document.getElementById('preview-balance-display');
  const perClickDisplay = document.getElementById('per-click-display');
  const tapArea = document.getElementById('tap-area');
  const tapHandIcon = document.getElementById('tap-hand-icon');
  const tapEffectsLayer = document.getElementById('tap-effects-layer');
  const upgradesList = document.getElementById('upgrades-list');

  const earningsScreen = document.getElementById('earnings-screen');
  const previewScreen = document.getElementById('preview-screen');
  const previewTitle = document.getElementById('preview-title');
  const previewDescription = document.getElementById('preview-description');
  const previewIconContainer = document.getElementById('preview-icon-container');
  const previewProgressLabel = document.getElementById('preview-progress-label');
  const previewProgressbar = document.getElementById('preview-progressbar');
  const previewProgressFill = document.getElementById('preview-progress-fill');
  const previewFeaturesList = document.getElementById('preview-features-list');
  const backToEarningsBtn = document.getElementById('back-to-earnings-btn');
  const openRoadmapBtn = document.getElementById('open-roadmap-btn');
  const closeRoadmapBtn = document.getElementById('close-roadmap-btn');
  const roadmapModal = document.getElementById('roadmap-modal');

  const profilePanel = document.getElementById('profile-panel');
  const statTotalTaps = document.getElementById('stat-total-taps');
  const statTotalEarned = document.getElementById('stat-total-earned');
  const statStartDate = document.getElementById('stat-start-date');
  const openResetModalBtn = document.getElementById('open-reset-modal-btn');
  const resetModal = document.getElementById('reset-modal');
  const resetConfirmCheckbox = document.getElementById('reset-confirm-checkbox');
  const cancelResetBtn = document.getElementById('cancel-reset-btn');
  const confirmResetBtn = document.getElementById('confirm-reset-btn');
  const offlineModal = document.getElementById('offline-modal');
  const offlineModalTitle = document.getElementById('offline-modal-title');
  const offlineModalDesc = document.getElementById('offline-modal-desc');
  const closeOfflineModalBtn = document.getElementById('close-offline-modal-btn');
  const navTabs = Array.from(document.querySelectorAll('.nav-tab'));
  const navBadges = {
    Earnings: document.querySelector('[data-nav-badge="Earnings"]'),
    Profile: document.querySelector('[data-nav-badge="Profile"]')
  };

  let lastTouchTimestamp = 0;
  let pulseCleanupTimer = null;
  let saveThrottleTimer = null;
  let passiveIntervalId = null;
  let hasPendingSave = false;
  let acknowledgedAffordableCount = 0;

  const COMPACT_UNITS = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'M' },
    { threshold: 1e6, suffix: 'jt' },
    { threshold: 1e3, suffix: 'rb' }
  ];

  /**
   * Memformat angka penuh ke pemisah ribuan titik (.) dan desimal koma (,).
   * Contoh: 0 -> "0,00" | 2500000 -> "2.500.000,00"
   */
  function formatFullCurrencyValue(amount) {
    const safeNumber = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    const fixed = safeNumber.toFixed(2);
    const parts = fixed.split('.');
    const integerWithDots = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return integerWithDots + ',' + parts[1];
  }

  /**
   * Memformat angka besar secara ringkas bergaya Indonesia (rb, jt, M, T).
   * Contoh: 1500 -> "1,5 rb" | 2500000 -> "2,5 jt" | < 1000 -> "0,00"
   */
  function formatCompact(amount) {
    const safeNumber = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    if (safeNumber < 1000) {
      return formatFullCurrencyValue(safeNumber);
    }

    for (let i = 0; i < COMPACT_UNITS.length; i += 1) {
      const unit = COMPACT_UNITS[i];
      if (safeNumber >= unit.threshold) {
        const scaled = Math.round((safeNumber / unit.threshold) * 100) / 100;
        if (scaled >= 1000 && i > 0) {
          const higher = COMPACT_UNITS[i - 1];
          const higherScaled = Math.round((safeNumber / higher.threshold) * 100) / 100;
          const higherStr = higherScaled
            .toFixed(2)
            .replace(/\.?0+$/, '')
            .replace('.', ',');
          return higherStr + ' ' + higher.suffix;
        }
        const formattedScaled = scaled
          .toFixed(2)
          .replace(/\.?0+$/, '')
          .replace('.', ',');
        return formattedScaled + ' ' + unit.suffix;
      }
    }

    return formatFullCurrencyValue(safeNumber);
  }

  /**
   * Memformat nominal mata uang untuk tampilan UI (ringkas >= 1.000).
   */
  function formatCurrencyValue(amount) {
    return formatCompact(amount);
  }

  /**
   * Menghitung biaya upgrade level berikutnya: baseCost * 1.15^level (2 desimal).
   */
  function getUpgradeCost(tier, level) {
    const safeLevel = Number.isFinite(level) && level >= 0 ? Math.floor(level) : 0;
    const rawCost = tier.baseCost * Math.pow(COST_GROWTH_FACTOR, safeLevel);
    return Math.round(rawCost * 100) / 100;
  }

  /**
   * Menghitung ulang nilai perClick berdasarkan level seluruh upgrade.
   */
  function recalculatePerClick() {
    let total = BASE_PER_CLICK;
    UPGRADE_TIERS.forEach(function (tier) {
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
    UPGRADE_TIERS.forEach(function (tier) {
      const lvl = Number(state.upgrades[tier.id]) || 0;
      total += lvl * (tier.passiveBonus || 0);
    });
    return Math.round(total * 100) / 100;
  }

  /**
   * Menghitung bonus luring (offline earnings) maksimal 2 jam dengan efisiensi 50%.
   */
  function calculateOfflineBonus(ratePerSecond, elapsedMs) {
    if (!Number.isFinite(ratePerSecond) || ratePerSecond <= 0) {
      return { bonus: 0, seconds: 0 };
    }
    const rawSeconds = Math.floor((Number(elapsedMs) || 0) / 1000);
    if (rawSeconds <= 0) {
      return { bonus: 0, seconds: 0 };
    }
    const cappedSeconds = Math.min(rawSeconds, MAX_OFFLINE_SECONDS);
    const bonus =
      Math.round(ratePerSecond * cappedSeconds * OFFLINE_EFFICIENCY * 100) / 100;
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
      const minutes = Math.max(1, Math.round(seconds / 60));
      offlineModalDesc.textContent =
        'Tim Otomatis mengumpulkan penghasilan selama ' +
        (seconds < 60 ? seconds + ' detik' : minutes + ' menit') +
        ' Anda tidak aktif (efisiensi 50%, batas maksimal 2 jam).';
    }
    offlineModal.hidden = false;
  }

  /**
   * Memformat bilangan bulat dengan pemisah ribuan titik (.).
   */
  function formatIntegerID(value) {
    const safeInt = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    return String(safeInt).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Memformat timestamp menjadi tanggal singkat DD/MM/YYYY.
   */
  function formatDateShort(timestamp) {
    const d = new Date(Number.isFinite(timestamp) ? timestamp : Date.now());
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return day + '/' + month + '/' + year;
  }

  /**
   * Memuat data dari localStorage dengan migrasi otomatis dari Save Schema v1 ke v2.
   */
  function loadState() {
    const now = Date.now();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state.startDate = now;
        state.lastSeen = now;
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const isV2 = Number(parsed.version) >= SAVE_SCHEMA_VERSION;
        const loadedBalance = Number(parsed.balance);
        const loadedPerClick = Number(parsed.perClick);

        state.balance =
          Number.isFinite(loadedBalance) && loadedBalance >= 0
            ? Math.round(loadedBalance * 100) / 100
            : 0;

        UPGRADE_TIERS.forEach(function (tier) {
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
          state.perClick = BASE_PER_CLICK;
        }
        state.perSecond = recalculatePerSecond();

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
          state.version = SAVE_SCHEMA_VERSION;
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
      window.clearTimeout(saveThrottleTimer);
      saveThrottleTimer = null;
    }
    hasPendingSave = false;
    state.lastSeen = Date.now();
    try {
      const payload = JSON.stringify({
        version: SAVE_SCHEMA_VERSION,
        balance: state.balance,
        perClick: state.perClick,
        totalTaps: state.totalTaps,
        totalEarned: state.totalEarned,
        upgrades: Object.assign({}, state.upgrades),
        startDate: state.startDate,
        lastSeen: state.lastSeen
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      // Abaikan jika kuota penyimpanan penuh atau mode privat ketat
    }
  }

  /**
   * Memastikan penyimpanan tertunda langsung ditulis (saat tab ditutup/sembunyi).
   */
  function flushSaveState() {
    if (hasPendingSave || saveThrottleTimer) {
      writeSaveImmediate();
    } else {
      writeSaveImmediate();
    }
  }

  /**
   * Menyimpan payload Save Schema v2 ke localStorage dengan throttle trailing-edge 500ms.
   */
  function saveState() {
    state.lastSeen = Date.now();
    hasPendingSave = true;
    if (saveThrottleTimer) {
      return;
    }
    saveThrottleTimer = window.setTimeout(function () {
      saveThrottleTimer = null;
      if (hasPendingSave) {
        writeSaveImmediate();
      }
    }, SAVE_THROTTLE_MS);
  }

  /**
   * Merender statistik dasar pemain pada tab Profile.
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
  }

  /**
   * Mereset seluruh data permainan ke nilai awal ($ 0,00 dan statistik nol).
   */
  function resetAllData() {
    const now = Date.now();
    state.version = SAVE_SCHEMA_VERSION;
    state.balance = 0.0;
    state.perClick = BASE_PER_CLICK;
    state.perSecond = 0.0;
    state.totalTaps = 0;
    state.totalEarned = 0.0;
    UPGRADE_TIERS.forEach(function (tier) {
      state.upgrades[tier.id] = 0;
    });
    state.startDate = now;
    state.lastSeen = now;
    acknowledgedAffordableCount = 0;
    if (offlineModal) {
      offlineModal.hidden = true;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Abaikan jika penyimpanan dibatasi
    }
    writeSaveImmediate();
    setTabBadge('Earnings', 0);
    setTabBadge('Profile', 0);
    renderStats();
    renderUpgrades();
    renderProfileStats();
  }

  /**
   * Merender daftar 3 tier upgrade beserta status tombol beli.
   */
  function renderUpgrades() {
    if (!upgradesList) return;

    if (upgradesList.childElementCount === 0) {
      UPGRADE_TIERS.forEach(function (tier) {
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

    UPGRADE_TIERS.forEach(function (tier) {
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
   * Menghitung berapa banyak tier upgrade yang saat ini terjangkau oleh saldo.
   */
  function countAffordableUpgrades() {
    let count = 0;
    UPGRADE_TIERS.forEach(function (tier) {
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
   * Memperbarui badge dinamis berdasarkan kondisi nyata (upgrade terjangkau).
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
   * Membeli upgrade berdasarkan id jika saldo mencukupi.
   */
  function buyUpgrade(upgradeId) {
    const tier = UPGRADE_TIERS.find(function (item) {
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
    return true;
  }

  /**
   * Memperbarui teks saldo utama, nominal per ketuk/detik, dan ukuran font adaptif.
   */
  function renderStats() {
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
    if (formattedBalance.length > 18) {
      balanceDisplay.classList.add('bank-card__balance--ultra-compact');
    } else if (formattedBalance.length > 14) {
      balanceDisplay.classList.add('bank-card__balance--compact');
    }
  }

  /**
   * Memberikan animasi memantul halus (scale pulse) pada ikon tangan SVG.
   */
  function triggerHandPulse() {
    tapHandIcon.classList.remove('is-pulsing');
    // Paksa reflow ringan agar animasi langsung diulang pada ketukan cepat beruntun
    void tapHandIcon.offsetWidth;
    tapHandIcon.classList.add('is-pulsing');

    if (pulseCleanupTimer) {
      window.clearTimeout(pulseCleanupTimer);
    }
    pulseCleanupTimer = window.setTimeout(function () {
      tapHandIcon.classList.remove('is-pulsing');
    }, 240);
  }

  /**
   * Memunculkan efek riak sentuh & teks angka melayang ("+$1,00") di titik sentuhan jari.
   */
  function spawnFloatingFeedback(clientX, clientY, amount) {
    const rect = tapArea.getBoundingClientRect();

    // Tentukan titik relatif di dalam tapArea (fallback ke tengah jika dipicu keyboard)
    let localX = rect.width / 2;
    let localY = rect.height / 2 - 24;

    if (typeof clientX === 'number' && typeof clientY === 'number' && (clientX !== 0 || clientY !== 0)) {
      localX = clientX - rect.left;
      localY = clientY - rect.top;
    }

    // Jaga agar teks melayang tidak terpotong di tepi kiri/kanan layar
    const horizontalPadding = 46;
    const clampedX = Math.max(horizontalPadding, Math.min(rect.width - horizontalPadding, localX));
    const clampedY = Math.max(28, Math.min(rect.height - 24, localY));

    // Variasi horizontal tipis agar ketukan beruntun tampak dinamis dan tidak bertumpuk kaku
    const jitterX = (Math.random() - 0.5) * 12;

    // Batasi jumlah elemen efek di DOM agar tetap ringan pada ketukan sangat cepat
    while (tapEffectsLayer.childElementCount >= MAX_ACTIVE_PARTICLES) {
      if (tapEffectsLayer.firstElementChild) {
        tapEffectsLayer.firstElementChild.remove();
      } else {
        break;
      }
    }

    // 1. Efek lingkaran riak halus di titik sentuh
    const rippleEl = document.createElement('span');
    rippleEl.className = 'tap-ripple';
    rippleEl.style.left = clampedX + 'px';
    rippleEl.style.top = clampedY + 'px';
    rippleEl.addEventListener('animationend', function () {
      rippleEl.remove();
    });

    // 2. Teks angka melayang "+$1,00"
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
   * Memproses satu ketukan pada Interactive Tap Area:
   * tambah saldo -> simpan otomatis ke localStorage -> perbarui UI & animasi.
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
    triggerHandPulse();
    spawnFloatingFeedback(clientX, clientY, state.perClick);
  }

  /**
   * Mengatur perpindahan tab pada Bottom Navigation Bar.
   */
  function switchTab(tabName) {
    state.activeTab = tabName;
    setTabBadge(tabName, 0);
    if (tabName === 'Earnings') {
      acknowledgedAffordableCount = countAffordableUpgrades();
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

    if (tabName === 'Earnings') {
      previewScreen.hidden = true;
      earningsScreen.hidden = false;
      earningsScreen.classList.add('screen--active');
      previewScreen.classList.remove('screen--active');
    } else {
      const moduleInfo = MODULE_PREVIEWS[tabName] || MODULE_PREVIEWS.Investing;
      previewTitle.textContent = '';
      const brandSpan = document.createElement('span');
      brandSpan.setAttribute('lang', 'en');
      brandSpan.textContent = tabName;
      previewTitle.appendChild(brandSpan);
      previewTitle.appendChild(document.createTextNode(' — Dalam Pengembangan'));
      previewDescription.textContent = moduleInfo.description;
      if (previewIconContainer) {
        previewIconContainer.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' +
          moduleInfo.iconId +
          '"></use></svg>';
      }
      previewBalanceDisplay.textContent = '$ ' + formatCurrencyValue(state.balance);

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
    // Penanganan sentuhan layar langsung (mendukung ketukan cepat & multi-jari di Android)
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

    // Penanganan klik mouse / desktop (diabaikan sesaat setelah touchstart agar tidak terhitung ganda)
    tapArea.addEventListener('click', function (event) {
      if (Date.now() - lastTouchTimestamp < 500) {
        return;
      }
      processTap(event.clientX, event.clientY);
    });

    // Dukungan aksesibilitas papan ketik pada area ketuk
    tapArea.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        processTap(0, 0);
      }
    });

    // Matikan menu konteks tahan-lama dan zoom klik-ganda pada area permainan
    tapArea.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });
    document.addEventListener('dblclick', function (event) {
      event.preventDefault();
    });

    // Navigasi 5 tab bawah
    navTabs.forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        const targetTab = tabBtn.getAttribute('data-tab');
        if (targetTab) {
          switchTab(targetTab);
        }
      });
    });

    // Pembelian upgrade per-click
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

    // Tombol pintas kembali ke tab Earnings dari layar pratinjau
    backToEarningsBtn.addEventListener('click', function () {
      switchTab('Earnings');
    });

    // Modal Roadmap ("Lihat Roadmap")
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

    // Modal Reset Semua Data (Konfirmasi Dua Langkah)
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

    // Modal Sambutan Penghasilan Luring
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

    // Simpan seketika saat tab disembunyikan, dan sinkronkan tampilan saat kembali terlihat
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
    window.addEventListener('beforeunload', flushSaveState);
    window.addEventListener('pagehide', flushSaveState);
  }

  /**
   * Satu siklus pendapatan pasif per detik (hanya merender DOM jika tab terlihat).
   */
  function runPassiveTick() {
    if (state.perSecond <= 0) return;

    state.balance = Math.round((state.balance + state.perSecond) * 100) / 100;
    state.totalEarned = Math.round((state.totalEarned + state.perSecond) * 100) / 100;
    saveState();

    if (document.visibilityState === 'visible') {
      renderStats();
      renderUpgrades();
      if (state.activeTab === 'Profile') {
        renderProfileStats();
      }
    }
  }

  /**
   * Memulai interval 1 detik untuk pendapatan pasif.
   */
  function startPassiveIncomeLoop() {
    if (passiveIntervalId) {
      window.clearInterval(passiveIntervalId);
    }
    passiveIntervalId = window.setInterval(runPassiveTick, PASSIVE_TICK_MS);
  }

  /**
   * Mendaftarkan Service Worker untuk dukungan PWA luring.
   */
  function registerServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () {
          // Abaikan jika dijalankan dari protokol file:// lokal
        });
      });
    }
  }

  // Inisialisasi aplikasi
  function init() {
    setTabBadge('Earnings', 0);
    setTabBadge('Profile', 0);
    loadState();
    renderStats();
    renderUpgrades();
    renderProfileStats();
    bindEvents();
    startPassiveIncomeLoop();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
