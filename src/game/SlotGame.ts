import { Application, Container, Texture, Graphics, Ticker } from "pixi.js";
import gsap from "gsap";
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

  public async initialize(element: HTMLElement) {
    await this.app.init({
      background: "#0a0a2a",
      resizeTo: element,
      width: this.width,
      height: this.height,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    element.appendChild(this.app.canvas);
    this.app.stage.addChild(this.gameContainer);

    this.generatePlaceholderTextures();
    this.initReels();
    this.setupResizeListener();
    this.startLoop();

    console.log("SlotGame initialized");
  }

  private generatePlaceholderTextures() {
    // 5 distinct symbols
    const colors = [0xff0055, 0x00ff55, 0x5500ff, 0xffff00, 0x00ffff];
    this.textures = colors.map((color, i) => {
      const g = new Graphics();
      g.rect(0, 0, 150, 150);
      g.fill(color);
      g.stroke({ width: 8, color: 0xffffff });
      g.circle(75, 75, 30);
      g.fill(0x000000);
      return this.app.renderer.generateTexture(g);
    });
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
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true,
    });
  }
}
