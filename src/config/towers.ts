import type { TowerId, ElementId, TargetStrategy } from '@/types';
import { PALETTE } from '@/theme';

export type TowerRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_LABEL: Record<TowerRarity, string> = {
  common:    '普通',
  rare:      '稀有',
  epic:      '史诗',
  legendary: '传说',
};

export const RARITY_COLOR: Record<TowerRarity, string> = {
  common:    PALETTE.rarityCommon,
  rare:      PALETTE.rarityRare,
  epic:      PALETTE.rarityEpic,
  legendary: PALETTE.rarityLegendary,
};

export interface TowerDef {
  id: TowerId;
  name: string;
  element: ElementId;
  rarity: TowerRarity;
  /** One-line mechanic summary shown on store cards & in-game tooltip. */
  tagline: string;
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
    rarity: 'common', tagline: '单体快速 · 起手必备',
    cost: 30, damage: 12, attackSpeed: 1.5, range: 4, markChance: 0.50,
    bulletSpeed: 700, color: PALETTE.fire,
    defaultStrategy: 'first', canHitFlying: true,
  },
  lava: {
    id: 'lava', name: '熔岩塔', element: 'fire',
    rarity: 'rare', tagline: 'AOE 1.5 格 · 慢速重击',
    cost: 80, damage: 22, attackSpeed: 0.5, range: 5, markChance: 0.70,
    aoeRadius: 1.5, bulletSpeed: 400, color: PALETTE.fireAccent,
    defaultStrategy: 'first', canHitFlying: false,
  },
  frost: {
    id: 'frost', name: '霜针塔', element: 'ice',
    rarity: 'common', tagline: '单体减速 · 控场起手',
    cost: 35, damage: 14, attackSpeed: 1.2, range: 4, markChance: 0.6,
    slowAmount: 0.15, slowDuration: 2, bulletSpeed: 800, color: PALETTE.ice,
    defaultStrategy: 'first', canHitFlying: false,
  },
  blizzard: {
    id: 'blizzard', name: '暴雪塔', element: 'ice',
    rarity: 'epic', tagline: 'AOE 2 格 · 强力减速 30%',
    cost: 90, damage: 7, attackSpeed: 0.8, range: 4, markChance: 0.65,
    aoeRadius: 2, slowAmount: 0.30, slowDuration: 2,
    bulletSpeed: 450, color: PALETTE.iceAccent,
    defaultStrategy: 'first', canHitFlying: false,
  },
  arc: {
    id: 'arc', name: '电弧塔', element: 'thunder',
    rarity: 'rare', tagline: '链式弹射 3 跳 · 可击飞',
    cost: 45, damage: 11, attackSpeed: 1.0, range: 4, markChance: 0.45,
    chainCount: 3, color: PALETTE.thunder,
    defaultStrategy: 'first', canHitFlying: true,
  },
  magstorm: {
    id: 'magstorm', name: '磁暴塔', element: 'thunder',
    rarity: 'epic', tagline: '高伤精准 · 优先打硬目标',
    cost: 100, damage: 38, attackSpeed: 0.7, range: 5, markChance: 0.80,
    bulletSpeed: 1000, color: PALETTE.thunderAccent,
    defaultStrategy: 'strongest', canHitFlying: true,
  },
  toxin: {
    id: 'toxin', name: '毒刺塔', element: 'poison',
    rarity: 'rare', tagline: '5 秒持续中毒 · 越硬越赚',
    cost: 40, damage: 7, attackSpeed: 1.3, range: 4, markChance: 0.55,
    dotDamage: 3, dotDuration: 5, bulletSpeed: 650, color: PALETTE.poison,
    defaultStrategy: 'strongest', canHitFlying: false,
  },
  miasma: {
    id: 'miasma', name: '瘴雾塔', element: 'poison',
    rarity: 'legendary', tagline: 'AOE 满标记 · 反应触发器',
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
