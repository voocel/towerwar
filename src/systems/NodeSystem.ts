import { state, type NodeOption, type PendingNode } from '@/game/GameState';
import { RELICS, EARLY_RELIC_POOL, LATE_RELIC_POOL } from '@/config/relics';
import type { RelicId } from '@/types';

export function generateNode(isLate: boolean): PendingNode {
  const pool: NodeOption[] = [];

  const available = [
    ...EARLY_RELIC_POOL.filter(r => !state.ownedRelics.has(r)),
    ...(isLate ? LATE_RELIC_POOL.filter(r => !state.ownedRelics.has(r)) : []),
  ];
  const shuffled = shuffle(available).slice(0, 2);
  for (const rid of shuffled) {
    const r = RELICS[rid];
    pool.push({
      type: 'relic', relicId: rid,
      label: r.name, description: r.description, icon: r.icon,
    });
  }
  pool.push({
    type: 'upgrade',
    label: '升级券', icon: '🎟️',
    description: '立即免费升级任意塔 1 级',
  });
  pool.push({
    type: 'gold', goldAmount: 100,
    label: '金币包', icon: '💰',
    description: '立即获得 100 金币',
  });

  const final = shuffle(pool).slice(0, 3);
  return { options: final };
}

export function resolveNode(option: NodeOption) {
  if (option.type === 'relic' && option.relicId) {
    state.ownedRelics.add(option.relicId);
    applyRelicOnAcquire(option.relicId);
  } else if (option.type === 'upgrade') {
    state.upgradeVouchers += 1;
  } else if (option.type === 'gold') {
    const amt = option.goldAmount ?? 0;
    state.gold += amt;
    state.stats.goldEarned += amt;
  }
  state.pendingNode = null;
  state.nodesCompleted += 1;
}

function applyRelicOnAcquire(r: RelicId) {
  if (r === 'multimark') {
    for (const e of state.enemies) e.maxMarks = 3;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
