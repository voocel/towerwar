import type { Vec2 } from '@/types';

export interface GroundZone {
  pos: Vec2;
  radiusPx: number;
  remainingTime: number;
  damagePerSec: number;
  slow: number;
  color: string;
}

export interface Floater {
  pos: Vec2;
  text: string;
  color: string;
  remainingTime: number;
  vy: number;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  color: string;
  remainingTime: number;
  life: number;
  radius: number;
}
