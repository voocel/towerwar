import type { EnemyTypeId } from '@/types';

export interface EnemyDef {
  id: EnemyTypeId;
  name: string;
  hp: number;
  speed: number;           // grid cells per second
  armor?: number;          // 0-1 physical resistance
  magicResist?: number;    // 0-1
  reward: number;
  flying?: boolean;
  color: string;
  radius: number;          // draw radius in pixels
}

export const ENEMIES: Record<EnemyTypeId, EnemyDef> = {
  normal:    { id: 'normal',    name: '普通兵', hp: 100,  speed: 2.0, reward: 2,   color: '#7d8594', radius: 10 },
  fast:      { id: 'fast',      name: '快速',   hp: 60,   speed: 3.5, reward: 2,   color: '#6fb5c4', radius: 8 },
  elite:     { id: 'elite',     name: '精英',   hp: 300,  speed: 1.6, armor: 0.3, reward: 8, color: '#c26a3a', radius: 14 },
  flying:    { id: 'flying',    name: '飞空',   hp: 150,  speed: 2.5, flying: true, reward: 4, color: '#9474c0', radius: 10 },
  defender:  { id: 'defender',  name: '防御者', hp: 200,  speed: 1.8, reward: 5,   color: '#a04f72', radius: 12 },
  support:   { id: 'support',   name: '支援者', hp: 120,  speed: 2.0, reward: 4,   color: '#76b28e', radius: 11 },
  boss1:     { id: 'boss1',     name: 'BOSS 1', hp: 2000, speed: 1.2, armor: 0.4, reward: 150, color: '#c44a3a', radius: 22 },
  boss2:     { id: 'boss2',     name: 'BOSS 2', hp: 1500, speed: 1.5, magicResist: 0.3, reward: 0, color: '#b8648a', radius: 22 },
  boss3:     { id: 'boss3',     name: 'BOSS 3', hp: 1000, speed: 2.0, reward: 0,   color: '#7a55b0', radius: 22 },
};
