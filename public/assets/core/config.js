/* ==========================================================================
   BUSINESS TYCOON TAP - KONFIGURASI TERPUSAT PERMAINAN
   Seluruh konstanta numerik baru WAJIB ditambahkan di sini (lihat // END_CONFIG)
   ========================================================================== */

export const CONFIG = Object.freeze({
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
  SPARKLINE_WIDTH: 64,
  SPARKLINE_HEIGHT: 26,
  SPARKLINE_VIEWBOX_PADDING: 1,
  SPARKLINE_FLAT_RATIO: 0.5,
  SPARKLINE_MIN_POINTS: 2,
  FULL_CIRCLE_TURNS: 2,
  DONUT_RADIUS: 79,
  ALLOC_DECIMALS: 1,
  TILE_PRICE_COMPACT_THRESHOLD: 100000,
  HERO_COMPACT_THRESHOLD: 1e9,
  INVEST_CATEGORY_COUNT: 4,
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
  CARD_GLINT_DURATION_MS: 420,
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
  CHART_STROKE_COLOR: '#D97706',
  CHART_DOT_BG_COLOR: '#FFFFFF',
  CHART_FILL_TOP: 'rgba(245, 158, 11, 0.24)',
  CHART_FILL_BOTTOM: 'rgba(245, 158, 11, 0.0)',
  CHART_GRID_COLOR: 'rgba(148, 163, 184, 0.22)',
  CHART_LABEL_COLOR: '#5B6678',
  CHART_FONT: '600 10px Inter, system-ui, -apple-system, sans-serif',
  DEFAULT_TRADE_QTY: '1',
  THOUSANDS_GROUP_REGEX: /\B(?=(\d{3})+(?!\d))/g,
  INVEST_SUMMARY_LABELS: {
    Saham: 'Total nilai saham',
    Properti: 'Total nilai properti',
    Kripto: 'Total nilai kriptocurrency',
    Forex: 'Total nilai forex'
  },
  USD_THOUSANDS_GROUP_REGEX: /\B(?=(\d{3})+(?!\d))/g,
  COMPACT_UNITS: [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'M' },
    { threshold: 1e6, suffix: 'jt' },
    { threshold: 1e3, suffix: 'rb' }
  ],
  COMPACT_UNITS_US: [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' }
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
