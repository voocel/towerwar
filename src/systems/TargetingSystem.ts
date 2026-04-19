import { state } from '@/game/GameState';
import type { Tower } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { ELEMENTS } from '@/config/elements';
import { CELL_SIZE, distSq } from '@/utils/Grid';
import { applyHit, type HitPayload } from './ReactionSystem';

function pickTarget(tower: Tower): Enemy | null {
  // Target the enemy nearest to the end (highest waypointIndex + distance covered)
  const r2 = tower.rangePx * tower.rangePx;
  let best: Enemy | null = null;
  let bestScore = -Infinity;
  for (const e of state.enemies) {
    if (e.dead || e.reachedEnd) continue;
    if (e.def.flying && tower.towerId !== 'arc' && tower.towerId !== 'magstorm' && tower.towerId !== 'spark') {
      // Only certain towers hit flying enemies (MVP rule for the flying wave).
      continue;
    }
    if (distSq(e.pos, tower.pos) > r2) continue;
    const score = e.waypointIndex * 10000 - distSq(e.pos, tower.pos) / 1000;
    if (score > bestScore) { best = e; bestScore = score; }
  }
  return best;
}

function buildHitPayload(tower: Tower): HitPayload {
  const resMult = state.ownedRelics.has('resonance') ? 1.5 : 1.0;
  const afterglow = state.time < state.afterglowUntil ? 1.25 : 1.0;
  const pathogen = state.ownedRelics.has('pathogen') ? 1.5 : 1.0;

  const payload: HitPayload = {
    element: tower.def.element,
    damage: tower.damage * afterglow,
    markChance: tower.markChance,
    markDuration: ELEMENTS[tower.def.element].defaultMarkDuration,
  };

  // Formation modifiers — optionally scaled by resonance relic
  if (tower.def.element === 'fire' && tower.formations.has('inferno')) {
    // Base +50% duration; with resonance +75%
    payload.markDuration = (payload.markDuration ?? 5) * (1 + 0.5 * resMult);
  }
  if (tower.def.element === 'ice' && tower.formations.has('glacier')) {
    payload.markChance = Math.min(1, payload.markChance + 0.25 * resMult);
    payload.iceMarkAlsoSlows = true;
  }
  if (tower.def.element === 'poison' && tower.formations.has('reactor')) {
    payload.extraMark = 'thunder';
  }

  if (tower.def.dotDamage && tower.def.dotDuration) {
    payload.dotDamage = tower.dotDamage * pathogen;
    payload.dotDuration = tower.def.dotDuration;
  }
  if (tower.def.slowAmount && tower.def.slowDuration) {
    payload.slowAmount = tower.def.slowAmount;
    payload.slowDuration = tower.def.slowDuration;
  }
  if (tower.aoeRadius !== undefined) {
    payload.aoeRadiusPx = tower.aoeRadius * CELL_SIZE;
  }
  if (tower.magstormGridAoe > 0) {
    const r = tower.magstormGridAoe * resMult;
    payload.aoeRadiusPx = r * CELL_SIZE;
  }

  return payload;
}

function fireArc(tower: Tower, first: Enemy) {
  const resMult = state.ownedRelics.has('resonance') ? 1.5 : 1.0;
  // Base arc chain count is 2 extra (+3 total hits); formation grid adds 1; resonance scales the bonus
  const gridBonus = tower.formations.has('grid') ? Math.round(1 * resMult) : 0;
  const jumps = 1 + (tower.def.chainCount ?? 2) + gridBonus;
  const hit = buildHitPayload(tower);
  const damages = [hit.damage, hit.damage * 0.7, hit.damage * 0.5, hit.damage * 0.35, hit.damage * 0.25];
  let current: Enemy | null = first;
  const visited = new Set<number>();
  let from = { ...tower.pos };
  for (let i = 0; i < jumps && current; i++) {
    visited.add(current.id);
    const localHit = { ...hit, damage: damages[i] ?? damages[damages.length - 1] };
    applyHit(current, localHit);
    state.particles.push({
      pos: { x: from.x, y: from.y },
      vel: { x: 0, y: 0 },
      color: tower.def.color,
      remainingTime: 0.15, life: 0.15, radius: 4,
    });
    const steps = 6;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      state.particles.push({
        pos: { x: from.x + (current.pos.x - from.x) * t, y: from.y + (current.pos.y - from.y) * t },
        vel: { x: 0, y: 0 }, color: tower.def.color,
        remainingTime: 0.1, life: 0.1, radius: 2,
      });
    }
    from = { ...current.pos };
    let next: Enemy | null = null;
    let bestD = Infinity;
    for (const e of state.enemies) {
      if (e.dead || e.reachedEnd || visited.has(e.id)) continue;
      const d = distSq(e.pos, current.pos);
      if (d < bestD && d < (3 * CELL_SIZE) * (3 * CELL_SIZE)) { next = e; bestD = d; }
    }
    current = next;
  }
}

export function updateTowers(dt: number) {
  for (const tower of state.towers) {
    tower.attackTimer -= dt;
    if (tower.attackTimer > 0) continue;

    const target = pickTarget(tower);
    if (!target) continue;

    const dx = target.pos.x - tower.pos.x;
    const dy = target.pos.y - tower.pos.y;
    tower.aimAngle = Math.atan2(dy, dx);
    tower.attackTimer = tower.attackPeriod;

    if (tower.towerId === 'arc') {
      fireArc(tower, target);
      continue;
    }

    const hit = buildHitPayload(tower);
    state.projectiles.push(new Projectile({
      pos: { ...tower.pos },
      speed: tower.def.bulletSpeed ?? 800,
      damage: hit.damage,
      element: hit.element,
      markChance: hit.markChance,
      color: tower.def.color,
      target,
      aoeRadiusPx: hit.aoeRadiusPx,
      dotDamage: hit.dotDamage,
      dotDuration: hit.dotDuration,
      slowAmount: hit.slowAmount,
      slowDuration: hit.slowDuration,
      extraMark: hit.extraMark,
      markDuration: hit.markDuration,
      iceMarkAlsoSlows: hit.iceMarkAlsoSlows,
    }));
  }
}
