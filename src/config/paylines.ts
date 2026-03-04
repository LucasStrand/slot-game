// 20 payline definitions for a 5x3 grid
// Each payline is an array of 5 row indices (0=top, 1=mid, 2=bottom)
// indicating which row to check on each reel

export type PaylinePattern = [number, number, number, number, number];

export const PAYLINES: PaylinePattern[] = [
  // Straight lines
  [1, 1, 1, 1, 1], // 1: Middle
  [0, 0, 0, 0, 0], // 2: Top
  [2, 2, 2, 2, 2], // 3: Bottom

  // V shapes
  [0, 1, 2, 1, 0], // 4: V
  [2, 1, 0, 1, 2], // 5: Inverted V

  // Zigzags
  [0, 0, 1, 2, 2], // 6: Down slope
  [2, 2, 1, 0, 0], // 7: Up slope
  [1, 0, 0, 0, 1], // 8: Top dip
  [1, 2, 2, 2, 1], // 9: Bottom dip

  // W shapes
  [0, 1, 0, 1, 0], // 10: W top
  [2, 1, 2, 1, 2], // 11: W bottom

  // Steps
  [0, 0, 1, 1, 2], // 12: Step down
  [2, 2, 1, 1, 0], // 13: Step up
  [1, 0, 1, 2, 1], // 14: Peak valley
  [1, 2, 1, 0, 1], // 15: Valley peak

  // Complex
  [0, 1, 1, 1, 0], // 16: Flat V
  [2, 1, 1, 1, 2], // 17: Flat inverted V
  [0, 2, 0, 2, 0], // 18: Zigzag wide
  [2, 0, 2, 0, 2], // 19: Zigzag wide inv
  [1, 0, 2, 0, 1], // 20: Diamond
];

// Colors for each payline (for visual display)
export const PAYLINE_COLORS: number[] = [
  0xff1744, 0x00e676, 0x2979ff, 0xffd600, 0xe040fb, 0x00bcd4, 0xff9100,
  0x76ff03, 0xf50057, 0x651fff, 0x00e5ff, 0xff6d00, 0x69f0ae, 0xea80fc,
  0xffff00, 0x18ffff, 0xff3d00, 0xb2ff59, 0xff80ab, 0xb388ff,
];
