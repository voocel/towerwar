import * as Phaser from 'phaser';
import type { GameContext } from '@/game/GameContext';
import type { SkillId } from '@/types';
import { SKILLS } from '@/config/skills';
import { CELL_SIZE, px } from '@/constants';
import { hexColor, findNearestEnemy } from '@/utils/Grid';
import { audio } from '@/managers/AudioManager';

export function isSkillReady(ctx: GameContext, id: SkillId): boolean {
  const cd = ctx.skillCooldowns.get(id) ?? 0;
  return cd <= 0;
}

export function skillCooldownRatio(ctx: GameContext, id: SkillId): number {
  const cd = ctx.skillCooldowns.get(id) ?? 0;
  if (cd <= 0) return 0;
  const total = SKILLS[id].cooldown;
  return Math.min(1, Math.max(0, cd / total));
}

/**
 * Drive cooldowns each tick.
 */
export function updateSkills(ctx: GameContext, dt: number) {
  for (const [id, cd] of ctx.skillCooldowns) {
    const next = cd - dt;
    if (next <= 0) ctx.skillCooldowns.delete(id);
    else ctx.skillCooldowns.set(id, next);
  }
}

/**
 * Cast meteor at (x, y) world coords. Damages every enemy in radius.
 * Returns true if cast actually happened (i.e. cooldown was ready).
 */
export function castMeteor(scene: Phaser.Scene, ctx: GameContext, x: number, y: number): boolean {
  const def = SKILLS.meteor;
  if (!isSkillReady(ctx, 'meteor')) return false;

  const radiusPx = def.radiusGrid * CELL_SIZE;
  const r2 = radiusPx * radiusPx;
  for (const e of ctx.enemies) {
    if (e.dead || e.reachedEnd) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy > r2) continue;
    e.takeDamage(def.damage, ctx.time, { isMagic: true });
  }

  ctx.skillCooldowns.set('meteor', def.cooldown);
  ctx.stats.skillsUsed++;
  ctx.pendingSkillId = null;

  spawnMeteorImpact(scene, x, y, radiusPx, def.color);
  audio.playSfx('sfx_skill_meteor');
  return true;
}

/**
 * Cast frost-nova at (x, y). Damages + freezes + applies ice mark in radius.
 */
export function castFrostNova(scene: Phaser.Scene, ctx: GameContext, x: number, y: number): boolean {
  const def = SKILLS.frostnova;
  if (!isSkillReady(ctx, 'frostnova')) return false;

  const radiusPx = def.radiusGrid * CELL_SIZE;
  const r2 = radiusPx * radiusPx;
  const freezeDuration = def.freezeDuration ?? 1.5;
  for (const e of ctx.enemies) {
    if (e.dead || e.reachedEnd) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy > r2) continue;
    e.takeDamage(def.damage, ctx.time, { isMagic: true });
    if (!e.dead) {
      e.applyFreeze(freezeDuration, ctx.time);
      e.addMark('ice');
    }
  }

  ctx.skillCooldowns.set('frostnova', def.cooldown);
  ctx.stats.skillsUsed++;
  ctx.pendingSkillId = null;

  spawnFrostNovaImpact(scene, x, y, radiusPx, def.color);
  audio.playSfx('sfx_skill_frostnova');
  return true;
}

/**
 * Cast lightning chain at the enemy nearest to (x, y). Bounces 5 hops with
 * 0.7× decay per jump, applies thunder mark on hit.
 */
export function castLightning(scene: Phaser.Scene, ctx: GameContext, x: number, y: number): boolean {
  const def = SKILLS.lightning;
  if (!isSkillReady(ctx, 'lightning')) return false;

  const hops = def.chainHops ?? 5;
  const decay = def.chainDecay ?? 0.7;
  const firstRangePx = (def.chainFirstRangeGrid ?? 6) * CELL_SIZE;
  const hopRangePx = (def.chainHopRangeGrid ?? 4) * CELL_SIZE;
  const hopMaxDistSq = hopRangePx * hopRangePx;

  type EnemyT = typeof ctx.enemies[number];
  const visited = new Set<number>();
  let cur: EnemyT | null = findNearestEnemy(ctx.enemies, x, y, firstRangePx * firstRangePx);
  if (!cur) return false;

  let prevX = x;
  let prevY = y;
  let dmg = def.damage;
  for (let i = 0; i < hops && cur; i++) {
    visited.add(cur.enemyId);
    cur.takeDamage(dmg, ctx.time, { isMagic: true });
    if (!cur.dead) cur.addMark('thunder');
    spawnLightningArc(scene, prevX, prevY, cur.x, cur.y, def.color);
    prevX = cur.x;
    prevY = cur.y;
    dmg *= decay;

    cur = findNearestEnemy(ctx.enemies, cur.x, cur.y, hopMaxDistSq, e => visited.has(e.enemyId));
  }

  ctx.skillCooldowns.set('lightning', def.cooldown);
  ctx.stats.skillsUsed++;
  ctx.pendingSkillId = null;

  audio.playSfx('sfx_skill_lightning');
  return true;
}

/** Visual: shockwave ring + trailing particles + ground scorch mark. */
function spawnMeteorImpact(scene: Phaser.Scene, x: number, y: number, radiusPx: number, color: string) {
  const c = hexColor(color);

  // Falling streak (a quick line from off-screen to impact)
  const trailFromY = y - px(260);
  const trail = scene.add.graphics().setDepth(38);
  trail.lineStyle(6, c, 0.85);
  trail.lineBetween(x, trailFromY, x, y);
  scene.tweens.add({
    targets: trail, alpha: 0,
    duration: 380, ease: 'Cubic.easeOut',
    onComplete: () => trail.destroy(),
  });

  // Bright flash core
  const flash = scene.add.circle(x, y, px(18), 0xffffff, 0.9).setDepth(45);
  scene.tweens.add({
    targets: flash, scale: 4, alpha: 0,
    duration: 350, ease: 'Cubic.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Expanding shockwave ring
  const ring = scene.add.circle(x, y, px(8), c, 0.4).setDepth(44);
  ring.setStrokeStyle(3, c, 1);
  scene.tweens.add({
    targets: ring,
    radius: radiusPx,
    alpha: 0,
    duration: 600, ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Radial sparks
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const dist = radiusPx * (0.5 + Math.random() * 0.6);
    const dot = scene.add.circle(x, y, px(3 + Math.random() * 2), c, 1).setDepth(42);
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist,
      alpha: 0, scale: 0.3,
      duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => dot.destroy(),
    });
  }

  // Ground scorch mark — short-lived translucent disc
  const scorch = scene.add.graphics().setDepth(7);
  scorch.fillStyle(0x000000, 0.45);
  scorch.fillCircle(x, y, radiusPx * 0.7);
  scene.tweens.add({
    targets: scorch, alpha: 0,
    duration: 1500, ease: 'Sine.easeOut',
    onComplete: () => scorch.destroy(),
  });
}

/** Frost nova: expanding cyan ring + radial ice shards + frosted ground patch. */
function spawnFrostNovaImpact(scene: Phaser.Scene, x: number, y: number, radiusPx: number, color: string) {
  const c = hexColor(color);

  // Bright flash
  const flash = scene.add.circle(x, y, px(16), 0xffffff, 0.85).setDepth(45);
  scene.tweens.add({
    targets: flash, scale: 5, alpha: 0,
    duration: 320, ease: 'Cubic.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Expanding cyan shockwave
  const ring = scene.add.circle(x, y, px(8), c, 0.3).setDepth(44);
  ring.setStrokeStyle(3, c, 1);
  scene.tweens.add({
    targets: ring, radius: radiusPx, alpha: 0,
    duration: 700, ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  // 18 angular ice shards (rectangles, narrow + tall)
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dist = radiusPx * (0.45 + Math.random() * 0.55);
    const shard = scene.add.rectangle(x, y, px(4), px(12), c, 0.95).setDepth(42);
    shard.rotation = a + Math.PI / 2;
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist,
      alpha: 0, scaleY: 0.4,
      duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => shard.destroy(),
    });
  }

  // Frosted ground patch — pale tint that lingers
  const frost = scene.add.graphics().setDepth(7);
  frost.fillStyle(c, 0.22);
  frost.fillCircle(x, y, radiusPx * 0.85);
  scene.tweens.add({
    targets: frost, alpha: 0,
    duration: 1800, ease: 'Sine.easeOut',
    onComplete: () => frost.destroy(),
  });
}

/** Lightning arc segment — short jagged beam between two points. */
function spawnLightningArc(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number, color: string) {
  const c = hexColor(color);
  const g = scene.add.graphics().setDepth(43);
  g.lineStyle(3, c, 1);
  // Jagged 3-segment polyline for arcing feel
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * px(18);
  const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * px(18);
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(midX, midY);
  g.lineTo(x2, y2);
  g.strokePath();
  // Outer glow
  g.lineStyle(7, c, 0.35);
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(midX, midY);
  g.lineTo(x2, y2);
  g.strokePath();

  scene.tweens.add({
    targets: g, alpha: 0,
    duration: 220, ease: 'Cubic.easeOut',
    onComplete: () => g.destroy(),
  });
}
