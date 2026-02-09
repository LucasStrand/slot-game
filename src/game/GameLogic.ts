import { PAYLINES } from "../config/Paylines";
import { RNG } from "../utils/RNG";

export interface PaylineWin {
  lineIndex: number;
  symbolId: number;
  count: number;
  amount: number;
}

export class GameLogic {
  private rng: RNG;
  private symbolCount: number;

  // Symbol payouts (ID -> Payout for 3, 4, 5 matches)
  // Simplified for now: ID 0 pays 10, ID 1 pays 20, etc.
  private payouts: Record<number, number[]> = {
    0: [0, 0, 5, 20, 100],
    1: [0, 0, 10, 40, 200],
    2: [0, 0, 20, 80, 400],
    3: [0, 0, 40, 160, 800], // High value
    4: [0, 0, 100, 500, 2000], // Jackpot
  };

  constructor(seed: number, symbolCount: number) {
    this.rng = new RNG(seed);
    this.symbolCount = symbolCount;
  }

  public spin(reelCount: number): number[][] {
    // Generate a 5x3 grid of symbol IDs
    // Actually we just need the stop position for each reel.
    // But let's simulate the grid to make payline checking easier.
    // Wait, the reel strips are fixed in a real slot.
    // For this simple version, let's assume random stop positions on virtual infinite strips.
    // So we generate 3 symbols per reel directly.

    const result: number[][] = [];
    for (let i = 0; i < reelCount; i++) {
      const reelSymbols: number[] = [];
      for (let j = 0; j < 3; j++) {
        reelSymbols.push(this.rng.nextInt(0, this.symbolCount - 1));
      }
      result.push(reelSymbols);
    }
    return result;
  }

  public checkWins(grid: number[][]): PaylineWin[] {
    const wins: PaylineWin[] = [];

    PAYLINES.forEach((line, lineIndex) => {
      const firstSymbol = grid[0][line[0]];
      let matchCount = 1;

      for (let r = 1; r < 5; r++) {
        const symbol = grid[r][line[r]];
        if (symbol === firstSymbol) {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= 3) {
        const payout = this.getPayout(firstSymbol, matchCount);
        if (payout > 0) {
          wins.push({
            lineIndex,
            symbolId: firstSymbol,
            count: matchCount,
            amount: payout,
          });
        }
      }
    });

    return wins;
  }

  private getPayout(symbolId: number, count: number): number {
    const table = this.payouts[symbolId];
    if (!table || count >= table.length) return 0;
    return table[count];
  }
}
