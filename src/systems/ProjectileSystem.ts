import { state } from '@/game/GameState';
import { applyHit, type HitPayload } from './ReactionSystem';

export function updateProjectiles(dt: number) {
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    const hit = p.update(dt);
    if (!hit) continue;
    const payload: HitPayload = {
      element: p.element,
      damage: p.damage,
      markChance: p.markChance,
      markDuration: p.markDuration,
      iceMarkAlsoSlows: p.iceMarkAlsoSlows,
      aoeRadiusPx: p.aoeRadiusPx,
      dotDamage: p.dotDamage,
      dotDuration: p.dotDuration,
      slowAmount: p.slowAmount,
      slowDuration: p.slowDuration,
      extraMark: p.extraMark,
    };
    applyHit(p.target, payload);
    p.alive = false;
  }
  state.projectiles = state.projectiles.filter(p => p.alive);
}
