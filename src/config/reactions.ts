import type { ReactionId, ElementId } from '@/types';
import { PALETTE } from '@/theme';

export interface ReactionDef {
  id: ReactionId;
  name: string;
  sources: [ElementId, ElementId];
  damage: number;
  aoeRadius?: number;
  cooldownPerEnemy: number;
  color: string;
  // effect flags
  vulnerableBonus?: number;
  vulnerableDuration?: number;
  freezeDuration?: number;
  chainDamage?: number;
  chainCount?: number;
  groundZoneDuration?: number;
  groundZoneRadius?: number;
  groundZoneDamagePerSec?: number;
  groundSlow?: number;
  spreadMarkCount?: number;
  spreadMarkElement?: ElementId;
}

export const REACTIONS: Record<ReactionId, ReactionDef> = {
  steam: {
    id: 'steam', name: '蒸汽', sources: ['fire', 'ice'], color: PALETTE.steamColor,
    damage: 30, aoeRadius: 1.5, cooldownPerEnemy: 2,
    vulnerableBonus: 0.2, vulnerableDuration: 3,
  },
  overload: {
    id: 'overload', name: '超载', sources: ['fire', 'thunder'], color: PALETTE.overloadColor,
    damage: 80, cooldownPerEnemy: 3,
  },
  detonate: {
    id: 'detonate', name: '燃爆', sources: ['fire', 'poison'], color: PALETTE.detonateColor,
    damage: 120, aoeRadius: 2, cooldownPerEnemy: 3,
  },
  frostarc: {
    id: 'frostarc', name: '冻电链', sources: ['ice', 'thunder'], color: PALETTE.frostarcColor,
    damage: 25, chainDamage: 25, chainCount: 3, cooldownPerEnemy: 2,
    freezeDuration: 1.5,
  },
  toxicice: {
    id: 'toxicice', name: '剧毒冰原', sources: ['ice', 'poison'], color: PALETTE.toxiciceColor,
    damage: 0, cooldownPerEnemy: 2,
    groundZoneDuration: 2, groundZoneRadius: 1.5,
    groundZoneDamagePerSec: 8, groundSlow: 0.3,
  },
  plague: {
    id: 'plague', name: '瘟疫传导', sources: ['thunder', 'poison'], color: PALETTE.plagueColor,
    damage: 15, cooldownPerEnemy: 2,
    spreadMarkCount: 3, spreadMarkElement: 'poison',
  },
};

export function findReaction(a: ElementId, b: ElementId): ReactionDef | null {
  if (a === b) return null;
  for (const r of Object.values(REACTIONS)) {
    const [s1, s2] = r.sources;
    if ((s1 === a && s2 === b) || (s1 === b && s2 === a)) return r;
  }
  return null;
}
