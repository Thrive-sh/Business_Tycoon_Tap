/* ==========================================================================
   BUSINESS SIMULATOR - CORE GAME LOGIC & UI CONTROLLER (game.js)
   ========================================================================== */

(function () {
  'use strict';

  // Kunci penyimpanan otomatis di localStorage
  const STORAGE_KEY = 'business_simulator_save_v1';
  const MAX_ACTIVE_PARTICLES = 40;
  const BASE_PER_CLICK = 1.0;
  const COST_GROWTH_FACTOR = 1.15;

  // Definisi 3 tier upgrade per-click
  const UPGRADE_TIERS = [
    {
      id: 'gloves',
      name: 'Sarung Tangan',
      baseCost: 15,
      clickBonus: 1
    },
    {
      id: 'tap_machine',
      name: 'Mesin Tap',
      baseCost: 100,
      clickBonus: 5
    },
    {
      id: 'auto_team',
      name: 'Tim Otomatis',
      baseCost: 500,
      clickBonus: 25
    }
  ];

  // Data deskripsi & ikon SVG vektor untuk layar pratinjau modul lain
  const MODULE_PREVIEWS = {
    Investing: {
      description:
        'Bangun portofolio saham perusahaan teknologi, obligasi, dan real estat berimbal hasil tinggi untuk pendapatan pasif.',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M16 7H21V12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M4 20H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.55" />
        </svg>
      `
    },
    Business: {
      description:
        'Dirikan jaringan ritel, pabrik manufaktur, hingga korporasi multinasional dan kelola ekspansi bisnis Anda.',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 21V4.5C4 3.94772 4.44772 3.5 5 3.5H13C13.5523 3.5 14 3.94772 14 4.5V21" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M14 9.5H19C19.5523 9.5 20 9.94772 20 10.5V21" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M2.5 21H21.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" />
          <path d="M7.5 7.5H10.5M7.5 11H10.5M7.5 14.5H10.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          <path d="M16.5 13H17.5M16.5 16.5H17.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
        </svg>
      `
    },
    Items: {
      description:
        'Koleksi aset prestisius mulai dari supercar, kapal pesiar, jet pribadi, hingga karya seni langka kelas dunia.',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.8L20 7.3V16.7L12 21.2L4 16.7V7.3L12 2.8Z" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round" />
          <path d="M4 7.3L12 11.8L20 7.3" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 11.8V21.2" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" />
          <path d="M8 5.05L16 9.55" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
        </svg>
      `
    },
    Profile: {
      description:
        'Pantau total kekayaan bersih, statistik ketukan, lencana pencapaian, serta peringkat kerajaan bisnis Anda.',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="3.8" stroke="currentColor" stroke-width="2.1" />
          <path d="M4.8 20.2C4.8 16.5 7.9 14.2 12 14.2C16.1 14.2 19.2 16.5 19.2 20.2" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" />
        </svg>
      `
    }
  };

  // State utama permainan
  const state = {
    balance: 0.0,
    perClick: BASE_PER_CLICK,
    upgrades: {
      gloves: 0,
      tap_machine: 0,
      auto_team: 0
    },
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
  const backToEarningsBtn = document.getElementById('back-to-earnings-btn');
  const navTabs = Array.from(document.querySelectorAll('.nav-tab'));
  const navBadges = {
    Earnings: document.querySelector('[data-nav-badge="Earnings"]'),
    Profile: document.querySelector('[data-nav-badge="Profile"]')
  };

  let lastTouchTimestamp = 0;
  let pulseCleanupTimer = null;
  let acknowledgedAffordableCount = 0;

  /**
   * Memformat angka ke format pemisah ribuan titik (.) dan desimal koma (,).
   * Contoh: 0 -> "0,00" | 1250.5 -> "1.250,50"
   */
  function formatCurrencyValue(amount) {
    const safeNumber = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    const fixed = safeNumber.toFixed(2);
    const parts = fixed.split('.');
    const integerWithDots = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return integerWithDots + ',' + parts[1];
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
   * Memuat data saldo, nilai per click, dan level upgrade dari localStorage.
   */
  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const loadedBalance = Number(parsed.balance);
        const loadedPerClick = Number(parsed.perClick);

        if (Number.isFinite(loadedBalance) && loadedBalance >= 0) {
          state.balance = Math.round(loadedBalance * 100) / 100;
        }
        if (parsed.upgrades && typeof parsed.upgrades === 'object') {
          UPGRADE_TIERS.forEach(function (tier) {
            const lvl = Number(parsed.upgrades[tier.id]);
            state.upgrades[tier.id] = Number.isFinite(lvl) && lvl >= 0 ? Math.floor(lvl) : 0;
          });
          state.perClick = recalculatePerClick();
        } else if (Number.isFinite(loadedPerClick) && loadedPerClick > 0) {
          state.perClick = Math.round(loadedPerClick * 100) / 100;
        }
      }
    } catch (error) {
      // Abaikan jika penyimpanan lokal dibatasi oleh pengaturan privasi peramban
    }
  }

  /**
   * Menyimpan data saldo, nilai per click, dan level upgrade ke localStorage.
   */
  function saveState() {
    try {
      const payload = JSON.stringify({
        balance: state.balance,
        perClick: state.perClick,
        upgrades: Object.assign({}, state.upgrades)
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      // Abaikan jika kuota penyimpanan penuh atau mode privat ketat
    }
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
        levelEl.textContent = 'Lv. ' + level;
      }
      if (effectEl) {
        effectEl.textContent = '+$' + formatCurrencyValue(tier.clickBonus) + ' per click';
      }
      if (btn) {
        btn.textContent = 'Beli $ ' + formatCurrencyValue(cost);
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
    saveState();
    renderStats();
    renderUpgrades();
    return true;
  }

  /**
   * Memperbarui teks saldo utama, nominal per click, dan ukuran font adaptif.
   */
  function renderStats() {
    const formattedBalance = '$ ' + formatCurrencyValue(state.balance);
    const formattedPerClick = '$ ' + formatCurrencyValue(state.perClick) + ' per click';

    balanceDisplay.textContent = formattedBalance;
    previewBalanceDisplay.textContent = formattedBalance;
    perClickDisplay.textContent = formattedPerClick;

    // Sesuaikan ukuran huruf bila saldo sudah mencapai digit puluhan juta/miliar
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
    saveState();
    renderStats();
    renderUpgrades();
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
      const isSelected = tabBtn.getAttribute('data-tab') === tabName;
      tabBtn.classList.toggle('nav-tab--active', isSelected);
      if (isSelected) {
        tabBtn.setAttribute('aria-current', 'page');
      } else {
        tabBtn.removeAttribute('aria-current');
      }
    });

    if (tabName === 'Earnings') {
      previewScreen.hidden = true;
      earningsScreen.hidden = false;
      earningsScreen.classList.add('screen--active');
      previewScreen.classList.remove('screen--active');
    } else {
      const moduleInfo = MODULE_PREVIEWS[tabName] || MODULE_PREVIEWS.Investing;
      previewTitle.textContent = 'Modul ' + tabName + ' - Segera Hadir';
      previewDescription.textContent = moduleInfo.description;
      previewIconContainer.innerHTML = moduleInfo.svg;
      previewBalanceDisplay.textContent = '$ ' + formatCurrencyValue(state.balance);

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
  }

  // Inisialisasi aplikasi
  function init() {
    setTabBadge('Earnings', 0);
    setTabBadge('Profile', 0);
    loadState();
    renderStats();
    renderUpgrades();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
