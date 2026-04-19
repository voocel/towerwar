import type { Vec2, ElementId } from '@/types';
import type { Enemy } from './Enemy';

export class Projectile {
  static nextId = 0;
  id: number;
  pos: Vec2;
  speed: number;
  damage: number;
  element: ElementId;
  markChance: number;
  color: string;
  radius: number;
  target: Enemy;
  aoeRadiusPx?: number;
  dotDamage?: number;
  dotDuration?: number;
  slowAmount?: number;
  slowDuration?: number;
  extraMark?: ElementId;     // formation reactor: poison tower also applies thunder mark
  markDuration?: number;     // formation-adjusted mark duration
  iceMarkAlsoSlows?: boolean;// glacier: ice marks apply 10% slow
  alive: boolean = true;

  constructor(opts: {
    pos: Vec2; speed: number; damage: number; element: ElementId;
    markChance: number; color: string; radius?: number; target: Enemy;
    aoeRadiusPx?: number;
    dotDamage?: number; dotDuration?: number;
    slowAmount?: number; slowDuration?: number;
    extraMark?: ElementId;
    markDuration?: number;
    iceMarkAlsoSlows?: boolean;
  }) {
    this.id = Projectile.nextId++;
    this.pos = { ...opts.pos };
    this.speed = opts.speed;
    this.damage = opts.damage;
    this.element = opts.element;
    this.markChance = opts.markChance;
    this.color = opts.color;
    this.radius = opts.radius ?? 4;
    this.target = opts.target;
    this.aoeRadiusPx = opts.aoeRadiusPx;
    this.dotDamage = opts.dotDamage;
    this.dotDuration = opts.dotDuration;
    this.slowAmount = opts.slowAmount;
    this.slowDuration = opts.slowDuration;
    this.extraMark = opts.extraMark;
    this.markDuration = opts.markDuration;
    this.iceMarkAlsoSlows = opts.iceMarkAlsoSlows;
  }

  update(dt: number): boolean {
    if (!this.alive) return false;
    if (this.target.dead || this.target.reachedEnd) {
      this.alive = false;
      return false;
    }
    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * dt;
    if (step >= d) {
      this.pos = { ...this.target.pos };
      return true;  // hit
    }
    this.pos = { x: this.pos.x + dx / d * step, y: this.pos.y + dy / d * step };
    return false;
  }
}
