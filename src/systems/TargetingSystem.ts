import * as Phaser from 'phaser';
import type { Tower } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import type { GameContext } from '@/game/GameContext';
import { distSq, findNearestEnemy } from '@/utils/Grid';
import { CELL_SIZE } from '@/constants';
import { ELEMENTS } from '@/config/elements';
import { applyHit, type HitPayload } from './ReactionSystem';
import { spawnBeam } from './FxSystem';
import { markChanceMultiplier, attackDamageMultiplier } from './RelicSystem';

function pickTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
  const r2 = tower.rangePx * tower.rangePx;
  let best: Enemy | null = null;
  let bestScore = -Infinity;
  const towerPos = { x: tower.x, y: tower.y };
  for (const e of enemies) {
    if (e.dead || e.reachedEnd) continue;
    if (e.def.flying && !tower.def.canHitFlying) continue;
    const d2 = distSq({ x: e.x, y: e.y }, towerPos);
    if (d2 > r2) continue;
    let score: number;
    switch (tower.strategy) {
      case 'first':     score = e.waypointIndex * 10000 - d2 / 1000; break;
      case 'last':      score = -e.waypointIndex * 10000 + d2 / 1000; break;
      case 'strongest': score = e.hp; break;
      case 'weakest':   score = -e.hp; break;
      case 'nearest':   score = -d2; break;
    }
    if (score > bestScore) { best = e; bestScore = score; }
  }
  return best;
}

function buildHitPayload(ctx: GameContext, tower: Tower): HitPayload {
  const payload: HitPayload = {
    element: tower.def.element,
    damage: tower.damage * attackDamageMultiplier(ctx),
    markChance: Math.min(1, tower.markChance * markChanceMultiplier(ctx)),
    markDuration: ELEMENTS[tower.def.element].defaultMarkDuration,
  };

  // Formation modifiers
  if (tower.def.element === 'fire' && tower.formations.has('inferno')) {
    payload.markDuration = (payload.markDuration ?? 5) * 1.5;
  }
  if (tower.def.element === 'ice' && tower.formations.has('glacier')) {
    payload.markChance = Math.min(1, payload.markChance + 0.25);
    payload.iceMarkAlsoSlows = true;
  }
  if (tower.def.element === 'poison' && tower.formations.has('reactor')) {
    payload.extraMark = 'thunder';
  }

  if (tower.def.dotDamage && tower.def.dotDuration) {
    payload.dotDamage = tower.dotDamage;
    payload.dotDuration = tower.def.dotDuration;
  }
  if (tower.def.slowAmount && tower.def.slowDuration) {
    payload.slowAmount = tower.def.slowAmount;
    payload.slowDuration = tower.def.slowDuration;
  }
  if (tower.aoeRadius !== undefined) {
    payload.aoeRadiusPx = tower.aoeRadius * CELL_SIZE;
  }

  return payload;
}

// Arc tower chain: damage multiplier per successive hop, capped tail uses last entry.
const ARC_CHAIN_DECAY = [1.0, 0.7, 0.5, 0.35, 0.25];
const ARC_HOP_RANGE_GRID = 3;

/**
 * Arc tower fires an instant chain instead of a projectile.
 * Damage decays per hop; "grid" formation grants +1 jump.
 */
function fireArc(scene: Phaser.Scene, ctx: GameContext, tower: Tower, first: Enemy) {
  const gridBonus = tower.formations.has('grid') ? 1 : 0;
  const jumps = 1 + (tower.def.chainCount ?? 2) + gridBonus;
  const base = buildHitPayload(ctx, tower);
  const hopRangePx = ARC_HOP_RANGE_GRID * CELL_SIZE;
  const hopMaxDistSq = hopRangePx * hopRangePx;
  const visited = new Set<number>();
  let current: Enemy | null = first;
  let fromX = tower.x;
  let fromY = tower.y;

  for (let i = 0; i < jumps && current; i++) {
    visited.add(current.enemyId);
    const decay = ARC_CHAIN_DECAY[i] ?? ARC_CHAIN_DECAY[ARC_CHAIN_DECAY.length - 1];
    const localHit: HitPayload = { ...base, damage: base.damage * decay };
    spawnBeam(scene, fromX, fromY, current.x, current.y, tower.def.color, 200);
    applyHit(scene, ctx, current, localHit);
    fromX = current.x;
    fromY = current.y;

    current = findNearestEnemy(ctx.enemies, current.x, current.y, hopMaxDistSq, e => visited.has(e.enemyId));
  }
}

export function updateTowers(scene: Phaser.Scene, ctx: GameContext, dt: number) {
  for (const tower of ctx.towers) {
    tower.attackTimer -= dt;
    if (tower.attackTimer > 0) continue;

    const target = pickTarget(tower, ctx.enemies);
    if (!target) continue;

    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    tower.setAimAngle(Math.atan2(dy, dx));
    tower.attackTimer = tower.attackPeriod;

    if (tower.towerId === 'arc') {
      fireArc(scene, ctx, tower, target);
      continue;
    }

    const hit = buildHitPayload(ctx, tower);
    const speed = tower.def.bulletSpeed ?? 800;
    const proj = new Projectile(scene, tower.x, tower.y, {
      speed,
      color: tower.def.color,
      target,
      hit,
    });
    ctx.projectiles.push(proj);
  }
}

export function updateProjectiles(scene: Phaser.Scene, ctx: GameContext, dt: number) {
  for (const p of ctx.projectiles) p.step(scene, ctx, dt);
  ctx.projectiles = ctx.projectiles.filter(p => p.alive);
}
