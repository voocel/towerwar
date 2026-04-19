import type { RelicId } from '@/types';

export interface RelicDef {
  id: RelicId;
  name: string;
  description: string;
  icon: string;
}

export const RELICS: Record<RelicId, RelicDef> = {
  ember:       { id: 'ember',       name: '星火燎原', icon: '🔥', description: '🔥印记敌死→爆炸 15 伤 1 格' },
  iceage:      { id: 'iceage',      name: '冰河世纪', icon: '❄️', description: '冰印记持续 +100%' },
  static:      { id: 'static',      name: '静电积累', icon: '⚡', description: '电系反应伤害 +50%' },
  pathogen:    { id: 'pathogen',    name: '病原体',   icon: '☠️', description: '毒 DOT 伤害 +50%' },
  master:      { id: 'master',      name: '元素大师', icon: '🌈', description: '所有反应伤害 +20%' },
  multimark:   { id: 'multimark',   name: '多重印记', icon: '🔱', description: '敌人最多同时挂 3 种印记' },
  chain:       { id: 'chain',       name: '链式反应', icon: '🔗', description: '反应击杀→最近敌人自动挂同印记' },
  brand:       { id: 'brand',       name: '印记强化', icon: '🎯', description: '印记施加率 ×1.5' },
  afterglow:   { id: 'afterglow',   name: '余波',     icon: '✨', description: '反应后 1s 内所有攻击 +25%' },
  crystal:     { id: 'crystal',     name: '储能水晶', icon: '💎', description: '每次反应 +2 金币' },
  eternalfire: { id: 'eternalfire', name: '永恒之火', icon: '🌋', description: '🔥印记击杀留 3s 灼烧地面 8/s' },
  resonance:   { id: 'resonance',   name: '共鸣',     icon: '🌀', description: '阵型加成效果 ×1.5' },
};

export const EARLY_RELIC_POOL: RelicId[] = [
  'ember', 'iceage', 'static', 'pathogen', 'master',
  'chain', 'brand', 'afterglow', 'crystal', 'eternalfire', 'resonance',
];

// Only offered at node 3 or later
export const LATE_RELIC_POOL: RelicId[] = ['multimark'];
