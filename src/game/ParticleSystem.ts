// Ambient & celebration particle system using PixiJS Graphics
import { Application, Container, Graphics } from "pixi.js";
import { gsap } from "gsap";

interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  private app: Application;
  private container: Container;
  private ambientParticles: Particle[] = [];
  private burstParticles: Particle[] = [];
  private tickerCallback: (() => void) | null = null;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.container.zIndex = -1;
    app.stage.addChild(this.container);
  }

  startAmbient() {
    // Spawn ambient sparkles
    this.tickerCallback = () => this.update();
    this.app.ticker.add(this.tickerCallback);

    // Spawn initial ambient
    for (let i = 0; i < 20; i++) {
      this.spawnAmbientParticle(true);
    }
  }

  stopAmbient() {
    if (this.tickerCallback) {
      this.app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
  }

  private spawnAmbientParticle(randomAge: boolean = false) {
    const g = new Graphics();
    const size = 1 + Math.random() * 3;
    const alpha = 0.1 + Math.random() * 0.4;
    const color = Math.random() > 0.5 ? 0xffd700 : 0x00e5ff;

    g.circle(0, 0, size);
    g.fill({ color, alpha });

    g.x = Math.random() * this.app.screen.width;
    g.y = Math.random() * this.app.screen.height;

    this.container.addChild(g);

    const maxLife = 200 + Math.random() * 200;
    const particle: Particle = {
      graphic: g,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.5,
      life: randomAge ? Math.random() * maxLife : 0,
      maxLife,
      size,
    };

    this.ambientParticles.push(particle);
  }

  private update() {
    const dt = this.app.ticker.deltaTime;

    // Update ambient particles
    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const p = this.ambientParticles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        p.graphic.destroy();
        this.ambientParticles.splice(i, 1);
        this.spawnAmbientParticle();
        continue;
      }

      p.graphic.x += p.vx * dt;
      p.graphic.y += p.vy * dt;

      // Fade in/out
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio < 0.1) {
        p.graphic.alpha = (lifeRatio / 0.1) * 0.5;
      } else if (lifeRatio > 0.8) {
        p.graphic.alpha = ((1 - lifeRatio) / 0.2) * 0.5;
      }

      // Gentle sway
      p.graphic.x += Math.sin(p.life * 0.02) * 0.1;
    }

    // Update burst particles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        p.graphic.destroy();
        this.burstParticles.splice(i, 1);
        continue;
      }

      p.graphic.x += p.vx * dt;
      p.graphic.y += p.vy * dt;
      p.vy += 0.1 * dt; // gravity

      const lifeRatio = p.life / p.maxLife;
      p.graphic.alpha = 1 - lifeRatio;
      p.graphic.scale.set(1 - lifeRatio * 0.5);
    }
  }

  // Burst at position
  burst(x: number, y: number, count: number = 15, color: number = 0xffd700) {
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      const size = 2 + Math.random() * 4;
      g.circle(0, 0, size);
      g.fill({ color, alpha: 0.8 });

      g.x = x;
      g.y = y;
      this.container.addChild(g);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;

      const particle: Particle = {
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size,
      };
      this.burstParticles.push(particle);
    }
  }

  // Rain effect for big wins
  coinRain(duration: number = 3000) {
    const interval = setInterval(() => {
      const g = new Graphics();
      const size = 4 + Math.random() * 4;
      g.circle(0, 0, size);
      g.fill({ color: 0xffd700 });
      g.circle(0, 0, size * 0.6);
      g.fill({ color: 0xffa500 });

      g.x = Math.random() * this.app.screen.width;
      g.y = -20;
      this.container.addChild(g);

      gsap.to(g, {
        y: this.app.screen.height + 20,
        x: g.x + (Math.random() - 0.5) * 100,
        rotation: Math.random() * Math.PI * 4,
        duration: 1.5 + Math.random(),
        ease: "power1.in",
        onComplete: () => g.destroy(),
      });
    }, 50);

    setTimeout(() => clearInterval(interval), duration);
  }
}
