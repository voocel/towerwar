import { state } from '@/game/GameState';
import type { Enemy } from '@/entities/Enemy';
import type { ElementId } from '@/types';
import { findReaction, type ReactionDef } from '@/config/reactions';
import { ELEMENTS } from '@/config/elements';
import { CELL_SIZE, distSq } from '@/utils/Grid';export interface HitPayload {
  element: ElementId;
  damage: number;
  markChance: number;
  markDuration?: number;        // pre-modified by formation bonuses
  iceMarkAlsoSlows?: boolean;   // glacier: ice marks apply 10% slow
  extraMark?: ElementId;        // reactor: poison also applies thunder
  isMagic?: boolean;
  dotDamage?: number;
  dotDuration?: number;
  slowAmount?: number;
  slowDuration?: number;
  aoeRadiusPx?: number;         // pixels
}

export function applyHit(enemy: Enemy, hit: HitPayload) {
  if (enemy.dead) return;

  // AOE damage splash
  if (hit.aoeRadiusPx) {
    const r2 = hit.aoeRadiusPx * hit.aoeRadiusPx;
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (distSq(e.pos, enemy.pos) > r2) continue;
      const isTarget = e.id === enemy.id;
      e.takeDamage(hit.damage, state.time, { isMagic: hit.isMagic });
      if (hit.dotDamage && hit.dotDuration) e.applyDot(hit.dotDamage, hit.dotDuration, hit.element);
      if (hit.slowAmount && hit.slowDuration) e.applySlow(hit.slowAmount, hit.slowDuration, state.time);
      if (!isTarget) spawnFloater(e.pos, Math.round(hit.damage), ELEMENTS[hit.element].color);
    }
  } else {
    enemy.takeDamage(hit.damage, state.time, { isMagic: hit.isMagic });
    if (hit.dotDamage && hit.dotDuration) enemy.applyDot(hit.dotDamage, hit.dotDuration, hit.element);
    if (hit.slowAmount && hit.slowDuration) enemy.applySlow(hit.slowAmount, hit.slowDuration, state.time);
  }

  spawnFloater(enemy.pos, Math.round(hit.damage), ELEMENTS[hit.element].color);

  if (enemy.dead) return;

  // Mark or reaction with primary element, then extra element
  const reacted = markOrReact(enemy, hit.element, hit.markChance, hit.markDuration, hit.iceMarkAlsoSlows);
  if (hit.extraMark && !reacted && !enemy.dead) {
    markOrReact(enemy, hit.extraMark, 1.0, undefined, hit.iceMarkAlsoSlows);
  }
}

function markOrReact(
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
    triggerReaction(r, enemy, element);
    enemy.removeMark(mark.element);
    enemy.reactionCooldowns.set(r.id, r.cooldownPerEnemy);
    return true;
  }
  // Relic: brand — mark chance ×1.5
  const effChance = state.ownedRelics.has('brand') ? Math.min(1, chance * 1.5) : chance;
  if (Math.random() < effChance) {
    let dur = duration ?? ELEMENTS[element].defaultMarkDuration;
    // Relic: iceage — ice mark duration ×2
    if (element === 'ice' && state.ownedRelics.has('iceage')) dur *= 2;
    enemy.addMark(element, dur);
    if (element === 'ice' && iceMarkAlsoSlows) {
      enemy.applySlow(0.10, dur, state.time);
    }
  }
  return false;
}

function reactionDamageMultiplier(r: ReactionDef): number {
  let mult = 1.0;
  if (state.ownedRelics.has('master')) mult *= 1.2;
  // Thunder-involved reactions: overload (fire+thunder), frostarc (ice+thunder), plague (thunder+poison)
  if (state.ownedRelics.has('static') &&
      (r.sources[0] === 'thunder' || r.sources[1] === 'thunder')) {
    mult *= 1.5;
  }
  return mult;
}

function triggerReaction(r: ReactionDef, target: Enemy, incomingElement: ElementId) {
  state.stats.reactionsTriggered++;

  spawnReactionBurst(target, r);

  // Screen shake scaled by reaction damage
  const shakeAmt = Math.min(10, r.damage / 15);
  if (shakeAmt > state.shakeIntensity) state.shakeIntensity = shakeAmt;

  if (state.ownedRelics.has('crystal')) {
    state.gold += 2;
    state.stats.goldEarned += 2;
    spawnFloater({ x: target.pos.x, y: target.pos.y - 8 }, '+2💰', '#ffd93d');
  }
  if (state.ownedRelics.has('afterglow')) {
    state.afterglowUntil = state.time + 1.0;
  }

  const dmgMult = reactionDamageMultiplier(r);
  const dmg = r.damage * dmgMult;

  const killedTargets: Enemy[] = [];

  // Direct damage
  if (dmg > 0) {
    if (r.aoeRadius) {
      const r2 = (r.aoeRadius * CELL_SIZE) * (r.aoeRadius * CELL_SIZE);
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (distSq(e.pos, target.pos) > r2) continue;
        const before = e.dead;
        e.takeDamage(dmg, state.time, { isMagic: true, isReaction: true });
        spawnFloater(e.pos, Math.round(dmg), r.color);
        if (!before && e.dead) killedTargets.push(e);
      }
    } else {
      const before = target.dead;
      target.takeDamage(dmg, state.time, { isMagic: true, isReaction: true });
      spawnFloater(target.pos, Math.round(dmg), r.color);
      if (!before && target.dead) killedTargets.push(target);
    }
  }

  // Vulnerable (steam)
  if (r.vulnerableBonus && r.vulnerableDuration) {
    const rad = (r.aoeRadius ?? 1.5) * CELL_SIZE;
    const r2 = rad * rad;
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (distSq(e.pos, target.pos) > r2) continue;
      e.applyVulnerable(r.vulnerableBonus, r.vulnerableDuration, state.time);
    }
  }

  if (r.freezeDuration) target.applyFreeze(r.freezeDuration, state.time);

  if (r.chainDamage && r.chainCount) {
    const cd = r.chainDamage * dmgMult;
    const candidates = state.enemies
      .filter(e => !e.dead && e.id !== target.id)
      .map(e => ({ e, d: distSq(e.pos, target.pos) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, r.chainCount);
    for (const c of candidates) {
      const before = c.e.dead;
      c.e.takeDamage(cd, state.time, { isMagic: true, isReaction: true });
      spawnFloater(c.e.pos, Math.round(cd), r.color);
      spawnBeam(target.pos, c.e.pos, r.color);
      if (!before && c.e.dead) killedTargets.push(c.e);
    }
  }

  if (r.groundZoneDuration && r.groundZoneRadius !== undefined) {
    state.groundZones.push({
      pos: { ...target.pos },
      radiusPx: r.groundZoneRadius * CELL_SIZE,
      remainingTime: r.groundZoneDuration,
      damagePerSec: r.groundZoneDamagePerSec ?? 0,
      slow: r.groundSlow ?? 0,
      color: r.color,
    });
  }

  if (r.spreadMarkCount && r.spreadMarkElement) {
    const nearest = state.enemies
      .filter(e => !e.dead && e.id !== target.id)
      .map(e => ({ e, d: distSq(e.pos, target.pos) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, r.spreadMarkCount);
    for (const c of nearest) {
      c.e.addMark(r.spreadMarkElement);
      spawnBeam(target.pos, c.e.pos, r.color);
    }
  }

  // Relic: chain — reaction kill marks nearest enemy with incoming element
  if (killedTargets.length > 0 && state.ownedRelics.has('chain')) {
    for (const killed of killedTargets) {
      let nearest: Enemy | null = null;
      let bestD = Infinity;
      for (const e of state.enemies) {
        if (e.dead || e.id === killed.id) continue;
        const d = distSq(e.pos, killed.pos);
        if (d < bestD) { nearest = e; bestD = d; }
      }
      if (nearest) {
        nearest.addMark(incomingElement);
        spawnBeam(killed.pos, nearest.pos, ELEMENTS[incomingElement].color);
      }
    }
  }
}

function spawnFloater(pos: { x: number; y: number }, value: number | string, color: string) {
  state.floaters.push({
    pos: { x: pos.x + (Math.random() - 0.5) * 8, y: pos.y - 6 },
    text: typeof value === 'number' ? `${value}` : value,
    color,
    remainingTime: 0.9,
    vy: -28,
  });
}

function spawnReactionBurst(target: Enemy, r: ReactionDef) {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const speed = 80 + Math.random() * 80;
    state.particles.push({
      pos: { ...target.pos },
      vel: { x: Math.cos(a) * speed, y: Math.sin(a) * speed },
      color: r.color,
      remainingTime: 0.5,
      life: 0.5,
      radius: 3 + Math.random() * 2,
    });
  }
}

function spawnBeam(a: { x: number; y: number }, b: { x: number; y: number }, color: string) {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    state.particles.push({
      pos: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
      vel: { x: 0, y: 0 },
      color,
      remainingTime: 0.25,
      life: 0.25,
      radius: 3,
    });
  }
}
