// Core game configuration
export const GAME_CONFIG = {
  // Grid
  REEL_COUNT: 5,
  ROWS_VISIBLE: 3,
  ROWS_TOTAL: 4, // extra row for scroll buffer

  // Symbol sizing
  SYMBOL_SIZE: 110,
  SYMBOL_GAP: 8,

  // Reel spacing
  REEL_GAP: 10,

  // Spin timing
  SPIN_SPEED: 30, // pixels per tick at full speed
  SPIN_ACCEL_TIME: 0.3, // seconds to reach full speed
  SPIN_DECEL_TIME: 0.6, // seconds to decelerate
  REEL_STOP_DELAY: 200, // ms between each reel stopping
  BOUNCE_OVERSHOOT: 1.4, // Back.easeOut overshoot

  // Bet config
  BET_LEVELS: [0.2, 0.4, 0.6, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  DEFAULT_BET_INDEX: 3,
  LINE_OPTIONS: [1, 5, 9, 15, 20],
  DEFAULT_LINE_INDEX: 4,

  // Player
  STARTING_BALANCE: 1000.0,

  // Win tiers (multiplier of total bet)
  WIN_TIER_BIG: 10,
  WIN_TIER_MEGA: 25,
  WIN_TIER_ULTRA: 50,

  // Free spins
  FREE_SPIN_COUNT: 10,
  FREE_SPIN_MULTIPLIER: 3,

  // Colors
  COLORS: {
    BACKGROUND: 0x0a0a1a,
    REEL_BG: 0x12122a,
    REEL_BORDER: 0x2a2a5a,
    GOLD: 0xffd700,
    CYAN: 0x00e5ff,
    PURPLE: 0x9c27b0,
    WIN_LINE: 0xffd700,
    TEXT_PRIMARY: 0xffffff,
    TEXT_SECONDARY: 0xaaaacc,
  },
} as const;
