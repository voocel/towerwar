import * as Phaser from 'phaser';
import type { Enemy } from './Enemy';
import type { HitPayload } from '@/systems/ReactionSystem';
import type { GameContext } from '@/game/GameContext';
import { applyHit } from '@/systems/ReactionSystem';
import { hexColor } from '@/utils/Grid';
import { DPR, px } from '@/constants';

export interface ProjectileConfig {
  speed: number;
  color: string;
  target: Enemy;
  hit: HitPayload;
}

export class Projectile extends Phaser.GameObjects.Container {
  alive: boolean = true;
  speed: number;
  target: Enemy;
  hit: HitPayload;

  private core: Phaser.GameObjects.Arc;
  private glow: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: ProjectileConfig) {
    super(scene, x, y);
    this.speed = cfg.speed * DPR;        // bulletSpeed in def is logical px/s
    this.target = cfg.target;
    this.hit = cfg.hit;

    const c = hexColor(cfg.color);
    this.glow = scene.add.circle(0, 0, px(8), c, 0.35);
    this.core = scene.add.circle(0, 0, px(3.5), 0xffffff);
    this.core.setStrokeStyle(1.5, c);
    this.add([this.glow, this.core]);

    scene.add.existing(this);
    this.setDepth(25);
  }

  /** Returns true if hit landed this frame. */
  step(scene: Phaser.Scene, ctx: GameContext, dt: number): boolean {
    if (!this.alive) return false;
    if (this.target.dead || this.target.reachedEnd) {
      this.kill();
      return false;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * dt;
    const hitRadius = this.target.def.radius * DPR;
    if (step >= d || d < hitRadius) {
      applyHit(scene, ctx, this.target, this.hit);
      this.kill();
      return true;
    }
    if (d > 0) {
      this.x += dx / d * step;
      this.y += dy / d * step;
    }
    return false;
  }

  kill() {
    this.alive = false;
    this.destroy();
  }
}
