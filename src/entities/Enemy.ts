import * as Phaser from 'phaser';
import type { EnemyTypeId, Vec2, ElementId, ElementMark, ReactionId } from '@/types';
import { ENEMIES, type EnemyDef } from '@/config/enemies';
import { ELEMENTS } from '@/config/elements';
import { CELL_SIZE, DPR, px } from '@/constants';
import { hexColor } from '@/utils/Grid';
import { PALETTE } from '@/theme';

export interface DotEffect {
  damagePerSec: number;
  remainingTime: number;
  element: ElementId;
}

const MAX_MARKS = 2;

export class Enemy extends Phaser.GameObjects.Container {
  static nextId = 0;
  enemyId: number;
  type: EnemyTypeId;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  waypointIndex: number = 1;
  speedPx: number;
  dead: boolean = false;
  reachedEnd: boolean = false;
  killedByReaction: boolean = false;

  // Element-reaction state
  marks: ElementMark[] = [];
  reactionCooldowns: Map<ReactionId, number> = new Map();
  slowUntil: number = 0;
  slowAmount: number = 0;
  freezeUntil: number = 0;
  vulnerableBonus: number = 0;
  vulnerableUntil: number = 0;
  dots: DotEffect[] = [];

  private bodyArc?: Phaser.GameObjects.Arc;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFg: Phaser.GameObjects.Rectangle;
  private markDots: Phaser.GameObjects.Arc[] = [];
  private freezeRing!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, type: EnemyTypeId, x: number, y: number) {
    super(scene, x, y);
    this.enemyId = Enemy.nextId++;
    this.type = type;
    this.def = ENEMIES[type];
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.speedPx = this.def.speed * CELL_SIZE;

    // Local DPR-scaled body radius — every literal pixel here is logical.
    const r = this.def.radius * DPR;

    // Body — sprite if available, else colored circle.
    const spriteKey = `enemy_${type}`;
    if (scene.textures.exists(spriteKey)) {
      const sprite = scene.add.image(0, 0, spriteKey);
      sprite.setDisplaySize(r * 2.4, r * 2.4);
      this.add(sprite);
    } else {
      this.bodyArc = scene.add.circle(0, 0, r, hexColor(this.def.color));
      this.bodyArc.setStrokeStyle(2, 0x000000, 0.5);
      this.add(this.bodyArc);
    }

    // HP bar
    const w = r * 2 + px(6);
    const yOffset = -r - px(9);
    this.hpBarBg = scene.add.rectangle(0, yOffset, w, px(5), 0x000000, 0.7);
    this.hpBarFg = scene.add.rectangle(-w / 2 + px(1), yOffset, w - px(2), px(3), hexColor(PALETTE.hpHigh)).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBarFg]);

    // Mark slots (above HP bar)
    const markY = yOffset - px(8);
    for (let i = 0; i < MAX_MARKS; i++) {
      const dot = scene.add.circle((i - (MAX_MARKS - 1) / 2) * px(9), markY, px(3), 0xffffff, 0).setStrokeStyle(1, 0xffffff, 0);
      this.markDots.push(dot);
      this.add(dot);
    }

    // Freeze indicator ring (only visible when frozen)
    this.freezeRing = scene.add.circle(0, 0, r + px(3), 0x000000, 0)
      .setStrokeStyle(2, hexColor(PALETTE.iceAccent), 0);
    this.add(this.freezeRing);

    scene.add.existing(this);
    this.setDepth(20);
  }

  // ─── damage / state ───────────────────────────────────────────

  takeDamage(amount: number, time: number, opts: { isReaction?: boolean; isMagic?: boolean } = {}) {
    if (this.dead) return;
    let dmg = amount;
    if (!opts.isMagic && this.def.armor) dmg *= (1 - this.def.armor);
    if (opts.isMagic && this.def.magicResist) dmg *= (1 - this.def.magicResist);
    if (time < this.vulnerableUntil) dmg *= (1 + this.vulnerableBonus);
    this.hp -= dmg;
    this.refreshHpBar();
    if (this.hp <= 0) {
      this.dead = true;
      this.killedByReaction = !!opts.isReaction;
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

  // ─── marks ────────────────────────────────────────────────────

  addMark(element: ElementId, baseDuration?: number) {
    const dur = baseDuration ?? ELEMENTS[element].defaultMarkDuration;
    const existing = this.marks.find(m => m.element === element);
    if (existing) {
      existing.remainingTime = Math.max(existing.remainingTime, dur);
      existing.baseDuration = dur;
      this.refreshMarkDots();
      return;
    }
    if (this.marks.length >= MAX_MARKS) {
      let idx = 0;
      for (let i = 1; i < this.marks.length; i++) {
        if (this.marks[i].remainingTime < this.marks[idx].remainingTime) idx = i;
      }
      this.marks.splice(idx, 1);
    }
    this.marks.push({ element, remainingTime: dur, baseDuration: dur });
    this.refreshMarkDots();
  }

  removeMark(element: ElementId) {
    const i = this.marks.findIndex(m => m.element === element);
    if (i >= 0) {
      this.marks.splice(i, 1);
      this.refreshMarkDots();
    }
  }

  hasMark(element: ElementId): boolean {
    return this.marks.some(m => m.element === element);
  }

  // ─── per-frame ────────────────────────────────────────────────

  followPath(waypoints: Vec2[], dt: number, time: number) {
    if (this.dead || this.reachedEnd) return;

    // Mark decay
    let marksChanged = false;
    for (const m of this.marks) m.remainingTime -= dt;
    const beforeLen = this.marks.length;
    this.marks = this.marks.filter(m => m.remainingTime > 0);
    if (this.marks.length !== beforeLen) marksChanged = true;
    if (marksChanged) this.refreshMarkDots();

    // DOTs
    for (const d of this.dots) {
      this.hp -= d.damagePerSec * dt;
      d.remainingTime -= dt;
    }
    this.dots = this.dots.filter(d => d.remainingTime > 0);
    if (this.hp <= 0) {
      this.dead = true;
      this.refreshHpBar();
      return;
    }
    this.refreshHpBar();

    // Reaction cooldowns
    for (const [k, v] of this.reactionCooldowns) {
      const n = v - dt;
      if (n <= 0) this.reactionCooldowns.delete(k);
      else this.reactionCooldowns.set(k, n);
    }

    // Freeze indicator
    this.freezeRing.setStrokeStyle(2, hexColor(PALETTE.iceAccent), time < this.freezeUntil ? 0.85 : 0);

    if (time < this.freezeUntil) return;

    const target = waypoints[this.waypointIndex];
    if (!target) { this.reachedEnd = true; return; }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const slowFactor = time < this.slowUntil ? (1 - this.slowAmount) : 1;
    const step = this.speedPx * slowFactor * dt;
    if (step >= d) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
    } else if (d > 0) {
      this.x += dx / d * step;
      this.y += dy / d * step;
    }
  }

  // ─── visual helpers ───────────────────────────────────────────

  private refreshHpBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    const fullW = this.def.radius * DPR * 2 + px(6) - px(2);
    this.hpBarFg.width = fullW * ratio;
    let color: string = PALETTE.hpHigh;
    if (ratio < 0.4) color = PALETTE.hpLow;
    else if (ratio < 0.7) color = PALETTE.hpMid;
    this.hpBarFg.fillColor = hexColor(color);
  }

  private refreshMarkDots() {
    for (let i = 0; i < this.markDots.length; i++) {
      const m = this.marks[i];
      const dot = this.markDots[i];
      if (!m) {
        dot.fillAlpha = 0;
        dot.setStrokeStyle(1, 0xffffff, 0);
        continue;
      }
      const c = hexColor(ELEMENTS[m.element].color);
      dot.fillColor = c;
      dot.fillAlpha = 1;
      dot.setStrokeStyle(1, 0xffffff, 0.6);
    }
  }
}
