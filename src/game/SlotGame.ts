import { Application, Container, Texture, Graphics } from "pixi.js";
import { Reel } from "./Reel";
import { GameLogic } from "./GameLogic";

export class SlotGame {
  private app: Application;
  private gameContainer: Container;
  private width: number;
  private height: number;
  private reels: Reel[] = [];
  private gameLogic: GameLogic;
  private textures: Texture[] = [];
  private isSpinning: boolean = false;
  private onBalanceUpdate?: (balance: number) => void;
  private balance: number = 1000;

  constructor(
    width: number,
    height: number,
    onBalanceUpdate?: (balance: number) => void,
  ) {
    this.width = width;
    this.height = height;
    this.onBalanceUpdate = onBalanceUpdate;
    this.app = new Application();
    this.gameContainer = new Container();
    this.gameLogic = new GameLogic(Date.now(), 5); // 5 symbols
  }

  private isInitialized = false;
  private isDestroyed = false;

  public async initialize(element: HTMLElement) {
    if (this.isInitialized || this.isDestroyed) return;

    await this.app.init({
      background: "#0a0a2a",
      resizeTo: element,
      width: this.width,
      height: this.height,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    if (this.isDestroyed) {
      // Cleanup was called while we were initializing
      this.safeDestroy();
      return;
    }

    this.isInitialized = true;

    element.appendChild(this.app.canvas);
    this.app.stage.addChild(this.gameContainer);

    this.generatePlaceholderTextures();
    this.initReels();
    this.setupResizeListener();
    this.startLoop();

    console.log("SlotGame initialized");
  }

  private generatePlaceholderTextures() {
    const symbolSize = 150;

    // Helper to create base graphics
    const createBase = () => {
      const g = new Graphics();
      // Transparent background, maybe a subtle glow container
      g.rect(0, 0, symbolSize, symbolSize);
      g.fill({ color: 0x000000, alpha: 0.5 }); // Semi-transparent black box
      g.stroke({ width: 2, color: 0x333333 });
      return g;
    };

    this.textures = [];

    // 1. Cherry (Red/Green) - Simplified Neon Style
    const g1 = createBase();
    g1.circle(50, 90, 25)
      .fill(0xff0040)
      .stroke({ width: 4, color: 0xff0040, alpha: 0.8 });
    g1.circle(100, 90, 25)
      .fill(0xff0040)
      .stroke({ width: 4, color: 0xff0040, alpha: 0.8 });
    // Stems
    g1.moveTo(50, 65)
      .lineTo(75, 30)
      .lineTo(100, 65)
      .stroke({ width: 5, color: 0x00ff00 });
    g1.moveTo(75, 30).lineTo(90, 40).stroke({ width: 5, color: 0x00ff00 }); // Leaf
    this.textures.push(this.app.renderer.generateTexture(g1));

    // 2. Seven (Purple/Pink)
    const g2 = createBase();
    g2.moveTo(40, 40)
      .lineTo(110, 40)
      .lineTo(60, 110)
      .stroke({ width: 12, color: 0xd000ff });
    this.textures.push(this.app.renderer.generateTexture(g2));

    // 3. Bar (Golden/Yellow)
    const g3 = createBase();
    g3.roundRect(30, 50, 90, 50, 10)
      .fill(0x000000)
      .stroke({ width: 6, color: 0xffd700 });
    g3.rect(35, 60, 80, 5).fill(0xffd700);
    g3.rect(35, 72, 80, 5).fill(0xffd700);
    g3.rect(35, 84, 80, 5).fill(0xffd700);
    this.textures.push(this.app.renderer.generateTexture(g3));

    // 4. Bell (Cyan)
    const g4 = createBase();
    g4.moveTo(75, 30);
    g4.bezierCurveTo(30, 100, 20, 100, 20, 110);
    g4.lineTo(130, 110);
    g4.bezierCurveTo(130, 100, 120, 100, 75, 30);
    g4.fill(0x000000).stroke({ width: 6, color: 0x00ffff });
    g4.circle(75, 110, 8).fill(0x00ffff);
    this.textures.push(this.app.renderer.generateTexture(g4));

    // 5. Diamond (Blue/White)
    const g5 = createBase();
    g5.moveTo(75, 30)
      .lineTo(120, 75)
      .lineTo(75, 120)
      .lineTo(30, 75)
      .closePath();
    g5.fill(0x000044).stroke({ width: 6, color: 0x4488ff });
    g5.moveTo(75, 30).lineTo(75, 120).stroke({ width: 2, color: 0x4488ff });
    g5.moveTo(30, 75).lineTo(120, 75).stroke({ width: 2, color: 0x4488ff });
    this.textures.push(this.app.renderer.generateTexture(g5));
  }

  private initReels() {
    const reelWidth = 200;
    const reelHeight = 600;
    const margin = 20;
    const totalWidth = 5 * reelWidth + 4 * margin;
    const startX = (this.width - totalWidth) / 2;
    const startY = (this.height - reelHeight) / 2;

    for (let i = 0; i < 5; i++) {
      const reel = new Reel(this.textures, reelWidth, reelHeight);
      reel.x = startX + i * (reelWidth + margin);
      reel.y = startY;
      this.gameContainer.addChild(reel);
      this.reels.push(reel);
    }

    // Masking
    const mask = new Graphics();
    mask.rect(startX, startY, totalWidth, reelHeight);
    mask.fill(0xffffff);
    this.gameContainer.mask = mask;
    this.gameContainer.addChild(mask);
  }

  public async spin() {
    if (this.isSpinning || this.balance < 10) return;
    this.isSpinning = true;
    this.balance -= 10;
    if (this.onBalanceUpdate) this.onBalanceUpdate(this.balance);

    const reelCount = this.reels.length;
    this.reels.forEach((reel, i) => {
      setTimeout(() => reel.spin(), i * 100);
    });

    // Determine result immediately
    const resultGrid = this.gameLogic.spin(reelCount);
    // We only need the center row for the stop command if using simple logic,
    // but Reel.stop might expect an index.
    // Let's assume Reel stores symbols 0..N.
    // We pass the STOP INDEX (the symbol index that should land at the center).

    // Wait, Reel.stop expects an index from the texture array?
    // Let's assume resultGrid[1] (middle row) contains the symbol IDs we want to show.
    const stopSymbols = resultGrid.map((col) => col[1]); // Middle row

    // Stop sequence
    setTimeout(() => {
      this.reels.forEach((reel, i) => {
        setTimeout(() => {
          reel.stop(stopSymbols[i]);
          if (i === reelCount - 1) {
            // Last reel stopped
            setTimeout(() => {
              this.isSpinning = false;
              this.checkWin(resultGrid);
            }, 500); // Wait for bounce to finish
          }
        }, i * 500); // Stagger stops
      });
    }, 2000); // Spin duration
  }

  private checkWin(grid: number[][]) {
    const wins = this.gameLogic.checkWins(grid);
    let totalWin = 0;
    if (wins.length > 0) {
      console.log("Wins:", wins);
      wins.forEach((w) => (totalWin += w.amount));
      this.balance += totalWin;
      if (this.onBalanceUpdate) this.onBalanceUpdate(this.balance);
      alert(`You won ${totalWin}!`);
    }
  }

  private setupResizeListener() {
    window.addEventListener("resize", () => {
      this.app.resize();
      // Could recenter reels here
    });
  }

  private startLoop() {
    this.app.ticker.add((ticker) => {
      const delta = ticker.deltaTime;
      this.reels.forEach((reel) => reel.update(delta));
    });
  }

  public cleanUp() {
    this.isDestroyed = true;
    this.safeDestroy();
  }

  private safeDestroy() {
    try {
      // Check if renderer exists (proxy for initialized enough to destroy)
      if (this.app.renderer) {
        this.app.destroy(true, {
          children: true,
          texture: true,
        });
      }
    } catch (e) {
      console.warn("SlotGame cleanup warning:", e);
    }
  }
}
