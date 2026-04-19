import type { Vec2, EnemyTypeId, ElementId, ElementMark, ReactionId } from '@/types';
import { ENEMIES, type EnemyDef } from '@/config/enemies';
import { ELEMENTS } from '@/config/elements';
import { CELL_SIZE, gridToPixel } from '@/utils/Grid';
import { getWaypoints } from '@/config/map';

export interface DotEffect {
  damagePerSec: number;
  remainingTime: number;
  element: ElementId;
}

export class Enemy {
  static nextId = 0;
  id: number;
  type: EnemyTypeId;
  def: EnemyDef;
  pos: Vec2;
  hp: number;
  maxHp: number;
  waypointIndex: number = 1;
  marks: ElementMark[] = [];
  maxMarks: number = 2;
  reactionCooldowns: Map<ReactionId, number> = new Map();
  slowUntil: number = 0;
  slowAmount: number = 0;
  freezeUntil: number = 0;
  vulnerableBonus: number = 0;
  vulnerableUntil: number = 0;
  dots: DotEffect[] = [];
  dead: boolean = false;
  reachedEnd: boolean = false;
  killedByReaction: boolean = false;
  lastMarkedAtDeath: boolean = false;

  constructor(type: EnemyTypeId) {
    this.id = Enemy.nextId++;
    this.type = type;
    this.def = ENEMIES[type];
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    const start = getWaypoints()[0];
    this.pos = gridToPixel(start.gx, start.gy);
  }

  addMark(element: ElementId, baseDuration?: number) {
    const dur = baseDuration ?? ELEMENTS[element].defaultMarkDuration;
    const existing = this.marks.find(m => m.element === element);
    if (existing) {
      existing.remainingTime = Math.max(existing.remainingTime, dur);
      existing.baseDuration = dur;
      return;
    }
    if (this.marks.length >= this.maxMarks) {
      // Evict the one with least remaining time.
      let idx = 0;
      for (let i = 1; i < this.marks.length; i++) {
        if (this.marks[i].remainingTime < this.marks[idx].remainingTime) idx = i;
      }
      this.marks.splice(idx, 1);
    }
    this.marks.push({ element, remainingTime: dur, baseDuration: dur });
  }

  removeMark(element: ElementId) {
    const i = this.marks.findIndex(m => m.element === element);
    if (i >= 0) this.marks.splice(i, 1);
  }

  hasMark(element: ElementId): boolean {
    return this.marks.some(m => m.element === element);
  }

  takeDamage(amount: number, time: number, opts: { isReaction?: boolean; isMagic?: boolean } = {}) {
    if (this.dead) return;
    let dmg = amount;
    if (!opts.isMagic && this.def.armor) dmg *= (1 - this.def.armor);
    if (opts.isMagic && this.def.magicResist) dmg *= (1 - this.def.magicResist);
    if (time < this.vulnerableUntil) dmg *= (1 + this.vulnerableBonus);
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.dead = true;
      this.killedByReaction = !!opts.isReaction;
      this.lastMarkedAtDeath = this.marks.length > 0;
    }
  }

  applySlow(amount: number, duration: number, time: number) {
    const until = time + duration;
    if (amount >= this.slowAmount || until > this.slowUntil) {
      this.slowAmount = Math.max(this.slowAmount, amount);
      this.slowUntil = Math.max(this.slowUntil, until);
    }
  }

  applyFreeze(duration: number, time: number) {
    this.freezeUntil = Math.max(this.freezeUntil, time + duration);
  }

  applyVulnerable(bonus: number, duration: number, time: number) {
    this.vulnerableBonus = Math.max(this.vulnerableBonus, bonus);
    this.vulnerableUntil = Math.max(this.vulnerableUntil, time + duration);
  }

  applyDot(damagePerSec: number, duration: number, element: ElementId) {
    this.dots.push({ damagePerSec, remainingTime: duration, element });
  }

  update(dt: number, time: number) {
    if (this.dead || this.reachedEnd) return;

    for (const m of this.marks) m.remainingTime -= dt;
    this.marks = this.marks.filter(m => m.remainingTime > 0);

    for (const d of this.dots) {
      this.hp -= d.damagePerSec * dt;
      d.remainingTime -= dt;
    }
    this.dots = this.dots.filter(d => d.remainingTime > 0);

    for (const [k, v] of this.reactionCooldowns) {
      const n = v - dt;
      if (n <= 0) this.reactionCooldowns.delete(k);
      else this.reactionCooldowns.set(k, n);
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.lastMarkedAtDeath = this.marks.length > 0;
      return;
    }

    if (time < this.freezeUntil) return;

    const target = getWaypoints()[this.waypointIndex];
    if (!target) { this.reachedEnd = true; return; }
    const tp = gridToPixel(target.gx, target.gy);
    const dx = tp.x - this.pos.x;
    const dy = tp.y - this.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const slowFactor = time < this.slowUntil ? (1 - this.slowAmount) : 1;
    const step = this.def.speed * CELL_SIZE * slowFactor * dt;
    if (step >= d) {
      this.pos = tp;
      this.waypointIndex++;
    } else if (d > 0) {
      this.pos = { x: this.pos.x + dx / d * step, y: this.pos.y + dy / d * step };
    }
  }
}
