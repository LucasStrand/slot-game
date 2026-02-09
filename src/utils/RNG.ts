export class RNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  // Constants from commonly used specifications (e.g., glibc)
  public next(): number {
    const a = 1103515245;
    const c = 12345;
    const m = 2147483648;

    this.seed = (a * this.seed + c) % m;
    return this.seed / m; // Returns float 0..1
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}
