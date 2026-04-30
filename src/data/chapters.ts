import type { GridPos, TowerId } from '@/types';
import { PALETTE } from '@/theme';

export type ChapterId = 'ch1_meadow' | 'ch2_forest' | 'ch3_tundra' | 'ch4_volcano' | 'ch5_void';

export interface ChapterDef {
  id: ChapterId;
  index: number;        // 1..5, used for prerequisite math
  name: string;
  subtitle: string;
  bossLabel: string;
  waypoints: GridPos[];
  /** Hue used in chapter-select card border / accents. */
  accent: string;
  /** Background color for the play-field (lawn / forest floor / snow / lava / void). */
  fieldBase: string;
  fieldGrid: string;
  /** Tower roster gradually opens up; level overrides may further restrict. */
  defaultAllowedTowers: TowerId[];
  /** Grid size for path lookup — kept consistent at game-scale defaults. */
}

const CH1_MEADOW_PATH: GridPos[] = [
  { gx: -1, gy: 3 },
  { gx: 9,  gy: 3 },
  { gx: 9,  gy: 7 },
  { gx: 18, gy: 7 },
  { gx: 18, gy: 11 },
  { gx: 25, gy: 11 },
];

const CH2_FOREST_PATH: GridPos[] = [
  { gx: -1, gy: 13 },
  { gx: 4,  gy: 13 },
  { gx: 4,  gy: 4  },
  { gx: 11, gy: 4  },
  { gx: 11, gy: 10 },
  { gx: 17, gy: 10 },
  { gx: 17, gy: 2  },
  { gx: 22, gy: 2  },
  { gx: 22, gy: 14 },
  { gx: 25, gy: 14 },
];

const CH3_TUNDRA_PATH: GridPos[] = [
  { gx: 25, gy: 2  },
  { gx: 3,  gy: 2  },
  { gx: 3,  gy: 7  },
  { gx: 21, gy: 7  },
  { gx: 21, gy: 12 },
  { gx: 3,  gy: 12 },
  { gx: 3,  gy: 14 },
  { gx: 25, gy: 14 },
];

const CH4_VOLCANO_PATH: GridPos[] = [
  { gx: -1, gy: 8  },
  { gx: 5,  gy: 8  },
  { gx: 5,  gy: 2  },
  { gx: 12, gy: 2  },
  { gx: 12, gy: 10 },
  { gx: 18, gy: 10 },
  { gx: 18, gy: 4  },
  { gx: 22, gy: 4  },
  { gx: 22, gy: 13 },
  { gx: 25, gy: 13 },
];

const CH5_VOID_PATH: GridPos[] = [
  { gx: -1, gy: 1  },
  { gx: 23, gy: 1  },
  { gx: 23, gy: 4  },
  { gx: 2,  gy: 4  },
  { gx: 2,  gy: 8  },
  { gx: 23, gy: 8  },
  { gx: 23, gy: 12 },
  { gx: 2,  gy: 12 },
  { gx: 2,  gy: 14 },
  { gx: 25, gy: 14 },
];

export const CHAPTERS: Record<ChapterId, ChapterDef> = {
  ch1_meadow: {
    id: 'ch1_meadow', index: 1,
    name: '绿野', subtitle: '入门 · 三元素基础',
    bossLabel: '狂化兽王',
    waypoints: CH1_MEADOW_PATH,
    accent: PALETTE.poisonAccent,
    fieldBase: PALETTE.grassBase, fieldGrid: PALETTE.grassLight,
    defaultAllowedTowers: ['spark', 'frost', 'arc'],
  },
  ch2_forest: {
    id: 'ch2_forest', index: 2,
    name: '秋林', subtitle: '飞行 + 反应',
    bossLabel: '林之腐主',
    waypoints: CH2_FOREST_PATH,
    accent: PALETTE.fireAccent,
    fieldBase: '#3a2818', fieldGrid: '#4a3322',
    defaultAllowedTowers: ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin'],
  },
  ch3_tundra: {
    id: 'ch3_tundra', index: 3,
    name: '雪原', subtitle: '冰系 · 全 8 塔',
    bossLabel: '霜雪女皇',
    waypoints: CH3_TUNDRA_PATH,
    accent: PALETTE.iceAccent,
    fieldBase: '#1c2838', fieldGrid: '#2a3848',
    defaultAllowedTowers: ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma'],
  },
  ch4_volcano: {
    id: 'ch4_volcano', index: 4,
    name: '熔岩之巢', subtitle: '高血护卫 · 反应叠加',
    bossLabel: '熔心暴君',
    waypoints: CH4_VOLCANO_PATH,
    accent: PALETTE.fire,
    fieldBase: '#2a1208', fieldGrid: '#3a1c10',
    defaultAllowedTowers: ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma'],
  },
  ch5_void: {
    id: 'ch5_void', index: 5,
    name: '苍穹之渊', subtitle: '终幕 · 反应叠加考验',
    bossLabel: '虚空之主',
    waypoints: CH5_VOID_PATH,
    accent: PALETTE.accentRose,
    fieldBase: '#0e1322', fieldGrid: '#1a2138',
    defaultAllowedTowers: ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma'],
  },
};

export const CHAPTER_ORDER: ChapterId[] =
  ['ch1_meadow', 'ch2_forest', 'ch3_tundra', 'ch4_volcano', 'ch5_void'];

export function getChapter(id: ChapterId): ChapterDef {
  return CHAPTERS[id];
}
