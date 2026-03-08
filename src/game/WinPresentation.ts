// Win Presentation: line drawing, symbol highlighting, celebration effects
import { Application, Graphics, Text, TextStyle, Container } from "pixi.js";
import { gsap } from "gsap";
import { PAYLINE_COLORS } from "../config/paylines";
import { GAME_CONFIG } from "../config/gameConfig";
import type { WinResult } from "./GameLogic";
import { soundManager } from "./SoundManager";

export type ScatterPosition = { x: number; y: number };

export class WinPresentation {
  private app: Application;
  private lineContainer: Container;
  private overlayContainer: Container;
  private winTextContainer: Container;
  private activeAnimations: gsap.core.Tween[] = [];

  constructor(app: Application) {
    this.app = app;
    this.lineContainer = new Container();
    this.overlayContainer = new Container();
    this.winTextContainer = new Container();
    app.stage.addChild(this.lineContainer);
    app.stage.addChild(this.overlayContainer);
    app.stage.addChild(this.winTextContainer);
  }

  // Clear all win presentations
  clear() {
    this.activeAnimations.forEach((a) => a.kill());
    this.activeAnimations = [];
    this.lineContainer.removeChildren();
    this.overlayContainer.removeChildren();
    this.winTextContainer.removeChildren();
  }

  // Show win lines
  showWinLines(wins: WinResult[], reelPositions: { x: number; y: number }[][]) {
    this.clear();

    wins.forEach((win, index) => {
      setTimeout(() => {
        this.drawWinLine(win, reelPositions, index);
      }, index * 400);
    });
  }

  private drawWinLine(
    win: WinResult,
    reelPositions: { x: number; y: number }[][],
    _winIndex: number,
  ) {
    const line = new Graphics();
    const color = PAYLINE_COLORS[win.paylineIndex % PAYLINE_COLORS.length];

    // Draw connecting line through winning positions
    const points: { x: number; y: number }[] = [];
    for (let reel = 0; reel < win.count; reel++) {
      const row = win.pattern[reel];
      if (reelPositions[reel] && reelPositions[reel][row]) {
        points.push(reelPositions[reel][row]);
      }
    }

    if (points.length < 2) return;

    // Glow line (thicker, slightly transparent)
    line.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      line.lineTo(points[i].x, points[i].y);
    }
    line.stroke({ width: 6, color, alpha: 0.4 });

    // Main line
    line.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      line.lineTo(points[i].x, points[i].y);
    }
    line.stroke({ width: 3, color, alpha: 0.9 });

    // Highlight circles on winning symbols
    for (const p of points) {
      line.circle(p.x, p.y, GAME_CONFIG.SYMBOL_SIZE * 0.4);
      line.stroke({ width: 2, color, alpha: 0.7 });
      line.circle(p.x, p.y, GAME_CONFIG.SYMBOL_SIZE * 0.4);
      line.fill({ color, alpha: 0.1 });
    }

    line.alpha = 0;
    this.lineContainer.addChild(line);

    const tween = gsap.to(line, {
      alpha: 1,
      duration: 0.3,
      ease: "power2.out",
      yoyo: true,
      repeat: 3,
      repeatDelay: 0.5,
      onComplete: () => {
        gsap.to(line, { alpha: 0, duration: 0.3 });
      },
    });
    this.activeAnimations.push(tween);
  }

  // Show win amount text with tier-appropriate presentation
  showWinAmount(amount: number, totalBet: number) {
    const ratio = amount / totalBet;
    const { WIN_TIER_BIG, WIN_TIER_MEGA, WIN_TIER_ULTRA } = GAME_CONFIG;

    if (ratio >= WIN_TIER_ULTRA) {
      this.showUltraWin(amount);
    } else if (ratio >= WIN_TIER_MEGA) {
      this.showMegaWin(amount);
    } else if (ratio >= WIN_TIER_BIG) {
      this.showBigWin(amount);
    } else {
      this.showRegularWin(amount);
    }
  }

  private showRegularWin(amount: number) {
    soundManager.playWinSmall();
    const text = this.createWinText(`WIN $${amount.toFixed(2)}`, 36, "#FFD700");
    this.animateWinText(text, 0.8);
  }

  private showBigWin(amount: number) {
    soundManager.playWinBig();
    this.showDarkOverlay(0.3);
    const text = this.createWinText("BIG WIN!", 64, "#FFD700");
    const amountText = this.createWinText(
      `$${amount.toFixed(2)}`,
      48,
      "#FFFFFF",
      50,
    );
    this.animateWinText(text, 1.2);
    this.animateWinText(amountText, 1.2, 0.3);
    this.createCoinBurst();
  }

  private showMegaWin(amount: number) {
    soundManager.playWinMega();
    this.showDarkOverlay(0.5);
    const text = this.createWinText("MEGA WIN!", 80, "#FF00FF");
    const amountText = this.createWinText(
      `$${amount.toFixed(2)}`,
      56,
      "#FFD700",
      60,
    );
    this.animateWinText(text, 2.0);
    this.animateWinText(amountText, 2.0, 0.5);
    this.createCoinBurst();
    this.createScreenShake();
  }

  private showUltraWin(amount: number) {
    soundManager.playWinMega();
    this.showDarkOverlay(0.6);
    const text = this.createWinText("ULTRA WIN!!!", 96, "#00E5FF");
    const amountText = this.createWinText(
      `$${amount.toFixed(2)}`,
      64,
      "#FFD700",
      70,
    );
    this.animateWinText(text, 3.0);
    this.animateWinText(amountText, 3.0, 0.7);
    this.createCoinBurst();
    this.createCoinBurst();
    this.createScreenShake();
  }

  private createWinText(
    msg: string,
    size: number,
    color: string,
    yOffset: number = 0,
  ): Text {
    const style = new TextStyle({
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      fontSize: size,
      fontWeight: "bold",
      fill: color,
      stroke: { color: "#000000", width: 4 },
      dropShadow: {
        color: color,
        blur: 20,
        distance: 0,
        alpha: 0.8,
      },
    });

    const text = new Text({ text: msg, style });
    text.anchor.set(0.5);
    text.x = this.app.screen.width / 2;
    text.y = this.app.screen.height / 2 - 30 + yOffset;
    text.alpha = 0;
    text.scale.set(0.3);
    this.winTextContainer.addChild(text);
    return text;
  }

  private animateWinText(text: Text, duration: number, delay: number = 0) {
    const tween = gsap.timeline({ delay });
    tween.to(text, {
      alpha: 1,
      duration: 0.4,
      ease: "back.out(2)",
    });
    tween.to(
      text.scale,
      {
        x: 1,
        y: 1,
        duration: 0.4,
        ease: "back.out(2)",
      },
      "<",
    );
    tween.to(text, {
      alpha: 0,
      duration: 0.3,
      delay: duration - 0.7,
    });
    tween.to(
      text.scale,
      {
        x: 1.3,
        y: 1.3,
        duration: 0.3,
      },
      "<",
    );

    this.activeAnimations.push(tween as unknown as gsap.core.Tween);
  }

  private showDarkOverlay(opacity: number) {
    const overlay = new Graphics();
    overlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.fill({ color: 0x000000, alpha: 0 });
    this.overlayContainer.addChild(overlay);

    const tween = gsap.to(overlay, {
      alpha: opacity,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      repeatDelay: 1.5,
    });
    this.activeAnimations.push(tween);
  }

  private createCoinBurst() {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const coin = new Graphics();
      coin.circle(0, 0, 6 + Math.random() * 4);
      coin.fill({ color: 0xffd700 });
      coin.circle(0, 0, 3 + Math.random() * 2);
      coin.fill({ color: 0xffa500 });

      coin.x = this.app.screen.width / 2;
      coin.y = this.app.screen.height / 2;
      this.overlayContainer.addChild(coin);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const distance = 150 + Math.random() * 200;
      const targetX = coin.x + Math.cos(angle) * distance;
      const targetY = coin.y + Math.sin(angle) * distance;

      const tween = gsap.to(coin, {
        x: targetX,
        y: targetY + 100,
        alpha: 0,
        duration: 1 + Math.random() * 0.5,
        ease: "power2.out",
        delay: Math.random() * 0.2,
        onComplete: () => coin.destroy(),
      });
      this.activeAnimations.push(tween);
    }
  }

  private createScreenShake() {
    const stage = this.app.stage;
    const origX = stage.x;
    const origY = stage.y;

    const tween = gsap.to(stage, {
      x: origX + 5,
      y: origY + 3,
      duration: 0.05,
      repeat: 8,
      yoyo: true,
      ease: "none",
      onComplete: () => {
        stage.x = origX;
        stage.y = origY;
      },
    });
    this.activeAnimations.push(tween);
  }

  // Full bonus intro sequence — awaitable, ~3.1 s total
  async showBonusTrigger(
    scatterPositions: ScatterPosition[],
    freeSpinCount: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const W = this.app.screen.width;
      const H = this.app.screen.height;

      // Deep dark overlay
      const overlay = new Graphics();
      overlay.rect(0, 0, W, H);
      overlay.fill({ color: 0x000820, alpha: 0 });
      this.overlayContainer.addChild(overlay);
      const overlayIn = gsap.to(overlay, { alpha: 0.88, duration: 0.45 });
      this.activeAnimations.push(overlayIn);

      // Three expanding cyan pulse rings per scatter
      scatterPositions.forEach((pos, i) => {
        for (let ring = 0; ring < 3; ring++) {
          const circle = new Graphics();
          circle.circle(0, 0, GAME_CONFIG.SYMBOL_SIZE * 0.44);
          circle.stroke({ width: 3, color: 0x00e5ff, alpha: 1 });
          circle.x = pos.x;
          circle.y = pos.y;
          circle.scale.set(0.2);
          circle.alpha = 0.9;
          this.overlayContainer.addChild(circle);

          const delay = i * 0.12 + ring * 0.18;
          const st = gsap.to(circle.scale, {
            x: 5,
            y: 5,
            duration: 0.9,
            delay,
            ease: "power2.out",
          });
          const at = gsap.to(circle, {
            alpha: 0,
            duration: 0.9,
            delay,
            ease: "power2.in",
            onComplete: () => circle.destroy(),
          });
          this.activeAnimations.push(st, at);
        }
      });

      // Diamond burst from each scatter at 0.4 s
      setTimeout(
        () => scatterPositions.forEach((p) => this.createDiamondBurst(p.x, p.y)),
        400,
      );

      // "💎 BONUS 💎" heading
      const bonusText = new Text({
        text: "💎  BONUS  💎",
        style: new TextStyle({
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          fontSize: 90,
          fontWeight: "bold",
          fill: "#00E5FF",
          stroke: { color: "#003060", width: 6 },
          dropShadow: { color: "#00E5FF", blur: 40, distance: 0, alpha: 1 },
        }),
      });
      bonusText.anchor.set(0.5);
      bonusText.x = W / 2;
      bonusText.y = H / 2 - 44;
      bonusText.alpha = 0;
      bonusText.scale.set(0.2);
      this.winTextContainer.addChild(bonusText);

      // "X FREE SPINS" sub-text
      const spinsText = new Text({
        text: `${freeSpinCount} FREE SPINS`,
        style: new TextStyle({
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          fontSize: 52,
          fontWeight: "bold",
          fill: "#FFD700",
          stroke: { color: "#5a3a00", width: 5 },
          dropShadow: { color: "#FFD700", blur: 28, distance: 0, alpha: 0.9 },
        }),
      });
      spinsText.anchor.set(0.5);
      spinsText.x = W / 2;
      spinsText.y = H / 2 + 52;
      spinsText.alpha = 0;
      spinsText.scale.set(0.2);
      this.winTextContainer.addChild(spinsText);

      // Animate texts in at 0.5 s
      setTimeout(() => {
        const tl = gsap.timeline();
        tl.to(bonusText, { alpha: 1, duration: 0.4, ease: "back.out(2)" });
        tl.to(
          bonusText.scale,
          { x: 1, y: 1, duration: 0.45, ease: "back.out(2.5)" },
          "<",
        );
        tl.to(spinsText, { alpha: 1, duration: 0.35, ease: "back.out(2)" }, "-=0.15");
        tl.to(
          spinsText.scale,
          { x: 1, y: 1, duration: 0.35, ease: "back.out(2.5)" },
          "<",
        );
        this.activeAnimations.push(tl as unknown as gsap.core.Tween);
        this.createScreenShake();
      }, 500);

      // Gentle pulse on bonusText while visible
      setTimeout(() => {
        const pulse = gsap.to(bonusText.scale, {
          x: 1.06,
          y: 1.06,
          duration: 0.5,
          yoyo: true,
          repeat: 3,
          ease: "sine.inOut",
        });
        this.activeAnimations.push(pulse);
      }, 1000);

      // Fade everything out at 2.5 s then resolve
      setTimeout(() => {
        gsap.to([bonusText, spinsText, overlay], {
          alpha: 0,
          duration: 0.6,
          ease: "power2.in",
          onComplete: () => {
            bonusText.destroy();
            spinsText.destroy();
            overlay.destroy();
            resolve();
          },
        });
      }, 2500);
    });
  }

  private createDiamondBurst(x: number, y: number) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const gem = new Graphics();
      gem.poly([0, -9, 7, 0, 0, 9, -7, 0]);
      gem.fill({ color: i % 2 === 0 ? 0x00e5ff : 0xffd700 });
      gem.x = x;
      gem.y = y;
      gem.alpha = 1;
      gem.scale.set(0.5 + Math.random() * 0.5);
      this.overlayContainer.addChild(gem);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const distance = 70 + Math.random() * 130;
      const tween = gsap.to(gem, {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 20,
        alpha: 0,
        rotation: Math.random() * Math.PI * 4,
        duration: 1.0 + Math.random() * 0.5,
        ease: "power2.out",
        delay: Math.random() * 0.15,
        onComplete: () => gem.destroy(),
      });
      this.activeAnimations.push(tween);
    }
  }
}
