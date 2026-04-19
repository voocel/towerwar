import type { Vec2, GridPos } from '@/types';

export const CELL_SIZE = 32;
export const GRID_COLS = 25;
export const GRID_ROWS = 18;
export const PLAY_WIDTH = GRID_COLS * CELL_SIZE;   // 800
export const PLAY_HEIGHT = GRID_ROWS * CELL_SIZE;  // 576
export const HUD_WIDTH = 200;
export const CANVAS_WIDTH = PLAY_WIDTH + HUD_WIDTH; // 1000
export const CANVAS_HEIGHT = PLAY_HEIGHT;           // 576

export function gridToPixel(gx: number, gy: number): Vec2 {
  return { x: gx * CELL_SIZE + CELL_SIZE / 2, y: gy * CELL_SIZE + CELL_SIZE / 2 };
}

export function pixelToGrid(x: number, y: number): GridPos {
  return { gx: Math.floor(x / CELL_SIZE), gy: Math.floor(y / CELL_SIZE) };
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function inBounds(gx: number, gy: number): boolean {
  return gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS;
}
