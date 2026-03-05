// Game Logic: RNG, payline evaluation, win calculation
import { SymbolId, SYMBOLS, buildWeightedPool } from "../config/symbols";
import { PAYLINES, type PaylinePattern } from "../config/paylines";
import { GAME_CONFIG } from "../config/gameConfig";

export interface WinResult {
  paylineIndex: number;
  pattern: PaylinePattern;
  symbolId: SymbolId;
  count: number;
  payout: number; // multiplier * bet per line
}

export interface SpinResult {
  grid: SymbolId[][]; // [reel][row]
  wins: WinResult[];
  totalWin: number;
  scatterCount: number;
  triggeredFreeSpins: boolean;
}

// xoshiro128** PRNG for high quality randomness
class PRNG {
  private s: Uint32Array;

  constructor(seed?: number) {
    this.s = new Uint32Array(4);
    const s = seed ?? Date.now();
    // SplitMix32 to seed xoshiro
    let z = s | 0;
    for (let i = 0; i < 4; i++) {
      z = (z + 0x9e3779b9) | 0;
      let t = z ^ (z >>> 16);
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ (t >>> 15);
      t = Math.imul(t, 0x735a2d97);
      t = t ^ (t >>> 15);
      this.s[i] = t >>> 0;
    }
  }

  private rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  next(): number {
    const result = (this.rotl(Math.imul(this.s[1], 5), 7) * 9) >>> 0;
    const t = (this.s[1] << 9) >>> 0;

    this.s[2] = (this.s[2] ^ this.s[0]) >>> 0;
    this.s[3] = (this.s[3] ^ this.s[1]) >>> 0;
    this.s[1] = (this.s[1] ^ this.s[2]) >>> 0;
    this.s[0] = (this.s[0] ^ this.s[3]) >>> 0;
    this.s[2] = (this.s[2] ^ t) >>> 0;
    this.s[3] = this.rotl(this.s[3], 11);

    return result / 0x100000000; // 0..1
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

export class GameLogic {
  private rng: PRNG;
  private weightedPool: SymbolId[];

  constructor(seed?: number) {
    this.rng = new PRNG(seed);
    this.weightedPool = buildWeightedPool();
  }

  // Generate a random symbol based on weight
  randomSymbol(): SymbolId {
    return this.weightedPool[this.rng.nextInt(this.weightedPool.length)];
  }

  // Generate a full 5x3 grid of random symbols
  generateGrid(): SymbolId[][] {
    const grid: SymbolId[][] = [];
    for (let reel = 0; reel < GAME_CONFIG.REEL_COUNT; reel++) {
      const column: SymbolId[] = [];
      for (let row = 0; row < GAME_CONFIG.ROWS_VISIBLE; row++) {
        column.push(this.randomSymbol());
      }
      grid.push(column);
    }
    return grid;
  }

  // Generate extended reel strips for spinning animation
  generateReelStrip(length: number): SymbolId[] {
    const strip: SymbolId[] = [];
    for (let i = 0; i < length; i++) {
      strip.push(this.randomSymbol());
    }
    return strip;
  }

  // Evaluate wins on a grid
  evaluateWins(
    grid: SymbolId[][],
    activeLines: number,
    betPerLine: number,
  ): { wins: WinResult[]; totalWin: number } {
    const wins: WinResult[] = [];
    let totalWin = 0;

    // Check each active payline
    for (let i = 0; i < Math.min(activeLines, PAYLINES.length); i++) {
      const pattern = PAYLINES[i];
      const result = this.evaluatePayline(grid, pattern, betPerLine);
      if (result) {
        result.paylineIndex = i;
        wins.push(result);
        totalWin += result.payout;
      }
    }

    return { wins, totalWin };
  }

  // Evaluate a single payline
  private evaluatePayline(
    grid: SymbolId[][],
    pattern: PaylinePattern,
    betPerLine: number,
  ): WinResult | null {
    // Get symbols on this payline
    const lineSymbols: SymbolId[] = pattern.map((row, reel) => grid[reel][row]);

    // Find first non-wild symbol (left to right)
    let matchSymbol: SymbolId | null = null;
    for (const sym of lineSymbols) {
      if (sym !== SymbolId.WILD && sym !== SymbolId.SCATTER) {
        matchSymbol = sym;
        break;
      }
    }

    // All wilds
    if (matchSymbol === null) {
      if (lineSymbols.every((s) => s === SymbolId.WILD)) {
        matchSymbol = SymbolId.WILD;
      } else {
        return null;
      }
    }

    // Count consecutive matching symbols from left (wilds substitute)
    let count = 0;
    for (const sym of lineSymbols) {
      if (sym === matchSymbol || sym === SymbolId.WILD) {
        count++;
      } else {
        break;
      }
    }

    // Need at least 3 matching symbols
    if (count < 3) return null;

    const symbolDef = SYMBOLS[matchSymbol];
    const multiplier = symbolDef.payouts[count];
    if (!multiplier) return null;

    return {
      paylineIndex: 0,
      pattern,
      symbolId: matchSymbol,
      count,
      payout: multiplier * betPerLine,
    };
  }

  // Count scatter symbols anywhere on the grid
  countScatters(grid: SymbolId[][]): number {
    let count = 0;
    for (const reel of grid) {
      for (const sym of reel) {
        if (sym === SymbolId.SCATTER) count++;
      }
    }
    return count;
  }

  // Full spin evaluation
  spin(
    activeLines: number,
    betPerLine: number,
    freeSpinMultiplier: number = 1,
  ): SpinResult {
    const grid = this.generateGrid();
    const { wins, totalWin } = this.evaluateWins(grid, activeLines, betPerLine);
    const scatterCount = this.countScatters(grid);
    const triggeredFreeSpins = scatterCount >= 3;

    // Scatter pays out based on total bet (not per-line) when 3+ appear anywhere
    const totalBet = betPerLine * activeLines;
    const scatterMultiplier = SYMBOLS[SymbolId.SCATTER].payouts[scatterCount] ?? 0;
    const scatterPayout = scatterCount >= 3 ? scatterMultiplier * totalBet : 0;

    return {
      grid,
      wins,
      totalWin: (totalWin + scatterPayout) * freeSpinMultiplier,
      scatterCount,
      triggeredFreeSpins,
    };
  }

  // Gamble feature: 50/50 coin flip
  gamble(): boolean {
    return this.rng.next() >= 0.5;
  }
}
