import type { TowerId, EnemyTypeId, GridPos, SkillId } from '@/types';
import { CHAPTERS, type ChapterId } from './chapters';

export interface EnemySpawn {
  type: EnemyTypeId;
  count: number;
  delay: number;          // seconds between spawns
  startOffset?: number;   // seconds after wave start
}

export interface WaveDef {
  id: number;
  name: string;
  spawns: EnemySpawn[];
  rewardGold: number;
  tips?: string;
}

export interface StarConditions {
  win: true;
  livesAtLeast: number;        // ★2 — keep at least this many lives
  noSkillUsed: boolean;        // ★3 — beat the level without using any skill
}

/**
 * Stage 11 schema:
 *   1 chapter = 1 LevelDef (id = chapterId).
 *   The 4 acts (sub-stages) of pre-stage-11 are now wave 1-3 / 4-6 / 7-9 / 10-12,
 *   with the BOSS landing on wave 12. Relic nodes fire after wave 4 and 8 so
 *   the player gets exactly two build-decisions per chapter.
 *
 * `index` / `isBoss` are retained as display metadata for chapter cards and
 * result summaries.
 */
export interface LevelDef {
  id: string;
  chapterId: ChapterId;
  index: number;          // always 1 in stage-11 schema (single level per chapter)
  name: string;
  isBoss: boolean;        // chapter ends on a BOSS wave → true
  waypoints: GridPos[];
  startGold: number;
  startLives: number;
  allowedTowers: TowerId[];
  allowedSkills: SkillId[];
  starConditions: StarConditions;
  waves: WaveDef[];
  /** Wave indices (1-based) after which a relic node should pop. */
  relicNodeAfterWaves: number[];
}

const ALL_8: TowerId[] = ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma'];

// Per-chapter starting gold — tightened so opening 1-2 waves are about
// "survive + save", not "fully deploy turn 1". Headroom still grows by chapter.
const START_GOLD_BY_CHAPTER: Record<ChapterId, number> = {
  ch1_meadow: 120,
  ch2_forest: 160,
  ch3_tundra: 200,
  ch4_volcano: 240,
  ch5_void:   300,
};

// Skill unlock — by chapter index. ch1 none / ch2 meteor / ch3 +frostnova / ch4+ all 3.
function skillsForChapter(idx: number): SkillId[] {
  const out: SkillId[] = [];
  if (idx >= 2) out.push('meteor');
  if (idx >= 3) out.push('frostnova');
  if (idx >= 4) out.push('lightning');
  return out;
}

// Tower roster opens up across the early chapters; from ch3 onwards full 8.
function towersForChapter(idx: number): TowerId[] {
  if (idx === 1) return ['spark', 'frost', 'arc', 'lava', 'blizzard', 'magstorm'];
  if (idx === 2) return ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin'];
  return ALL_8;
}

interface ChapterWaveBlocks {
  pre: WaveDef[];      // waves 1-3 (intro)
  mid: WaveDef[];      // waves 4-6 (escalation; first relic node fires after wave 4)
  late: WaveDef[];     // waves 7-9 (variety / specialist)
  boss: WaveDef[];     // waves 10-12 (boss approach + BOSS); second relic node fires after wave 8 → just before this block
}

function buildChapterLevel(chapterId: ChapterId, displayName: string, blocks: ChapterWaveBlocks): LevelDef {
  const ch = CHAPTERS[chapterId];
  const startLives = 20;

  // Concatenate + renumber waves 1..12 so HUD labels stay sequential.
  const all = [...blocks.pre, ...blocks.mid, ...blocks.late, ...blocks.boss];
  const waves: WaveDef[] = all.map((w, i) => ({ ...w, id: i + 1, name: w.name ?? `波 ${i + 1}` }));

  return {
    id: chapterId,
    chapterId,
    index: 1,
    name: displayName,
    isBoss: true,
    waypoints: ch.waypoints,
    startGold: START_GOLD_BY_CHAPTER[chapterId],
    startLives,
    allowedTowers: towersForChapter(ch.index),
    allowedSkills: skillsForChapter(ch.index),
    // ★2: keep ≥ 70% lives across 12 waves; ★3 still demands no skill use.
    starConditions: { win: true, livesAtLeast: Math.ceil(startLives * 0.7), noSkillUsed: true },
    waves,
    relicNodeAfterWaves: [4, 8],
  };
}

// ─── Chapter 1 · 绿野 ────────────────────────────────────────────
const CH1: LevelDef = buildChapterLevel('ch1_meadow', '第 1 章 · 绿野', {
  pre: [
    { id: 0, name: '波 1', rewardGold: 40, spawns: [
      { type: 'normal', count: 8, delay: 1.0 },
    ]},
    { id: 0, name: '波 2', rewardGold: 40, spawns: [
      { type: 'normal', count: 10, delay: 0.9 },
      { type: 'fast', count: 2, delay: 1.2, startOffset: 6 },
    ]},
    { id: 0, name: '波 3 · 混编', rewardGold: 50, tips: '⚡ 多种敌人混编', spawns: [
      { type: 'normal', count: 8, delay: 0.7 },
      { type: 'fast', count: 4, delay: 0.9, startOffset: 3 },
    ]},
  ],
  mid: [
    { id: 0, name: '波 4 · 速攻', rewardGold: 50, spawns: [
      { type: 'fast', count: 8, delay: 0.8 },
    ]},
    { id: 0, name: '波 5 · 首个精英', rewardGold: 50, tips: '⚠ 出现首个精英', spawns: [
      { type: 'normal', count: 10, delay: 0.7 },
      { type: 'fast', count: 5, delay: 0.8, startOffset: 2 },
      { type: 'elite', count: 1, delay: 0, startOffset: 8 },
    ]},
    { id: 0, name: '波 6 · 双精英', rewardGold: 60, spawns: [
      { type: 'elite', count: 2, delay: 4 },
      { type: 'normal', count: 10, delay: 0.6, startOffset: 2 },
    ]},
  ],
  late: [
    { id: 0, name: '波 7 · 高速突进', rewardGold: 60, tips: '⚡ 高速突进', spawns: [
      { type: 'fast', count: 16, delay: 0.4 },
    ]},
    { id: 0, name: '波 8 · 防御者+支援', rewardGold: 60, tips: '🛡 防御者带支援', spawns: [
      { type: 'defender', count: 3, delay: 2.5 },
      { type: 'support', count: 3, delay: 2.5, startOffset: 1.2 },
    ]},
    { id: 0, name: '波 9 · 飞行潮', rewardGold: 70, tips: '🦅 全飞行 · 仅火/雷可命中', spawns: [
      { type: 'flying', count: 10, delay: 0.9 },
    ]},
  ],
  boss: [
    { id: 0, name: '波 10 · 前哨', rewardGold: 60, spawns: [
      { type: 'elite', count: 2, delay: 3.5 },
      { type: 'fast', count: 8, delay: 0.5, startOffset: 1 },
    ]},
    { id: 0, name: '波 11 · 冲锋', rewardGold: 60, spawns: [
      { type: 'elite', count: 3, delay: 3 },
      { type: 'fast', count: 10, delay: 0.5, startOffset: 1 },
    ]},
    { id: 0, name: '波 12 · BOSS · 狂化兽王', rewardGold: 100, tips: '👹 高甲，魔法 / 反应伤害更有效', spawns: [
      { type: 'boss1', count: 1, delay: 0 },
      { type: 'fast', count: 8, delay: 0.6, startOffset: 4 },
    ]},
  ],
});

// ─── Chapter 2 · 秋林 ────────────────────────────────────────────
const CH2: LevelDef = buildChapterLevel('ch2_forest', '第 2 章 · 秋林', {
  pre: [
    { id: 0, name: '波 1 · 林边', rewardGold: 60, spawns: [
      { type: 'normal', count: 10, delay: 0.8 },
      { type: 'fast', count: 4, delay: 0.8, startOffset: 2 },
    ]},
    { id: 0, name: '波 2 · 防守', rewardGold: 60, spawns: [
      { type: 'defender', count: 2, delay: 3 },
      { type: 'normal', count: 10, delay: 0.7, startOffset: 2 },
    ]},
    { id: 0, name: '波 3 · 飞行混编', rewardGold: 70, tips: '🦅 飞行混编', spawns: [
      { type: 'flying', count: 6, delay: 0.8 },
      { type: 'fast', count: 6, delay: 0.7, startOffset: 2 },
    ]},
  ],
  mid: [
    { id: 0, name: '波 4 · 全塔解锁', rewardGold: 70, spawns: [
      { type: 'support', count: 3, delay: 2.5 },
      { type: 'elite', count: 2, delay: 4, startOffset: 4 },
      { type: 'normal', count: 8, delay: 0.8, startOffset: 1 },
    ]},
    { id: 0, name: '波 5 · 飞速混合', rewardGold: 70, spawns: [
      { type: 'fast', count: 16, delay: 0.45 },
      { type: 'flying', count: 4, delay: 1.2, startOffset: 3 },
    ]},
    { id: 0, name: '波 6 · 援军', rewardGold: 80, spawns: [
      { type: 'defender', count: 4, delay: 2.2 },
      { type: 'support', count: 2, delay: 3, startOffset: 1 },
      { type: 'elite', count: 2, delay: 4, startOffset: 6 },
    ]},
  ],
  late: [
    { id: 0, name: '波 7 · 飞潮', rewardGold: 70, spawns: [
      { type: 'flying', count: 12, delay: 0.6 },
      { type: 'normal', count: 8, delay: 0.8, startOffset: 1 },
    ]},
    { id: 0, name: '波 8 · 精英速攻', rewardGold: 70, spawns: [
      { type: 'elite', count: 4, delay: 2.5 },
      { type: 'fast', count: 12, delay: 0.4, startOffset: 2 },
    ]},
    { id: 0, name: '波 9 · 全形态混战', rewardGold: 90, tips: '🌪 全形态混战', spawns: [
      { type: 'normal', count: 12, delay: 0.6 },
      { type: 'fast', count: 8, delay: 0.5, startOffset: 1 },
      { type: 'flying', count: 6, delay: 0.9, startOffset: 2 },
      { type: 'elite', count: 2, delay: 4, startOffset: 6 },
    ]},
  ],
  boss: [
    { id: 0, name: '波 10 · 前哨', rewardGold: 70, spawns: [
      { type: 'defender', count: 3, delay: 2.5 },
      { type: 'elite', count: 2, delay: 3, startOffset: 2 },
    ]},
    { id: 0, name: '波 11 · 虫潮', rewardGold: 70, spawns: [
      { type: 'support', count: 3, delay: 2.5 },
      { type: 'flying', count: 6, delay: 0.8, startOffset: 1 },
      { type: 'fast', count: 12, delay: 0.4, startOffset: 2 },
    ]},
    { id: 0, name: '波 12 · BOSS · 林之腐主', rewardGold: 110, tips: '👹 30% 魔抗，雷反应更稳', spawns: [
      { type: 'boss2', count: 1, delay: 0 },
      { type: 'support', count: 3, delay: 4, startOffset: 2 },
    ]},
  ],
});

// ─── Chapter 3 · 雪原 ────────────────────────────────────────────
const CH3: LevelDef = buildChapterLevel('ch3_tundra', '第 3 章 · 雪原', {
  pre: [
    { id: 0, name: '波 1 · 寒涧', rewardGold: 80, spawns: [
      { type: 'fast', count: 14, delay: 0.5 },
      { type: 'normal', count: 8, delay: 0.9, startOffset: 2 },
    ]},
    { id: 0, name: '波 2 · 精英+飞行', rewardGold: 80, spawns: [
      { type: 'elite', count: 3, delay: 3 },
      { type: 'flying', count: 6, delay: 0.9, startOffset: 1 },
    ]},
    { id: 0, name: '波 3 · 防+援+速', rewardGold: 90, spawns: [
      { type: 'defender', count: 4, delay: 2 },
      { type: 'support', count: 3, delay: 2.5, startOffset: 1.5 },
      { type: 'fast', count: 10, delay: 0.5, startOffset: 3 },
    ]},
  ],
  mid: [
    { id: 0, name: '波 4 · 飞行潮', rewardGold: 80, tips: '🦅 飞行潮', spawns: [
      { type: 'flying', count: 16, delay: 0.5 },
    ]},
    { id: 0, name: '波 5 · 精英速攻', rewardGold: 80, spawns: [
      { type: 'elite', count: 5, delay: 2.5 },
      { type: 'fast', count: 14, delay: 0.4, startOffset: 2 },
    ]},
    { id: 0, name: '波 6 · 防援精合流', rewardGold: 100, spawns: [
      { type: 'defender', count: 5, delay: 2 },
      { type: 'support', count: 4, delay: 2.2, startOffset: 1 },
      { type: 'elite', count: 3, delay: 3, startOffset: 5 },
    ]},
  ],
  late: [
    { id: 0, name: '波 7 · 大军前奏', rewardGold: 80, spawns: [
      { type: 'flying', count: 10, delay: 0.6 },
      { type: 'elite', count: 3, delay: 3, startOffset: 2 },
      { type: 'fast', count: 10, delay: 0.5, startOffset: 4 },
    ]},
    { id: 0, name: '波 8 · 精英专场', rewardGold: 80, spawns: [
      { type: 'elite', count: 6, delay: 2.2 },
      { type: 'defender', count: 3, delay: 2.5, startOffset: 3 },
    ]},
    { id: 0, name: '波 9 · 大军压境', rewardGold: 120, tips: '🌊 大军压境', spawns: [
      { type: 'normal', count: 18, delay: 0.4 },
      { type: 'fast', count: 12, delay: 0.35, startOffset: 2 },
      { type: 'flying', count: 8, delay: 0.8, startOffset: 3 },
      { type: 'elite', count: 4, delay: 3, startOffset: 6 },
    ]},
  ],
  boss: [
    { id: 0, name: '波 10 · 前哨', rewardGold: 80, spawns: [
      { type: 'flying', count: 8, delay: 0.6 },
      { type: 'fast', count: 12, delay: 0.4, startOffset: 2 },
    ]},
    { id: 0, name: '波 11 · 亲卫', rewardGold: 80, spawns: [
      { type: 'elite', count: 4, delay: 2.5 },
      { type: 'support', count: 3, delay: 3, startOffset: 4 },
    ]},
    { id: 0, name: '波 12 · BOSS · 霜雪女皇', rewardGold: 140, tips: '👹 高速 + 飞行护卫', spawns: [
      { type: 'boss3', count: 1, delay: 0 },
      { type: 'elite', count: 2, delay: 5, startOffset: 3 },
      { type: 'flying', count: 6, delay: 1.0, startOffset: 1 },
    ]},
  ],
});

// ─── Chapter 4 · 熔岩之巢 ────────────────────────────────────────
const CH4: LevelDef = buildChapterLevel('ch4_volcano', '第 4 章 · 熔岩之巢', {
  pre: [
    { id: 0, name: '波 1 · 火山口', rewardGold: 100, spawns: [
      { type: 'flying', count: 8, delay: 0.7 },
      { type: 'fast', count: 10, delay: 0.45, startOffset: 2 },
    ]},
    { id: 0, name: '波 2 · 防+精英', rewardGold: 100, spawns: [
      { type: 'defender', count: 5, delay: 2 },
      { type: 'elite', count: 3, delay: 3, startOffset: 4 },
    ]},
    { id: 0, name: '波 3 · 大军', rewardGold: 120, spawns: [
      { type: 'normal', count: 14, delay: 0.5 },
      { type: 'elite', count: 4, delay: 2.5, startOffset: 2 },
    ]},
  ],
  mid: [
    { id: 0, name: '波 4 · 速攻', rewardGold: 100, spawns: [
      { type: 'normal', count: 16, delay: 0.4 },
      { type: 'fast', count: 10, delay: 0.35, startOffset: 3 },
    ]},
    { id: 0, name: '波 5 · 精英专场', rewardGold: 100, tips: '⚔ 精英专场', spawns: [
      { type: 'elite', count: 7, delay: 2 },
    ]},
    { id: 0, name: '波 6 · 防援飞合流', rewardGold: 130, spawns: [
      { type: 'defender', count: 5, delay: 2 },
      { type: 'support', count: 4, delay: 2, startOffset: 1 },
      { type: 'flying', count: 8, delay: 0.8, startOffset: 2 },
    ]},
  ],
  late: [
    { id: 0, name: '波 7 · 飞援', rewardGold: 100, spawns: [
      { type: 'flying', count: 14, delay: 0.5 },
      { type: 'support', count: 3, delay: 3, startOffset: 2 },
    ]},
    { id: 0, name: '波 8 · 精英铁壁', rewardGold: 100, spawns: [
      { type: 'elite', count: 6, delay: 2 },
      { type: 'defender', count: 4, delay: 2.5, startOffset: 2 },
    ]},
    { id: 0, name: '波 9 · 五形态合流', rewardGold: 150, tips: '🌋 五形态合流', spawns: [
      { type: 'normal', count: 18, delay: 0.4 },
      { type: 'fast', count: 12, delay: 0.35, startOffset: 1 },
      { type: 'flying', count: 8, delay: 0.7, startOffset: 2 },
      { type: 'elite', count: 5, delay: 2.5, startOffset: 4 },
      { type: 'defender', count: 3, delay: 3, startOffset: 8 },
    ]},
  ],
  boss: [
    { id: 0, name: '波 10 · 前哨', rewardGold: 100, spawns: [
      { type: 'elite', count: 4, delay: 2.5 },
      { type: 'fast', count: 12, delay: 0.4, startOffset: 2 },
    ]},
    { id: 0, name: '波 11 · 禁卫', rewardGold: 100, spawns: [
      { type: 'defender', count: 5, delay: 2 },
      { type: 'support', count: 3, delay: 3, startOffset: 1 },
      { type: 'flying', count: 6, delay: 0.9, startOffset: 2 },
    ]},
    { id: 0, name: '波 12 · BOSS · 熔心暴君', rewardGold: 170, tips: '👹 双抗 + 精英护卫', spawns: [
      { type: 'boss4', count: 1, delay: 0 },
      { type: 'elite', count: 3, delay: 4, startOffset: 2 },
      { type: 'support', count: 3, delay: 3.5, startOffset: 4 },
      { type: 'flying', count: 6, delay: 1.0, startOffset: 1 },
    ]},
  ],
});

// ─── Chapter 5 · 苍穹之渊 ────────────────────────────────────────
const CH5: LevelDef = buildChapterLevel('ch5_void', '第 5 章 · 苍穹之渊', {
  pre: [
    { id: 0, name: '波 1 · 渊底', rewardGold: 120, spawns: [
      { type: 'elite', count: 4, delay: 2.2 },
      { type: 'flying', count: 8, delay: 0.7, startOffset: 1 },
      { type: 'fast', count: 10, delay: 0.4, startOffset: 3 },
    ]},
    { id: 0, name: '波 2 · 精英铁壁', rewardGold: 120, spawns: [
      { type: 'elite', count: 6, delay: 1.8 },
      { type: 'defender', count: 4, delay: 2.5, startOffset: 2 },
    ]},
    { id: 0, name: '波 3 · 五形态', rewardGold: 140, spawns: [
      { type: 'normal', count: 16, delay: 0.4 },
      { type: 'elite', count: 4, delay: 2.5, startOffset: 2 },
      { type: 'support', count: 3, delay: 2.5, startOffset: 4 },
      { type: 'flying', count: 6, delay: 0.8, startOffset: 1 },
    ]},
  ],
  mid: [
    { id: 0, name: '波 4 · 飞行突击', rewardGold: 120, tips: '🦅 22 只飞行', spawns: [
      { type: 'flying', count: 22, delay: 0.45 },
    ]},
    { id: 0, name: '波 5 · 必先点支援', rewardGold: 120, tips: '🛡 必先点支援', spawns: [
      { type: 'defender', count: 8, delay: 1.6 },
      { type: 'support', count: 4, delay: 2.5, startOffset: 2 },
    ]},
    { id: 0, name: '波 6 · 三防御者', rewardGold: 140, spawns: [
      { type: 'elite', count: 5, delay: 2.2 },
      { type: 'defender', count: 5, delay: 2.2, startOffset: 2 },
      { type: 'support', count: 5, delay: 2, startOffset: 4 },
    ]},
  ],
  late: [
    { id: 0, name: '波 7 · 10 精英', rewardGold: 120, tips: '⚔ 10 只精英', spawns: [
      { type: 'elite', count: 10, delay: 1.6 },
    ]},
    { id: 0, name: '波 8 · 速飞精', rewardGold: 120, spawns: [
      { type: 'fast', count: 20, delay: 0.3 },
      { type: 'flying', count: 10, delay: 0.6, startOffset: 2 },
      { type: 'elite', count: 4, delay: 3, startOffset: 3 },
    ]},
    { id: 0, name: '波 9 · 终战预演', rewardGold: 160, tips: '🌪 终战预演', spawns: [
      { type: 'normal', count: 22, delay: 0.35 },
      { type: 'fast', count: 18, delay: 0.3, startOffset: 1 },
      { type: 'flying', count: 10, delay: 0.6, startOffset: 2 },
      { type: 'elite', count: 5, delay: 2.2, startOffset: 4 },
      { type: 'defender', count: 4, delay: 2.5, startOffset: 6 },
    ]},
  ],
  boss: [
    { id: 0, name: '波 10 · 前哨', rewardGold: 120, spawns: [
      { type: 'elite', count: 5, delay: 2 },
      { type: 'fast', count: 16, delay: 0.35, startOffset: 1 },
    ]},
    { id: 0, name: '波 11 · 禁卫', rewardGold: 120, spawns: [
      { type: 'defender', count: 6, delay: 2 },
      { type: 'support', count: 4, delay: 2.5, startOffset: 1 },
      { type: 'flying', count: 10, delay: 0.7, startOffset: 2 },
    ]},
    { id: 0, name: '波 12 · BOSS · 虚空之主', rewardGold: 200, tips: '👹 终极 BOSS · 唯一打法是反应叠加', spawns: [
      { type: 'boss5', count: 1, delay: 0 },
      { type: 'elite', count: 4, delay: 3.5, startOffset: 3 },
      { type: 'defender', count: 3, delay: 4, startOffset: 6 },
      { type: 'flying', count: 10, delay: 1.0, startOffset: 1 },
    ]},
  ],
});

const ALL_LEVELS: LevelDef[] = [CH1, CH2, CH3, CH4, CH5];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(
  ALL_LEVELS.map(l => [l.id, l]),
);

export function getLevel(id: string): LevelDef {
  const l = LEVELS[id];
  if (!l) throw new Error(`Unknown level id: ${id}`);
  return l;
}

