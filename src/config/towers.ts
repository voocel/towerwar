import type { TowerId, ElementId, TargetStrategy } from '@/types';
import { PALETTE } from '@/theme';

export interface TowerDef {
  id: TowerId;
  name: string;
  element: ElementId;
  cost: number;
  damage: number;
  attackSpeed: number;   // attacks per second at L1
  range: number;         // grid cells at L1
  markChance: number;    // 0-1 at L1
  aoeRadius?: number;    // grid cells
  dotDamage?: number;    // per second
  dotDuration?: number;
  chainCount?: number;
  slowAmount?: number;   // 0-1
  slowDuration?: number;
  bulletSpeed?: number;  // pixels per second, undefined means instant
  color: string;
  defaultStrategy: TargetStrategy;
  canHitFlying: boolean;
  spriteKey?: string;    // future: AI-generated art
}

export const TOWERS: Record<TowerId, TowerDef> = {
  spark: {
    id: 'spark', name: '火花塔', element: 'fire',
    cost: 30, damage: 12, attackSpeed: 1.5, range: 4, markChance: 1.0,
    bulletSpeed: 700, color: PALETTE.fire,
    defaultStrategy: 'first', canHitFlying: true,
  },
  lava: {
    id: 'lava', name: '熔岩塔', element: 'fire',
    cost: 80, damage: 22, attackSpeed: 0.5, range: 5, markChance: 1.0,
    aoeRadius: 1.5, bulletSpeed: 400, color: PALETTE.fireAccent,
    defaultStrategy: 'first', canHitFlying: false,
  },
  frost: {
    id: 'frost', name: '霜针塔', element: 'ice',
    cost: 35, damage: 14, attackSpeed: 1.2, range: 4, markChance: 0.6,
    slowAmount: 0.15, slowDuration: 2, bulletSpeed: 800, color: PALETTE.ice,
    defaultStrategy: 'first', canHitFlying: false,
  },
  blizzard: {
    id: 'blizzard', name: '暴雪塔', element: 'ice',
    cost: 90, damage: 7, attackSpeed: 0.8, range: 4, markChance: 1.0,
    aoeRadius: 2, slowAmount: 0.30, slowDuration: 2,
    bulletSpeed: 450, color: PALETTE.iceAccent,
    defaultStrategy: 'first', canHitFlying: false,
  },
  arc: {
    id: 'arc', name: '电弧塔', element: 'thunder',
    cost: 45, damage: 11, attackSpeed: 1.0, range: 4, markChance: 1.0,
    chainCount: 3, color: PALETTE.thunder,
    defaultStrategy: 'first', canHitFlying: true,
  },
  magstorm: {
    id: 'magstorm', name: '磁暴塔', element: 'thunder',
    cost: 100, damage: 38, attackSpeed: 0.7, range: 5, markChance: 1.0,
    bulletSpeed: 1000, color: PALETTE.thunderAccent,
    defaultStrategy: 'strongest', canHitFlying: true,
  },
  toxin: {
    id: 'toxin', name: '毒刺塔', element: 'poison',
    cost: 40, damage: 7, attackSpeed: 1.3, range: 4, markChance: 1.0,
    dotDamage: 3, dotDuration: 5, bulletSpeed: 650, color: PALETTE.poison,
    defaultStrategy: 'strongest', canHitFlying: false,
  },
  miasma: {
    id: 'miasma', name: '瘴雾塔', element: 'poison',
    cost: 85, damage: 3, attackSpeed: 1.5, range: 3, markChance: 1.0,
    aoeRadius: 2, dotDamage: 2, dotDuration: 5,
    bulletSpeed: 350, color: PALETTE.poisonAccent,
    defaultStrategy: 'first', canHitFlying: false,
  },
};

export const UPGRADE_SCALES = [1.0, 1.7, 2.8];
export const UPGRADE_ATTACK_SPEED_SCALES = [1.0, 1.15, 1.35];
export const UPGRADE_COST_RATIO = [1.0, 0.8, 1.2];
export const UPGRADE_RANGE_BONUS = [0, 0.5, 1.0];
export const FROST_MARK_CHANCE_BY_LEVEL = [0.60, 0.75, 0.90];
export const SELL_RATIO = 0.7;
