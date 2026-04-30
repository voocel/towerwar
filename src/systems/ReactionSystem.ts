import * as Phaser from 'phaser';
import type { ElementId } from '@/types';
import type { Enemy } from '@/entities/Enemy';
import type { GameContext, GroundZone } from '@/game/GameContext';
import { findReaction, type ReactionDef } from '@/config/reactions';
import { ELEMENTS } from '@/config/elements';
import { distSq, hexColor } from '@/utils/Grid';
import { CELL_SIZE } from '@/constants';
import { spawnReactionBurst, spawnBeam } from './FxSystem';
import { onReactionTriggered, reactionDamageMultiplier } from './RelicSystem';

/**
 * Hit payload — what a projectile or chain hop applies on contact.
 * Built by TargetingSystem.buildHitPayload(tower).
 */
export interface HitPayload {
  element: ElementId;
  damage: number;
  markChance: number;
  markDuration?: number;
  iceMarkAlsoSlows?: boolean;
  extraMark?: ElementId;
  isMagic?: boolean;
  dotDamage?: number;
  dotDuration?: number;
  slowAmount?: number;
  slowDuration?: number;
  aoeRadiusPx?: number;
}

export function applyHit(scene: Phaser.Scene, ctx: GameContext, enemy: Enemy, hit: HitPayload) {
  if (enemy.dead) return;
  const time = ctx.time;

  // AOE splash
  if (hit.aoeRadiusPx) {
    const r2 = hit.aoeRadiusPx * hit.aoeRadiusPx;
    for (const e of ctx.enemies) {
      if (e.dead) continue;
      if (distSq({ x: e.x, y: e.y }, { x: enemy.x, y: enemy.y }) > r2) continue;
      e.takeDamage(hit.damage, time, { isMagic: hit.isMagic });
      if (hit.dotDamage && hit.dotDuration) e.applyDot(hit.dotDamage, hit.dotDuration, hit.element);
      if (hit.slowAmount && hit.slowDuration) e.applySlow(hit.slowAmount, hit.slowDuration, time);
    }
  } else {
    enemy.takeDamage(hit.damage, time, { isMagic: hit.isMagic });
    if (hit.dotDamage && hit.dotDuration) enemy.applyDot(hit.dotDamage, hit.dotDuration, hit.element);
    if (hit.slowAmount && hit.slowDuration) enemy.applySlow(hit.slowAmount, hit.slowDuration, time);
  }

  if (enemy.dead) return;

  // Mark or react with primary element, then extra element
  const reacted = markOrReact(scene, ctx, enemy, hit.element, hit.markChance, hit.markDuration, hit.iceMarkAlsoSlows);
  if (hit.extraMark && !reacted && !enemy.dead) {
    markOrReact(scene, ctx, enemy, hit.extraMark, 1.0, undefined, hit.iceMarkAlsoSlows);
  }
}

function markOrReact(
  scene: Phaser.Scene,
  ctx: GameContext,
  enemy: Enemy,
  element: ElementId,
  chance: number,
  duration: number | undefined,
  iceMarkAlsoSlows?: boolean,
): boolean {
  for (const mark of [...enemy.marks]) {
    if (mark.element === element) continue;
    const r = findReaction(element, mark.element);
    if (!r) continue;
    if ((enemy.reactionCooldowns.get(r.id) ?? 0) > 0) continue;
    triggerReaction(scene, ctx, r, enemy);
    enemy.removeMark(mark.element);
    enemy.reactionCooldowns.set(r.id, r.cooldownPerEnemy);
    return true;
  }
  if (Math.random() < chance) {
    const dur = duration ?? ELEMENTS[element].defaultMarkDuration;
    enemy.addMark(element, dur);
    if (element === 'ice' && iceMarkAlsoSlows) {
      enemy.applySlow(0.10, dur, ctx.time);
    }
  }
  return false;
}

function triggerReaction(scene: Phaser.Scene, ctx: GameContext, r: ReactionDef, target: Enemy) {
  ctx.stats.reactionsTriggered++;
  onReactionTriggered(ctx);

  spawnReactionBurst(scene, target.x, target.y, r.color);

  const dmg = r.damage * reactionDamageMultiplier(ctx);
  const time = ctx.time;

  // Direct damage (single or AOE)
  if (dmg > 0) {
    if (r.aoeRadius) {
      const radPx = r.aoeRadius * CELL_SIZE;
      const r2 = radPx * radPx;
      for (const e of ctx.enemies) {
        if (e.dead) continue;
        if (distSq({ x: e.x, y: e.y }, { x: target.x, y: target.y }) > r2) continue;
        e.takeDamage(dmg, time, { isMagic: true, isReaction: true });
      }
    } else {
      target.takeDamage(dmg, time, { isMagic: true, isReaction: true });
    }
  }

  // Vulnerable (steam)
  if (r.vulnerableBonus && r.vulnerableDuration) {
    const radPx = (r.aoeRadius ?? 1.5) * CELL_SIZE;
    const r2 = radPx * radPx;
    for (const e of ctx.enemies) {
      if (e.dead) continue;
      if (distSq({ x: e.x, y: e.y }, { x: target.x, y: target.y }) > r2) continue;
      e.applyVulnerable(r.vulnerableBonus, r.vulnerableDuration, time);
    }
  }

  // Freeze (frostarc)
  if (r.freezeDuration) target.applyFreeze(r.freezeDuration, time);

  // Chain (frostarc)
  if (r.chainDamage && r.chainCount) {
    const chainDmg = r.chainDamage * reactionDamageMultiplier(ctx);
    const candidates = ctx.enemies
      .filter(e => !e.dead && e.enemyId !== target.enemyId)
      .map(e => ({ e, d: distSq({ x: e.x, y: e.y }, { x: target.x, y: target.y }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, r.chainCount);
    for (const c of candidates) {
      c.e.takeDamage(chainDmg, time, { isMagic: true, isReaction: true });
      spawnBeam(scene, target.x, target.y, c.e.x, c.e.y, r.color);
    }
  }

  // Ground zone (toxicice)
  if (r.groundZoneDuration && r.groundZoneRadius !== undefined) {
    const zone: GroundZone = {
      x: target.x,
      y: target.y,
      radiusPx: r.groundZoneRadius * CELL_SIZE,
      remainingTime: r.groundZoneDuration,
      damagePerSec: r.groundZoneDamagePerSec ?? 0,
      slow: r.groundSlow ?? 0,
      color: r.color,
    };
    ctx.groundZones.push(zone);
    // Visual: persistent translucent disc.
    const gfx = scene.add.graphics().setDepth(8);
    gfx.fillStyle(hexColor(r.color), 0.25);
    gfx.fillCircle(zone.x, zone.y, zone.radiusPx);
    gfx.lineStyle(2, hexColor(r.color), 0.7);
    gfx.strokeCircle(zone.x, zone.y, zone.radiusPx);
    zone.gfx = gfx;
  }

  // Spread mark (plague)
  if (r.spreadMarkCount && r.spreadMarkElement) {
    const nearest = ctx.enemies
      .filter(e => !e.dead && e.enemyId !== target.enemyId)
      .map(e => ({ e, d: distSq({ x: e.x, y: e.y }, { x: target.x, y: target.y }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, r.spreadMarkCount);
    for (const c of nearest) {
      c.e.addMark(r.spreadMarkElement);
      spawnBeam(scene, target.x, target.y, c.e.x, c.e.y, r.color);
    }
  }
}

/** Per-frame: tick ground zones (damage + slow) and remove expired ones. */
export function updateGroundZones(ctx: GameContext, dt: number) {
  for (const z of ctx.groundZones) {
    z.remainingTime -= dt;
    const r2 = z.radiusPx * z.radiusPx;
    for (const e of ctx.enemies) {
      if (e.dead) continue;
      const dx = e.x - z.x;
      const dy = e.y - z.y;
      if (dx * dx + dy * dy > r2) continue;
      if (z.damagePerSec > 0) {
        e.takeDamage(z.damagePerSec * dt, ctx.time, { isMagic: true });
      }
      if (z.slow > 0) {
        e.applySlow(z.slow, 0.4, ctx.time);  // refresh continuously while inside
      }
    }
  }
  const expired = ctx.groundZones.filter(z => z.remainingTime <= 0);
  for (const z of expired) z.gfx?.destroy();
  ctx.groundZones = ctx.groundZones.filter(z => z.remainingTime > 0);
}
