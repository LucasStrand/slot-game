// Sound Manager using Web Audio API for procedural sound generation
// No external audio files needed - all sounds synthesized in real-time

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private volume = 0.5;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
  }

  private ensureContext() {
    if (!this.ctx || this.ctx.state === "suspended") {
      this.init();
      this.ctx?.resume();
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain)
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain)
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  }

  // --- Sound Effects ---

  playSpinStart() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    // Whoosh + mechanical click
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    filter.Q.value = 2;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // Click
    this.playClick(now, 0.15);
  }

  playReelStop(reelIndex: number) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const baseFreq = 150 + reelIndex * 30;

    // Thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);

    // Click accent
    this.playClick(now, 0.2);
  }

  playWinSmall() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }

  playWinBig() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Fanfare: C E G C(high) E(high)
    const notes = [523, 659, 784, 1047, 1319];

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.05);
      gain.gain.setValueAtTime(0.3, now + i * 0.12 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });

    // Impact bass
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = "sine";
    bass.frequency.setValueAtTime(80, now);
    bass.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    bassGain.gain.setValueAtTime(0.4, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    bass.connect(bassGain);
    bassGain.connect(this.masterGain!);
    bass.start(now);
    bass.stop(now + 0.5);
  }

  playWinMega() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Epic ascending fanfare
    const notes = [261, 329, 392, 523, 659, 784, 1047, 1319, 1568];

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const osc2 = this.ctx!.createOscillator();

      osc.type = "triangle";
      osc.frequency.value = freq;
      osc2.type = "sine";
      osc2.frequency.value = freq * 2;

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.05);
      gain.gain.setValueAtTime(0.25, now + i * 0.1 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.8);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.8);
      osc2.start(now + i * 0.1);
      osc2.stop(now + i * 0.1 + 0.8);
    });
  }

  playButtonClick() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    this.playClick(this.ctx.currentTime, 0.15);
  }

  playFreeSpinTrigger() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Magical shimmer
    for (let i = 0; i < 8; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 800 + i * 200 + Math.random() * 100;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    }
  }

  playCountUp() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playClick(time: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.02;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2000;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(time);
  }
}

// Singleton instance
export const soundManager = new SoundManager();
