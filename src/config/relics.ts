import type { RelicId } from '@/types';

export interface RelicDef {
  id: RelicId;
  name: string;
  icon: string;
  description: string;
}

/**
 * 首版 4 个遗物 — 每个机制都和"反应"或"印记"挂钩,呼应游戏特色。
 * 后续可加旧版的 ember/iceage/static/pathogen/multimark/chain/eternalfire/resonance。
 */
export const RELICS: Record<RelicId, RelicDef> = {
  crystal:   { id: 'crystal',   name: '储能水晶', icon: '💎', description: '每次反应触发 +2 金币' },
  master:    { id: 'master',    name: '元素大师', icon: '🌈', description: '所有反应伤害 ×1.2' },
  brand:     { id: 'brand',     name: '印记强化', icon: '🎯', description: '塔施加印记的概率 ×1.5' },
  afterglow: { id: 'afterglow', name: '余波',     icon: '✨', description: '反应触发后 1 秒内全体攻击 ×1.25' },
};

export const ALL_RELIC_IDS: RelicId[] = ['crystal', 'master', 'brand', 'afterglow'];
