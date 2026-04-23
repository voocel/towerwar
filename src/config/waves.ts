import type { EnemyTypeId } from '@/types';

export interface EnemySpawn {
  type: EnemyTypeId;
  count: number;
  delay: number;          // seconds between each spawn in this group
  startOffset?: number;   // seconds after wave start before this group begins
}

export interface WaveDef {
  id: number;
  name: string;
  spawns: EnemySpawn[];
  rewardGold: number;
  offerNode?: boolean;    // triggers three-choice node after this wave
}

// ---- Act 0 · 绿野 ----------------------------------------------------------
const ACT0_WAVES: WaveDef[] = [
  { id: 1, name: '波 1', rewardGold: 40, spawns: [
    { type: 'normal', count: 8, delay: 1.0 },
  ]},
  { id: 2, name: '波 2', rewardGold: 40, spawns: [
    { type: 'normal', count: 10, delay: 0.9 },
    { type: 'fast', count: 2, delay: 1.2, startOffset: 6 },
  ]},
  { id: 3, name: '波 3', rewardGold: 40, offerNode: true, spawns: [
    { type: 'normal', count: 8, delay: 0.7 },
    { type: 'fast', count: 4, delay: 0.9, startOffset: 3 },
  ]},
  { id: 4, name: '波 4', rewardGold: 40, spawns: [
    { type: 'fast', count: 8, delay: 0.8 },
  ]},
  { id: 5, name: '波 5', rewardGold: 40, spawns: [
    { type: 'normal', count: 10, delay: 0.7 },
    { type: 'fast', count: 5, delay: 0.8, startOffset: 2 },
    { type: 'elite', count: 1, delay: 0, startOffset: 8 },
  ]},
  { id: 6, name: '波 6', rewardGold: 40, offerNode: true, spawns: [
    { type: 'elite', count: 2, delay: 4, startOffset: 0 },
    { type: 'normal', count: 10, delay: 0.6, startOffset: 2 },
  ]},
  { id: 7, name: '波 7', rewardGold: 40, spawns: [
    { type: 'fast', count: 20, delay: 0.4 },
  ]},
  { id: 8, name: '波 8', rewardGold: 40, spawns: [
    { type: 'defender', count: 3, delay: 2.5 },
    { type: 'support', count: 3, delay: 2.5, startOffset: 1.2 },
    { type: 'normal', count: 6, delay: 0.8, startOffset: 4 },
  ]},
  { id: 9, name: '波 9', rewardGold: 40, offerNode: true, spawns: [
    { type: 'elite', count: 3, delay: 3 },
    { type: 'fast', count: 10, delay: 0.5, startOffset: 1 },
  ]},
  { id: 10, name: '波 10 · 飞空', rewardGold: 60, spawns: [
    { type: 'flying', count: 10, delay: 0.9 },
  ]},
  { id: 11, name: 'BOSS · 狂化兽王', rewardGold: 0, spawns: [
    { type: 'boss1', count: 1, delay: 0 },
  ]},
];

// ---- Act 1 · 秋林 ----------------------------------------------------------
const ACT1_WAVES: WaveDef[] = [
  { id: 1, name: '波 1', rewardGold: 50, spawns: [
    { type: 'normal', count: 10, delay: 0.8 },
    { type: 'fast', count: 4, delay: 0.8, startOffset: 2 },
  ]},
  { id: 2, name: '波 2', rewardGold: 50, spawns: [
    { type: 'defender', count: 2, delay: 3, startOffset: 0 },
    { type: 'normal', count: 10, delay: 0.7, startOffset: 2 },
  ]},
  { id: 3, name: '波 3', rewardGold: 50, offerNode: true, spawns: [
    { type: 'flying', count: 6, delay: 0.8 },
    { type: 'fast', count: 6, delay: 0.7, startOffset: 2 },
  ]},
  { id: 4, name: '波 4', rewardGold: 50, spawns: [
    { type: 'support', count: 3, delay: 2.5 },
    { type: 'elite', count: 2, delay: 4, startOffset: 4 },
    { type: 'normal', count: 8, delay: 0.8, startOffset: 1 },
  ]},
  { id: 5, name: '波 5', rewardGold: 50, spawns: [
    { type: 'fast', count: 16, delay: 0.45 },
    { type: 'flying', count: 4, delay: 1.2, startOffset: 3 },
  ]},
  { id: 6, name: '波 6', rewardGold: 50, offerNode: true, spawns: [
    { type: 'defender', count: 4, delay: 2.2 },
    { type: 'support', count: 2, delay: 3, startOffset: 1 },
    { type: 'elite', count: 2, delay: 4, startOffset: 6 },
  ]},
  { id: 7, name: '波 7', rewardGold: 50, spawns: [
    { type: 'flying', count: 12, delay: 0.6 },
    { type: 'normal', count: 8, delay: 0.8, startOffset: 1 },
  ]},
  { id: 8, name: '波 8', rewardGold: 50, spawns: [
    { type: 'elite', count: 4, delay: 2.5 },
    { type: 'fast', count: 12, delay: 0.4, startOffset: 2 },
  ]},
  { id: 9, name: '波 9', rewardGold: 50, offerNode: true, spawns: [
    { type: 'defender', count: 3, delay: 2.5 },
    { type: 'elite', count: 2, delay: 3, startOffset: 2 },
    { type: 'support', count: 3, delay: 2.5, startOffset: 4 },
    { type: 'flying', count: 6, delay: 0.8, startOffset: 1 },
  ]},
  { id: 10, name: '波 10 · 混战', rewardGold: 70, spawns: [
    { type: 'normal', count: 12, delay: 0.6 },
    { type: 'fast', count: 8, delay: 0.5, startOffset: 1 },
    { type: 'flying', count: 6, delay: 0.9, startOffset: 2 },
    { type: 'elite', count: 2, delay: 4, startOffset: 6 },
  ]},
  { id: 11, name: 'BOSS · 林之腐主', rewardGold: 0, spawns: [
    { type: 'boss2', count: 1, delay: 0 },
    { type: 'support', count: 3, delay: 4, startOffset: 2 },
  ]},
];

// ---- Act 2 · 雪原 ----------------------------------------------------------
const ACT2_WAVES: WaveDef[] = [
  { id: 1, name: '波 1', rewardGold: 60, spawns: [
    { type: 'fast', count: 14, delay: 0.5 },
    { type: 'normal', count: 8, delay: 0.9, startOffset: 2 },
  ]},
  { id: 2, name: '波 2', rewardGold: 60, spawns: [
    { type: 'elite', count: 3, delay: 3 },
    { type: 'flying', count: 6, delay: 0.9, startOffset: 1 },
  ]},
  { id: 3, name: '波 3', rewardGold: 60, offerNode: true, spawns: [
    { type: 'defender', count: 4, delay: 2 },
    { type: 'support', count: 3, delay: 2.5, startOffset: 1.5 },
    { type: 'fast', count: 10, delay: 0.5, startOffset: 3 },
  ]},
  { id: 4, name: '波 4', rewardGold: 60, spawns: [
    { type: 'flying', count: 16, delay: 0.5 },
  ]},
  { id: 5, name: '波 5', rewardGold: 60, spawns: [
    { type: 'elite', count: 5, delay: 2.5 },
    { type: 'fast', count: 14, delay: 0.4, startOffset: 2 },
  ]},
  { id: 6, name: '波 6', rewardGold: 60, offerNode: true, spawns: [
    { type: 'defender', count: 5, delay: 2 },
    { type: 'support', count: 4, delay: 2.2, startOffset: 1 },
    { type: 'elite', count: 3, delay: 3, startOffset: 5 },
  ]},
  { id: 7, name: '波 7', rewardGold: 60, spawns: [
    { type: 'flying', count: 10, delay: 0.6 },
    { type: 'elite', count: 3, delay: 3, startOffset: 2 },
    { type: 'fast', count: 10, delay: 0.5, startOffset: 4 },
  ]},
  { id: 8, name: '波 8', rewardGold: 60, spawns: [
    { type: 'elite', count: 6, delay: 2.2 },
    { type: 'defender', count: 3, delay: 2.5, startOffset: 3 },
  ]},
  { id: 9, name: '波 9', rewardGold: 60, offerNode: true, spawns: [
    { type: 'flying', count: 10, delay: 0.6 },
    { type: 'elite', count: 4, delay: 2.5, startOffset: 1 },
    { type: 'support', count: 4, delay: 2, startOffset: 4 },
    { type: 'fast', count: 14, delay: 0.4, startOffset: 2 },
  ]},
  { id: 10, name: '波 10 · 大军', rewardGold: 80, spawns: [
    { type: 'normal', count: 20, delay: 0.4 },
    { type: 'fast', count: 15, delay: 0.35, startOffset: 2 },
    { type: 'flying', count: 8, delay: 0.8, startOffset: 3 },
    { type: 'elite', count: 4, delay: 3, startOffset: 6 },
  ]},
  { id: 11, name: 'BOSS · 霜雪女皇', rewardGold: 0, spawns: [
    { type: 'boss3', count: 1, delay: 0 },
    { type: 'elite', count: 2, delay: 5, startOffset: 3 },
    { type: 'flying', count: 6, delay: 1.0, startOffset: 1 },
  ]},
];

// ---- Act 3 · 熔岩之巢 ------------------------------------------------------
const ACT3_WAVES: WaveDef[] = [
  { id: 1, name: '波 1', rewardGold: 70, spawns: [
    { type: 'flying', count: 8, delay: 0.7 },
    { type: 'fast', count: 10, delay: 0.45, startOffset: 2 },
  ]},
  { id: 2, name: '波 2', rewardGold: 70, spawns: [
    { type: 'defender', count: 5, delay: 2 },
    { type: 'elite', count: 3, delay: 3, startOffset: 4 },
  ]},
  { id: 3, name: '波 3', rewardGold: 70, offerNode: true, spawns: [
    { type: 'normal', count: 14, delay: 0.5 },
    { type: 'elite', count: 4, delay: 2.5, startOffset: 2 },
  ]},
  { id: 4, name: '波 4', rewardGold: 70, spawns: [
    { type: 'normal', count: 16, delay: 0.4 },
    { type: 'fast', count: 10, delay: 0.35, startOffset: 3 },
    { type: 'flying', count: 4, delay: 0.9, startOffset: 1 },
  ]},
  { id: 5, name: '波 5', rewardGold: 70, spawns: [
    { type: 'elite', count: 7, delay: 2 },
  ]},
  { id: 6, name: '波 6', rewardGold: 70, offerNode: true, spawns: [
    { type: 'defender', count: 5, delay: 2 },
    { type: 'support', count: 4, delay: 2, startOffset: 1 },
    { type: 'flying', count: 8, delay: 0.8, startOffset: 2 },
  ]},
  { id: 7, name: '波 7', rewardGold: 70, spawns: [
    { type: 'flying', count: 14, delay: 0.5 },
    { type: 'support', count: 3, delay: 3, startOffset: 2 },
  ]},
  { id: 8, name: '波 8', rewardGold: 70, spawns: [
    { type: 'elite', count: 6, delay: 2 },
    { type: 'defender', count: 4, delay: 2.5, startOffset: 2 },
  ]},
  { id: 9, name: '波 9', rewardGold: 70, offerNode: true, spawns: [
    { type: 'elite', count: 4, delay: 2.5 },
    { type: 'flying', count: 10, delay: 0.6, startOffset: 1 },
    { type: 'support', count: 4, delay: 2, startOffset: 3 },
    { type: 'fast', count: 12, delay: 0.4, startOffset: 2 },
  ]},
  { id: 10, name: '波 10 · 大军', rewardGold: 90, spawns: [
    { type: 'normal', count: 18, delay: 0.4 },
    { type: 'fast', count: 12, delay: 0.35, startOffset: 1 },
    { type: 'flying', count: 8, delay: 0.7, startOffset: 2 },
    { type: 'elite', count: 5, delay: 2.5, startOffset: 4 },
    { type: 'defender', count: 3, delay: 3, startOffset: 8 },
  ]},
  { id: 11, name: 'BOSS · 熔心暴君', rewardGold: 0, spawns: [
    { type: 'boss4', count: 1, delay: 0 },
    { type: 'elite', count: 3, delay: 4, startOffset: 2 },
    { type: 'support', count: 3, delay: 3.5, startOffset: 4 },
    { type: 'flying', count: 6, delay: 1.0, startOffset: 1 },
  ]},
];

// ---- Act 4 · 苍穹之渊 (终幕) -----------------------------------------------
const ACT4_WAVES: WaveDef[] = [
  { id: 1, name: '波 1', rewardGold: 80, spawns: [
    { type: 'elite', count: 4, delay: 2.2 },
    { type: 'flying', count: 8, delay: 0.7, startOffset: 1 },
    { type: 'fast', count: 10, delay: 0.4, startOffset: 3 },
  ]},
  { id: 2, name: '波 2', rewardGold: 80, spawns: [
    { type: 'elite', count: 6, delay: 1.8 },
    { type: 'defender', count: 4, delay: 2.5, startOffset: 2 },
  ]},
  { id: 3, name: '波 3', rewardGold: 80, offerNode: true, spawns: [
    { type: 'normal', count: 16, delay: 0.4 },
    { type: 'elite', count: 4, delay: 2.5, startOffset: 2 },
    { type: 'support', count: 3, delay: 2.5, startOffset: 4 },
    { type: 'flying', count: 6, delay: 0.8, startOffset: 1 },
  ]},
  { id: 4, name: '波 4 · 飞行突击', rewardGold: 80, spawns: [
    { type: 'flying', count: 22, delay: 0.45 },
  ]},
  { id: 5, name: '波 5 · 坚壁', rewardGold: 80, spawns: [
    { type: 'defender', count: 8, delay: 1.6 },
    { type: 'support', count: 4, delay: 2.5, startOffset: 2 },
  ]},
  { id: 6, name: '波 6', rewardGold: 80, offerNode: true, spawns: [
    { type: 'elite', count: 5, delay: 2.2 },
    { type: 'defender', count: 5, delay: 2.2, startOffset: 2 },
    { type: 'support', count: 5, delay: 2, startOffset: 4 },
  ]},
  { id: 7, name: '波 7 · 精英潮', rewardGold: 80, spawns: [
    { type: 'elite', count: 10, delay: 1.6 },
  ]},
  { id: 8, name: '波 8', rewardGold: 80, spawns: [
    { type: 'fast', count: 20, delay: 0.3 },
    { type: 'flying', count: 10, delay: 0.6, startOffset: 2 },
    { type: 'elite', count: 4, delay: 3, startOffset: 3 },
  ]},
  { id: 9, name: '波 9', rewardGold: 80, offerNode: true, spawns: [
    { type: 'defender', count: 6, delay: 2 },
    { type: 'elite', count: 5, delay: 2.5, startOffset: 1 },
    { type: 'flying', count: 12, delay: 0.6, startOffset: 2 },
    { type: 'support', count: 5, delay: 2, startOffset: 4 },
    { type: 'fast', count: 14, delay: 0.35, startOffset: 3 },
  ]},
  { id: 10, name: '波 10 · 最终风暴', rewardGold: 100, spawns: [
    { type: 'normal', count: 25, delay: 0.35 },
    { type: 'fast', count: 20, delay: 0.3, startOffset: 1 },
    { type: 'flying', count: 12, delay: 0.6, startOffset: 2 },
    { type: 'elite', count: 6, delay: 2.2, startOffset: 4 },
    { type: 'defender', count: 5, delay: 2.5, startOffset: 6 },
    { type: 'support', count: 4, delay: 3, startOffset: 8 },
  ]},
  { id: 11, name: 'BOSS · 虚空之主', rewardGold: 0, spawns: [
    { type: 'boss5', count: 1, delay: 0 },
    { type: 'elite', count: 4, delay: 3.5, startOffset: 3 },
    { type: 'defender', count: 3, delay: 4, startOffset: 6 },
    { type: 'flying', count: 10, delay: 1.0, startOffset: 1 },
    { type: 'support', count: 3, delay: 4, startOffset: 9 },
  ]},
];

export const WAVES_BY_ACT: readonly (readonly WaveDef[])[] = [ACT0_WAVES, ACT1_WAVES, ACT2_WAVES, ACT3_WAVES, ACT4_WAVES];

export function getActWaves(actIndex: number): readonly WaveDef[] {
  const clamped = Math.max(0, Math.min(WAVES_BY_ACT.length - 1, actIndex));
  return WAVES_BY_ACT[clamped];
}

// Difficulty multiplier applied to each spawned Enemy's hp/maxHp
// to make later acts harder without duplicating per-act enemy stat tables.
const ACT_DIFFICULTY_SCALE = [1.0, 1.4, 1.85, 2.4, 3.0] as const;

export function actDifficultyScale(actIndex: number): number {
  const clamped = Math.max(0, Math.min(ACT_DIFFICULTY_SCALE.length - 1, actIndex));
  return ACT_DIFFICULTY_SCALE[clamped];
}

// Reward scales slower than HP so money doesn't spiral out.
const ACT_REWARD_SCALE = [1.0, 1.2, 1.4, 1.6, 1.8] as const;

export function actRewardScale(actIndex: number): number {
  const clamped = Math.max(0, Math.min(ACT_REWARD_SCALE.length - 1, actIndex));
  return ACT_REWARD_SCALE[clamped];
}
