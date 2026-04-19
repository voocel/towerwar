import { state } from '@/game/GameState';
import { distSq } from '@/utils/Grid';

export function updateEnemies(dt: number) {
  for (const e of state.enemies) e.update(dt, state.time);
}

export function updateGroundZones(dt: number) {
  for (const z of state.groundZones) {
    z.remainingTime -= dt;
    if (z.remainingTime <= 0) continue;
    const r2 = z.radiusPx * z.radiusPx;
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (distSq(e.pos, z.pos) > r2) continue;
      if (z.damagePerSec > 0) {
        e.takeDamage(z.damagePerSec * dt, state.time, { isMagic: true });
      }
      if (z.slow > 0) {
        e.applySlow(z.slow, 0.2, state.time);
      }
    }
  }
  state.groundZones = state.groundZones.filter(z => z.remainingTime > 0);
}

export function updateEffects(dt: number) {
  for (const f of state.floaters) {
    f.remainingTime -= dt;
    f.pos.y += f.vy * dt;
    f.vy += 20 * dt;
  }
  state.floaters = state.floaters.filter(f => f.remainingTime > 0);

  for (const p of state.particles) {
    p.remainingTime -= dt;
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.x *= 0.9;
    p.vel.y *= 0.9;
  }
  state.particles = state.particles.filter(p => p.remainingTime > 0);

  // Decay screen shake
  if (state.shakeIntensity > 0) {
    state.shakeIntensity = Math.max(0, state.shakeIntensity - dt * 30);
  }
}
