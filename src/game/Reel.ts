import { Container, Texture } from "pixi.js";
import { Symbol } from "./Symbol";
import gsap from "gsap";

export class Reel extends Container {
  public symbols: Symbol[] = [];
  private textures: Texture[];
  private symbolHeight: number;

  // Animation state
  private isSpinning: boolean = false;
  private speed: number = 0;
  private offset: number = 0; // Current scroll offset

  // Configuration
  private static readonly SYMBOL_COUNT = 5; // visible + buffer
  private static readonly SPIN_SPEED = 20;

  private reelWidth: number;

  constructor(textures: Texture[], width: number, height: number) {
    super();
    this.textures = textures;
    this.symbolHeight = height / 3; // 3 visible symbols
    this.reelWidth = width; // Reel width

    this.initSymbols();
  }

  private initSymbols() {
    for (let i = 0; i < Reel.SYMBOL_COUNT; i++) {
      const texture = this.getRandomTexture();
      const symbol = new Symbol(i, texture);
      symbol.setSize(this.reelWidth * 0.8, this.symbolHeight * 0.8);
      symbol.x = this.reelWidth / 2;
      this.symbols.push(symbol);
      this.addChild(symbol);
    }
    this.updatePositions();
  }

  private getRandomTexture(): Texture {
    return this.textures[Math.floor(Math.random() * this.textures.length)];
  }

  public update(delta: number) {
    if (this.isSpinning) {
      this.offset += this.speed * delta;
      this.updatePositions();
    }
  }

  private updatePositions() {
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      const rawY =
        (this.offset + i * this.symbolHeight) %
        (this.symbolHeight * this.symbols.length);
      symbol.y = rawY - this.symbolHeight;
    }
  }

  public spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    gsap.to(this, {
      speed: Reel.SPIN_SPEED,
      duration: 1,
      ease: "power2.in",
    });
  }

  public stop(targetTextureIndex: number) {
    // 1. Force symbol 0 to be the target (it will be the one landing)
    const targetSymbolIdx = 0;
    this.symbols[targetSymbolIdx].setTexture(this.textures[targetTextureIndex]);

    // 2. Calculate distance to land symbol[0] at y = symbolHeight (middle)
    // updatePositions: y = (offset + i*h) % (h*count) - h
    // Middle y = h.
    // So rawY must be 2*h => (offset + 0*h) % totalH = 2*h.

    const h = this.symbolHeight;
    const totalH = h * this.symbols.length;
    const targetOffsetMod = 2 * h;

    // Current offset mod calculation
    const currentMod = this.offset % totalH;
    let distance = (targetOffsetMod - currentMod + totalH) % totalH;

    // Add extra spins
    distance += totalH * 5;

    return new Promise<void>((resolve) => {
      gsap.to(this, {
        offset: this.offset + distance,
        duration: 2.5,
        ease: "back.out(0.5)",
        onComplete: () => {
          this.isSpinning = false;
          this.speed = 0;
          this.offset = this.offset % totalH; // Normalize
          this.updatePositions();
          resolve();
        },
      });
    });
  }
  public destroy(options?: any) {
    gsap.killTweensOf(this);
    super.destroy(options);
  }
}
