// Single Reel: infinite scrolling strip with spin/stop animation
import { Container } from "pixi.js";
import { gsap } from "gsap";
import { SymbolId, SYMBOLS, buildWeightedPool } from "../config/symbols";
import { GAME_CONFIG } from "../config/gameConfig";

const SYM = GAME_CONFIG.SYMBOL_SIZE;
const GAP = GAME_CONFIG.SYMBOL_GAP;
const CELL = SYM + GAP; // height of one cell (symbol + gap)

export class Reel {
  container: Container;
  private symbolContainers: Container[] = [];
  private strip: SymbolId[] = [];
  private isSpinning = false;
  private reelIndex: number;

  // Absolute positions (in reelContainer space) for win-line drawing
  symbolPositions: { x: number; y: number }[] = [];

  constructor(reelIndex: number) {
    this.reelIndex = reelIndex;
    this.container = new Container();
    this.initStrip();
    this.createSymbols();
  }

  private initStrip() {
    const pool = buildWeightedPool();
    this.strip = [];
    for (let i = 0; i < 40; i++) {
      this.strip.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }

  /**
   * Coordinate system:
   *  – Each symbol is drawn centered at its container's (0, 0).
   *  – We place ROWS_VISIBLE + 2 containers (1 buffer above, 3 visible, 1+ buffer below).
   *  – The visible rows (indices 1..3) are positioned so their TOP edges go
   *    from y = 0 to y = (ROWS_VISIBLE − 1) * CELL + SYM.
   *  – A symbol center for visible row i is at: y = i * CELL + SYM / 2.
   *  – Buffer row 0 is at y = −CELL + SYM / 2 (above the mask).
   */
  private visibleY(row: number): number {
    return row * CELL + SYM / 2;
  }

  private createSymbols() {
    const { ROWS_VISIBLE } = GAME_CONFIG;
    const totalSlots = ROWS_VISIBLE + 2; // 1 buffer top + 3 visible + 1 buffer bottom

    for (let i = 0; i < totalSlots; i++) {
      const symContainer = new Container();
      const symbolId = this.strip[i % this.strip.length];
      this.renderSymbol(symContainer, symbolId);

      // i=0 → buffer above (row = -1), i=1..3 → visible, i=4 → buffer below
      symContainer.y = this.visibleY(i - 1);
      this.container.addChild(symContainer);
      this.symbolContainers.push(symContainer);
    }
  }

  private renderSymbol(container: Container, symbolId: SymbolId) {
    container.removeChildren();

    const sym = SYMBOLS[symbolId];

    // Image Sprite only
    if (sym.assetUrl) {
      import("pixi.js").then(({ Sprite, Assets }) => {
        Assets.load(sym.assetUrl).then((texture) => {
          // Check if the container still represents the same symbol before adding
          if (
            (container as Container & { symbolId?: SymbolId }).symbolId ===
            symbolId
          ) {
            const sprite = new Sprite(texture);
            sprite.anchor.set(0.5);

            // Scale to fit the cell almost entirely (95% of SYM)
            const scale = (SYM * 0.95) / Math.max(sprite.width, sprite.height);
            sprite.scale.set(scale);

            // Center perfectly
            sprite.y = 0;
            container.addChild(sprite);
          }
        });
      });
    }

    (container as Container & { symbolId?: SymbolId }).symbolId = symbolId;
  }

  /** Place final result symbols in the 3 visible rows */
  setResult(symbols: SymbolId[]) {
    const { ROWS_VISIBLE } = GAME_CONFIG;
    for (let i = 0; i < ROWS_VISIBLE; i++) {
      if (i + 1 < this.symbolContainers.length && i < symbols.length) {
        this.renderSymbol(this.symbolContainers[i + 1], symbols[i]);
        this.symbolContainers[i + 1].y = this.visibleY(i);
      }
    }
    this.updateSymbolPositions();
  }

  updateSymbolPositions() {
    const { ROWS_VISIBLE } = GAME_CONFIG;
    this.symbolPositions = [];
    for (let i = 0; i < ROWS_VISIBLE; i++) {
      this.symbolPositions.push({
        x: 0, // relative to reel container
        y: this.visibleY(i),
      });
    }
  }

  // Spin animation
  async spin(finalSymbols: SymbolId[], delay: number): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;

    const totalSlots = this.symbolContainers.length;

    return new Promise((resolve) => {
      setTimeout(() => {
        const spinDistance = CELL * (15 + this.reelIndex * 3);
        const spinDuration = 0.8 + this.reelIndex * 0.25;

        // Randomize symbols during spin for visual chaos
        const randomizeInterval = setInterval(() => {
          if (!this.isSpinning) {
            clearInterval(randomizeInterval);
            return;
          }
          const pool = Object.values(SymbolId);
          for (let i = 0; i < totalSlots; i++) {
            const randomSym = pool[
              Math.floor(Math.random() * pool.length)
            ] as SymbolId;
            this.renderSymbol(this.symbolContainers[i], randomSym);
          }
        }, 80);

        // Animate all symbol containers downward
        const obj = { progress: 0 };
        gsap.to(obj, {
          progress: 1,
          duration: spinDuration,
          ease: "power1.in",
          onUpdate: () => {
            const offset = obj.progress * spinDistance;
            for (let i = 0; i < totalSlots; i++) {
              const baseY = this.visibleY(i - 1);
              this.symbolContainers[i].y =
                baseY + (offset % (CELL * totalSlots));
            }
          },
          onComplete: () => {
            clearInterval(randomizeInterval);

            // Set final symbols
            this.setResult(finalSymbols);

            // Reset ALL container positions to default grid
            for (let i = 0; i < totalSlots; i++) {
              this.symbolContainers[i].y = this.visibleY(i - 1);
            }

            // Bounce effect on stop
            const savedY = this.container.y;
            gsap.fromTo(
              this.container,
              { y: savedY - 15 },
              {
                y: savedY,
                duration: 0.4,
                ease: "elastic.out(1.2, 0.4)",
                onComplete: () => {
                  this.isSpinning = false;
                  this.updateSymbolPositions();
                  resolve();
                },
              },
            );
          },
        });
      }, delay);
    });
  }

  getIsSpinning(): boolean {
    return this.isSpinning;
  }
}
