// Core type definitions

export type ElementId = 'fire' | 'ice' | 'thunder' | 'poison';

export type TowerId = 'spark' | 'lava' | 'frost' | 'blizzard' | 'arc' | 'magstorm' | 'toxin' | 'miasma';

export type ReactionId = 'steam' | 'overload' | 'detonate' | 'frostarc' | 'toxicice' | 'plague';

export type FormationId = 'inferno' | 'glacier' | 'grid' | 'reactor';

export type SkillId = 'meteor' | 'frostnova' | 'lightning';

export type RelicId = 'crystal' | 'master' | 'brand' | 'afterglow';

export type TalentId = 'pioneer' | 'harvest' | 'delay' | 'reforge' | 'extra_relic';

/** Account-bound modifier purchased with stardust; equipped per-run (max 2). */
export interface TalentDef {
  id: TalentId;
  name: string;
  description: string;
  icon: string;            // emoji or sprite key
  cost: number;            // stardust price
}

/** Items the meta-store can sell. */
export type StoreItemKind = 'tower' | 'talent';

export type NodeOption =
  | { type: 'relic'; relicId: RelicId; label: string; description: string; icon: string }
  | { type: 'gold'; goldAmount: number; label: string; description: string; icon: string };

export interface PendingNode {
  options: NodeOption[];
}

export type EnemyTypeId =
  | 'normal' | 'fast' | 'elite' | 'flying' | 'defender' | 'support'
  | 'boss1' | 'boss2' | 'boss3' | 'boss4' | 'boss5';

export interface ElementMark {
  element: ElementId;
  remainingTime: number;
  baseDuration: number;
}

export type TargetStrategy = 'first' | 'last' | 'strongest' | 'weakest' | 'nearest';

export const TARGET_STRATEGIES: readonly TargetStrategy[] =
  ['first', 'last', 'strongest', 'weakest', 'nearest'] as const;

export const TARGET_STRATEGY_LABEL: Record<TargetStrategy, string> = {
  first:     '最前',
  last:      '最后',
  strongest: '最强',
  weakest:   '最弱',
  nearest:   '最近',
};

export type GameSpeed = 1 | 2 | 3;

export interface Vec2 { x: number; y: number; }
export interface GridPos { gx: number; gy: number; }
