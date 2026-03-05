// SlotGame: Main game controller — initializes PixiJS, manages state machine
import { Application, Container, Graphics } from "pixi.js";
import { GAME_CONFIG } from "../config/gameConfig";
import { SymbolId } from "../config/symbols";
import { Reel } from "./Reel";
import { GameLogic, type SpinResult } from "./GameLogic";
import { WinPresentation } from "./WinPresentation";
import { ParticleSystem } from "./ParticleSystem";
import { soundManager } from "./SoundManager";

export type GameState =
  | "idle"
  | "spinning"
  | "stopping"
  | "win_check"
  | "win_present"
  | "free_spin";

export interface GameStateData {
  state: GameState;
  balance: number;
  totalBet: number;
  lastWin: number;
  betLevel: number;
  betIndex: number;
  activeLines: number;
  lineIndex: number;
  freeSpinsRemaining: number;
  freeSpinTotalWin: number;
  autoSpinsRemaining: number;
  winMessage: string;
}

export class SlotGame {
  app: Application;
  private reels: Reel[] = [];
  private reelContainer!: Container;
  private gameLogic: GameLogic;
  private winPresentation!: WinPresentation;
  private particleSystem!: ParticleSystem;
  private mask!: Graphics;
  private _initialized = false;

  // State
  private _state: GameState = "idle";
  private _balance: number = GAME_CONFIG.STARTING_BALANCE;
  private _betIndex: number = GAME_CONFIG.DEFAULT_BET_INDEX;
  private _lineIndex: number = GAME_CONFIG.DEFAULT_LINE_INDEX;
  private _lastWin: number = 0;
  private _freeSpinsRemaining: number = 0;
  private _freeSpinTotalWin: number = 0;
  private _autoSpinsRemaining: number = 0;
  private _winMessage: string = "";

  // Callbacks
  onStateChange?: (state: GameStateData) => void;
  private lastSpinResult: SpinResult | null = null;

  constructor() {
    this.app = new Application();
    this.gameLogic = new GameLogic();
  }

  async init(canvas: HTMLCanvasElement) {
    // Compute canvas size dynamically from config
    const { REEL_COUNT, SYMBOL_SIZE, REEL_GAP, SYMBOL_GAP, ROWS_VISIBLE } = GAME_CONFIG;
    const contentW = REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_GAP;
    const contentH = ROWS_VISIBLE * SYMBOL_SIZE + (ROWS_VISIBLE - 1) * SYMBOL_GAP;
    const canvasW = contentW + 60; // 30px padding each side
    const canvasH = contentH + 60;

    await this.app.init({
      canvas,
      width: canvasW,
      height: canvasH,
      backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    soundManager.init();
    this.createBackground();
    this.createReels();
    this.winPresentation = new WinPresentation(this.app);
    this.particleSystem = new ParticleSystem(this.app);
    this.particleSystem.startAmbient();
    this._initialized = true;
    this.emitState();
  }

  private createBackground() {
    // Only subtle glow behind reels on the Pixi canvas; frame is handled by CSS wrapper.
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: GAME_CONFIG.COLORS.BACKGROUND, alpha: 0.5 });

    bg.circle(w / 2, h / 2, 250);
    bg.fill({ color: 0x1a1a4a, alpha: 0.4 });
    bg.circle(w / 2, h / 2, 150);
    bg.fill({ color: 0x00e5ff, alpha: 0.1 });

    this.app.stage.addChild(bg);
  }

  private createReels() {
    this.reelContainer = new Container();
    const { REEL_COUNT, SYMBOL_SIZE, REEL_GAP, SYMBOL_GAP, ROWS_VISIBLE } =
      GAME_CONFIG;
    // Content dimensions (symbol left/right edges define the actual extent)
    const contentW = REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_GAP;
    const contentH =
      ROWS_VISIBLE * SYMBOL_SIZE + (ROWS_VISIBLE - 1) * SYMBOL_GAP;
    // startX = left edge of first symbol
    const startX = (this.app.screen.width - contentW) / 2;
    // Center the reels vertically in the canvas
    const reelStartY = (this.app.screen.height - contentH) / 2;
    // Reel containers are centered — reel i center x = startX + SYMBOL_SIZE/2 + i*(SYMBOL_SIZE+REEL_GAP)
    const reelCenterX0 = startX + SYMBOL_SIZE / 2;

    for (let i = 0; i < REEL_COUNT; i++) {
      const reel = new Reel(i);
      reel.container.x = reelCenterX0 + i * (SYMBOL_SIZE + REEL_GAP);
      // Reel.visibleY(0) = SYM/2, so row-0 symbol center = container.y + SYM/2
      // We want row-0 top at reelStartY → center at reelStartY + SYM/2
      // → container.y = reelStartY  (Reel adds SYM/2 internally via visibleY)
      reel.container.y = reelStartY;
      this.reelContainer.addChild(reel.container);
      this.reels.push(reel);

      // Set initial symbols
      const initialSymbols: SymbolId[] = [];
      for (let r = 0; r < ROWS_VISIBLE; r++) {
        initialSymbols.push(this.gameLogic.randomSymbol());
      }
      reel.setResult(initialSymbols);
    }

    // Mask covers the exact visible reel content area
    this.mask = new Graphics();
    this.mask.rect(startX, reelStartY, contentW, contentH);
    this.mask.fill({ color: 0xffffff });
    this.app.stage.addChild(this.mask);
    this.reelContainer.mask = this.mask;

    this.app.stage.addChild(this.reelContainer);
  }

  // State management
  private emitState() {
    const betLevel = GAME_CONFIG.BET_LEVELS[this._betIndex];
    const activeLines = GAME_CONFIG.LINE_OPTIONS[this._lineIndex];

    this.onStateChange?.({
      state: this._state,
      balance: this._balance,
      totalBet: betLevel * activeLines,
      lastWin: this._lastWin,
      betLevel,
      betIndex: this._betIndex,
      activeLines,
      lineIndex: this._lineIndex,
      freeSpinsRemaining: this._freeSpinsRemaining,
      freeSpinTotalWin: this._freeSpinTotalWin,
      autoSpinsRemaining: this._autoSpinsRemaining,
      winMessage: this._winMessage,
    });
  }

  // --- Actions ---

  async spin() {
    if (this._state !== "idle") return;

    const betLevel = GAME_CONFIG.BET_LEVELS[this._betIndex];
    const activeLines = GAME_CONFIG.LINE_OPTIONS[this._lineIndex];
    const totalBet = betLevel * activeLines;

    if (this._balance < totalBet && this._freeSpinsRemaining <= 0) return;

    // Capture free spin state BEFORE decrementing so the multiplier applies correctly
    const freeSpinActive = this._freeSpinsRemaining > 0;

    // Deduct bet (unless free spin)
    if (!freeSpinActive) {
      this._balance -= totalBet;
    } else {
      this._freeSpinsRemaining--;
    }

    this._lastWin = 0;
    this._winMessage = "";
    this._state = "spinning";
    this.emitState();

    // Clear previous wins
    this.winPresentation.clear();

    // Sound
    soundManager.playSpinStart();
    this.lastSpinResult = this.gameLogic.spin(
      activeLines,
      betLevel,
      freeSpinActive ? GAME_CONFIG.FREE_SPIN_MULTIPLIER : 1,
    );

    // Spin each reel with staggered delays
    const spinPromises = this.reels.map((reel, i) =>
      reel
        .spin(this.lastSpinResult!.grid[i], i * GAME_CONFIG.REEL_STOP_DELAY)
        .then(() => {
          soundManager.playReelStop(i);
        }),
    );

    await Promise.all(spinPromises);

    // All reels stopped
    this._state = "win_check";
    this.emitState();

    // Check wins
    await this.evaluateWins();
  }

  private async evaluateWins() {
    if (!this.lastSpinResult) return;

    const result = this.lastSpinResult;
    const betLevel = GAME_CONFIG.BET_LEVELS[this._betIndex];
    const activeLines = GAME_CONFIG.LINE_OPTIONS[this._lineIndex];
    const totalBet = betLevel * activeLines;

    if (result.wins.length > 0 || result.triggeredFreeSpins) {
      this._state = "win_present";
      this.emitState();

      // Show win lines
      const reelPositions = this.reels.map((reel) => {
        return reel.symbolPositions.map((pos) => ({
          x: reel.container.x + pos.x,
          y: reel.container.y + pos.y,
        }));
      });

      if (result.wins.length > 0) {
        this.winPresentation.showWinLines(result.wins, reelPositions);
        this.winPresentation.showWinAmount(result.totalWin, totalBet);

        // Update balance
        this._balance += result.totalWin;
        this._lastWin = result.totalWin;

        // Win message
        const ratio = result.totalWin / totalBet;
        if (ratio >= GAME_CONFIG.WIN_TIER_ULTRA) {
          this._winMessage = "ULTRA WIN!!!";
        } else if (ratio >= GAME_CONFIG.WIN_TIER_MEGA) {
          this._winMessage = "MEGA WIN!";
        } else if (ratio >= GAME_CONFIG.WIN_TIER_BIG) {
          this._winMessage = "BIG WIN!";
        } else {
          this._winMessage = `WIN $${result.totalWin.toFixed(2)}`;
        }

        // Free spin tracking
        if (this._freeSpinsRemaining > 0) {
          this._freeSpinTotalWin += result.totalWin;
        }

        this.emitState();

        // Particle burst on winning symbols
        for (const win of result.wins) {
          for (let r = 0; r < win.count; r++) {
            const row = win.pattern[r];
            if (reelPositions[r] && reelPositions[r][row]) {
              this.particleSystem.burst(
                reelPositions[r][row].x,
                reelPositions[r][row].y,
                8,
                GAME_CONFIG.COLORS.GOLD,
              );
            }
          }
        }

        // Big win coin rain
        if (ratio >= GAME_CONFIG.WIN_TIER_BIG) {
          this.particleSystem.coinRain(2000);
        }
      }

      // Free spins trigger
      if (result.triggeredFreeSpins && this._freeSpinsRemaining <= 0) {
        this._freeSpinsRemaining = GAME_CONFIG.FREE_SPIN_COUNT;
        this._freeSpinTotalWin = 0;
        this._winMessage = `${GAME_CONFIG.FREE_SPIN_COUNT} FREE SPINS!`;
        soundManager.playFreeSpinTrigger();
        this.emitState();
      }

      // Wait for win presentation
      const waitTime =
        result.totalWin / totalBet >= GAME_CONFIG.WIN_TIER_BIG ? 3500 : 2000;
      await new Promise((r) => setTimeout(r, waitTime));
    }

    this._state = "idle";
    this.emitState();

    // Auto-spin or free spin continuation
    if (this._freeSpinsRemaining > 0) {
      setTimeout(() => this.spin(), 500);
    } else if (this._autoSpinsRemaining > 0) {
      this._autoSpinsRemaining--;
      this.emitState();
      setTimeout(() => this.spin(), 300);
    }
  }

  // Bet controls
  changeBet(delta: number) {
    if (this._state !== "idle") return;
    const newIndex = this._betIndex + delta;
    if (newIndex >= 0 && newIndex < GAME_CONFIG.BET_LEVELS.length) {
      this._betIndex = newIndex;
      soundManager.playButtonClick();
      this.emitState();
    }
  }

  changeLines(delta: number) {
    if (this._state !== "idle") return;
    const newIndex = this._lineIndex + delta;
    if (newIndex >= 0 && newIndex < GAME_CONFIG.LINE_OPTIONS.length) {
      this._lineIndex = newIndex;
      soundManager.playButtonClick();
      this.emitState();
    }
  }

  maxBet() {
    if (this._state !== "idle") return;
    this._betIndex = GAME_CONFIG.BET_LEVELS.length - 1;
    this._lineIndex = GAME_CONFIG.LINE_OPTIONS.length - 1;
    soundManager.playButtonClick();
    this.emitState();
  }

  setAutoSpin(count: number) {
    if (this._state !== "idle") return;
    this._autoSpinsRemaining = count;
    soundManager.playButtonClick();
    this.emitState();
    if (count > 0) {
      this.spin();
    }
  }

  stopAutoSpin() {
    this._autoSpinsRemaining = 0;
    this.emitState();
  }

  // Gamble feature
  async gamble(): Promise<boolean> {
    if (this._lastWin <= 0) return false;
    soundManager.playButtonClick();
    const won = this.gameLogic.gamble();
    if (won) {
      this._lastWin *= 2;
      this._balance += this._lastWin / 2; // already had the original win
      this._winMessage = `GAMBLE WIN! $${this._lastWin.toFixed(2)}`;
      soundManager.playWinBig();
    } else {
      this._balance -= this._lastWin;
      this._lastWin = 0;
      this._winMessage = "GAMBLE LOST";
    }
    this.emitState();
    return won;
  }

  resize(width: number, height: number) {
    if (this.app.renderer) {
      this.app.renderer.resize(width, height);
    }
  }

  destroy() {
    if (!this._initialized) return;
    this._initialized = false;
    this.particleSystem?.stopAmbient();
    this.app.destroy(true);
  }
}
