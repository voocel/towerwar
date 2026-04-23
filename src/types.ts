// Core type definitions

export type ElementId = 'fire' | 'ice' | 'thunder' | 'poison';
export type TowerId = 'spark' | 'lava' | 'frost' | 'blizzard' | 'arc' | 'magstorm' | 'toxin' | 'miasma';
export type ReactionId = 'steam' | 'overload' | 'detonate' | 'frostarc' | 'toxicice' | 'plague';
export type FormationId = 'inferno' | 'glacier' | 'grid' | 'reactor';
export type RelicId =
  | 'ember' | 'iceage' | 'static' | 'pathogen' | 'master' | 'multimark'
  | 'chain' | 'brand' | 'afterglow' | 'crystal' | 'eternalfire' | 'resonance';
export type EnemyTypeId =
  | 'normal' | 'fast' | 'elite' | 'flying' | 'defender' | 'support'
  | 'boss1' | 'boss2' | 'boss3' | 'boss4' | 'boss5';

export interface Vec2 { x: number; y: number; }
export interface GridPos { gx: number; gy: number; }

export interface ElementMark {
  element: ElementId;
  remainingTime: number;
  baseDuration: number;
}

export interface ReactionCooldown {
  reactionId: ReactionId;
  remainingTime: number;
}
