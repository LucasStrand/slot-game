// Symbol definitions, payouts, and reel frequency weights

export const SymbolId = {
  WILD: "wild",
  SCATTER: "scatter",
  SEVEN: "seven",
  BELL: "bell",
  STAR: "star",
  CHERRY: "cherry",
  LEMON: "lemon",
  GRAPE: "grape",
  ORANGE: "orange",
} as const;

export type SymbolId = (typeof SymbolId)[keyof typeof SymbolId];

export interface SymbolDef {
  id: SymbolId;
  name: string;
  type: "wild" | "scatter" | "high" | "medium" | "low";
  emoji: string;
  assetUrl: string; // Path to image asset
  color: string; // Primary neon color
  glowColor: string; // Glow effect color
  payouts: Record<number, number>; // count -> multiplier
  weight: number; // Frequency weight on reels
}

export const SYMBOLS: Record<SymbolId, SymbolDef> = {
  [SymbolId.WILD]: {
    id: SymbolId.WILD,
    name: "Wild",
    type: "wild",
    emoji: "🃏",
    assetUrl: "/assets/symbols/wild_symbol_1772619426037.png",
    color: "#FFD700",
    glowColor: "#FFA500",
    payouts: { 3: 20, 4: 50, 5: 200 },
    weight: 2,
  },
  [SymbolId.SCATTER]: {
    id: SymbolId.SCATTER,
    name: "Diamond",
    type: "scatter",
    emoji: "💎",
    assetUrl: "/assets/symbols/scatter_diamond_1772619444174.png",
    color: "#00E5FF",
    glowColor: "#00BCD4",
    payouts: { 3: 2, 4: 10, 5: 50 }, // multiplied by total bet in spin()
    weight: 3,
  },
  [SymbolId.SEVEN]: {
    id: SymbolId.SEVEN,
    name: "Lucky 7",
    type: "high",
    emoji: "7️⃣",
    assetUrl: "/assets/symbols/lucky_seven_1772619531832.png",
    color: "#FF1744",
    glowColor: "#D50000",
    payouts: { 3: 10, 4: 50, 5: 250 },
    weight: 4,
  },
  [SymbolId.BELL]: {
    id: SymbolId.BELL,
    name: "Bell",
    type: "high",
    emoji: "🔔",
    assetUrl: "/assets/symbols/bell_symbol_1772619858355.png",
    color: "#FFD700",
    glowColor: "#FFC107",
    payouts: { 3: 8, 4: 40, 5: 150 },
    weight: 5,
  },
  [SymbolId.STAR]: {
    id: SymbolId.STAR,
    name: "Star",
    type: "high",
    emoji: "⭐",
    assetUrl: "/assets/symbols/star_symbol_1772620021495.png",
    color: "#E040FB",
    glowColor: "#AA00FF",
    payouts: { 3: 6, 4: 30, 5: 100 },
    weight: 6,
  },
  [SymbolId.CHERRY]: {
    id: SymbolId.CHERRY,
    name: "Cherry",
    type: "medium",
    emoji: "🍒",
    assetUrl: "/assets/symbols/cherry_symbol_1772620033030.png",
    color: "#FF4081",
    glowColor: "#F50057",
    payouts: { 3: 4, 4: 20, 5: 60 },
    weight: 8,
  },
  [SymbolId.LEMON]: {
    id: SymbolId.LEMON,
    name: "Lemon",
    type: "medium",
    emoji: "🍋",
    assetUrl: "/assets/symbols/lemon_symbol.png",
    color: "#FFEB3B",
    glowColor: "#FDD835",
    payouts: { 3: 3, 4: 15, 5: 40 },
    weight: 9,
  },
  [SymbolId.GRAPE]: {
    id: SymbolId.GRAPE,
    name: "Grape",
    type: "low",
    emoji: "🍇",
    assetUrl: "/assets/symbols/grape_symbol.png",
    color: "#9C27B0",
    glowColor: "#7B1FA2",
    payouts: { 3: 2, 4: 10, 5: 25 },
    weight: 10,
  },
  [SymbolId.ORANGE]: {
    id: SymbolId.ORANGE,
    name: "Orange",
    type: "low",
    emoji: "🍊",
    assetUrl: "/assets/symbols/orange_symbol.png",
    color: "#FF9800",
    glowColor: "#F57C00",
    payouts: { 3: 2, 4: 8, 5: 22 },
    weight: 10,
  },
};

// Ordered array for uniform access
export const SYMBOL_LIST = Object.values(SYMBOLS);

// Build weighted pool for RNG
export function buildWeightedPool(): SymbolId[] {
  const pool: SymbolId[] = [];
  for (const sym of SYMBOL_LIST) {
    for (let i = 0; i < sym.weight; i++) {
      pool.push(sym.id);
    }
  }
  return pool;
}
