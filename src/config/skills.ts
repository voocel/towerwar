import type { SkillId } from '@/types';
import { PALETTE } from '@/theme';

export interface SkillDef {
  id: SkillId;
  name: string;
  shortName: string;     // for HUD button glyph
  description: string;
  cooldown: number;      // seconds
  damage: number;        // applied to all enemies in radius
  radiusGrid: number;    // grid cells
  color: string;
  // ── frost-nova only ──
  freezeDuration?: number;       // seconds enemies are frozen on hit
  // ── lightning only ──
  chainHops?: number;            // number of jumps including first target
  chainDecay?: number;           // damage multiplier per successive hop
  chainFirstRangeGrid?: number;  // search radius for the FIRST target (from click)
  chainHopRangeGrid?: number;    // max distance between consecutive jumps
}

export const SKILLS: Record<SkillId, SkillDef> = {
  meteor: {
    id: 'meteor', name: '陨石术', shortName: '🌠',
    description: '点选地面释放，造成 220 魔法伤害（半径 2.5 格）',
    cooldown: 30, damage: 220, radiusGrid: 2.5,
    color: PALETTE.fireAccent,
  },
  frostnova: {
    id: 'frostnova', name: '寒霜冲击波', shortName: '❄',
    description: '点选地面释放，120 魔法伤害 + 冻结 1.5s（半径 3 格）',
    cooldown: 35, damage: 120, radiusGrid: 3.0,
    color: PALETTE.iceAccent,
    freezeDuration: 1.5,
  },
  lightning: {
    id: 'lightning', name: '闪电链', shortName: '⚡',
    description: '点选目标释放，雷击首目标 200 伤害，链式跳 5 段（每跳 ×0.7）',
    cooldown: 25, damage: 200, radiusGrid: 3.0,
    color: PALETTE.thunderAccent,
    chainHops: 5, chainDecay: 0.7,
    chainFirstRangeGrid: 6, chainHopRangeGrid: 4,
  },
};
