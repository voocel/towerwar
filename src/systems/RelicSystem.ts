import type { GameContext } from '@/game/GameContext';
import type { NodeOption, PendingNode } from '@/types';
import { RELICS, ALL_RELIC_IDS } from '@/config/relics';

const AFTERGLOW_WINDOW = 1.0;

/**
 * Build an N-card node where N = ctx.relicChoiceCount (default 3, talent
 * extra_relic bumps to 4). Composition: (N-1) random unowned relics + 1 gold
 * pack. If unowned relic pool is smaller than (N-1), the remaining slots fall
 * back to additional gold packs so the player always sees N choices.
 */
export function generateNode(ctx: GameContext): PendingNode {
  const total = Math.max(2, ctx.relicChoiceCount);
  const available = ALL_RELIC_IDS.filter(r => !ctx.ownedRelics.has(r));
  const relicSlots = total - 1;
  const picks = shuffle(available).slice(0, relicSlots);

  const options: NodeOption[] = picks.map(r => {
    const def = RELICS[r];
    return { type: 'relic', relicId: r, label: def.name, description: def.description, icon: def.icon };
  });
  // Pad to N with gold packs (always at least 1).
  const goldSlots = total - options.length;
  for (let i = 0; i < goldSlots; i++) {
    options.push({
      type: 'gold', goldAmount: 100,
      label: '金币包', icon: '💰',
      description: '立即获得 100 金币',
    });
  }

  return { options: shuffle(options) };
}

export function resolveNode(ctx: GameContext, opt: NodeOption) {
  if (opt.type === 'relic') {
    ctx.ownedRelics.add(opt.relicId);
  } else {
    ctx.gold += opt.goldAmount;
    ctx.stats.goldEarned += opt.goldAmount;
  }
  ctx.pendingNode = null;
}

// ─── Effect hooks (called from ReactionSystem / TargetingSystem) ───

export function onReactionTriggered(ctx: GameContext) {
  if (ctx.ownedRelics.has('crystal')) {
    ctx.gold += 2;
    ctx.stats.goldEarned += 2;
  }
  if (ctx.ownedRelics.has('afterglow')) {
    ctx.lastReactionAt = ctx.time;
  }
}

export function reactionDamageMultiplier(ctx: GameContext): number {
  return ctx.ownedRelics.has('master') ? 1.2 : 1.0;
}

export function markChanceMultiplier(ctx: GameContext): number {
  return ctx.ownedRelics.has('brand') ? 1.5 : 1.0;
}

export function attackDamageMultiplier(ctx: GameContext): number {
  if (!ctx.ownedRelics.has('afterglow')) return 1.0;
  const since = ctx.time - ctx.lastReactionAt;
  return since >= 0 && since <= AFTERGLOW_WINDOW ? 1.25 : 1.0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
