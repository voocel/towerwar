import type { TowerId } from '@/types';

/**
 * Stardust price to permanently unlock each tower in the meta-store.
 * `spark` is free (always unlocked) so first-run players have something to
 * place. Tiers progress fire/ice/thunder/poison along an effective-strength
 * gradient; high-tier wide-AOE towers (blizzard / magstorm / miasma) sit at
 * the top of the curve.
 */
export const TOWER_PRICES: Record<TowerId, number> = {
  spark:    0,
  frost:   80,
  arc:     80,
  lava:   120,
  toxin:  120,
  blizzard: 180,
  magstorm: 180,
  miasma:   240,
};

/** Towers that come unlocked for everyone — never appear in the store list. */
export const DEFAULT_UNLOCKED_TOWERS: TowerId[] = ['spark'];
