import type { GameContext } from '@/game/GameContext';
import type { TalentId } from '@/types';

/**
 * Per-talent mutation. Receives the freshly-built GameContext (after the
 * level's startGold / startLives have landed) and tweaks fields in place.
 *
 * Adding a new talent = adding one row to TALENT_APPLIERS — no core code
 * changes elsewhere.
 */
type TalentApplier = (ctx: GameContext) => void;

const TALENT_APPLIERS: Record<TalentId, TalentApplier> = {
  pioneer: (ctx) => {
    ctx.gold += 50;
  },
  harvest: (ctx) => {
    ctx.goldKillMultiplier *= 1.2;
  },
  delay: (ctx) => {
    ctx.firstWaveExtraDelay += 5;
  },
  reforge: (ctx) => {
    ctx.sellRatio = 0.85;
  },
  extra_relic: (ctx) => {
    ctx.relicChoiceCount += 1;
  },
};

/**
 * Apply each equipped talent's modifier to the context. Idempotent only when
 * called once per run (some appliers add rather than overwrite); call exactly
 * once right after `new GameContext(level)`.
 */
export function applyEquippedTalents(ctx: GameContext, equipped: TalentId[]) {
  for (const id of equipped) {
    const fn = TALENT_APPLIERS[id];
    if (fn) fn(ctx);
  }
}
