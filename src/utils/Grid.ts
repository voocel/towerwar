import type { Vec2, GridPos } from '@/types';
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from '@/constants';

export function gridToPixel(gx: number, gy: number): Vec2 {
  return { x: gx * CELL_SIZE + CELL_SIZE / 2, y: gy * CELL_SIZE + CELL_SIZE / 2 };
}

export function pixelToGrid(x: number, y: number): GridPos {
  return { gx: Math.floor(x / CELL_SIZE), gy: Math.floor(y / CELL_SIZE) };
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt(distSq(a, b));
}

export function inBounds(gx: number, gy: number): boolean {
  return gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS;
}

interface SpatialEnemy {
  x: number;
  y: number;
  dead: boolean;
  reachedEnd: boolean;
}

/**
 * Find the nearest alive enemy within `maxDistSq` of (fromX, fromY).
 * `exclude` lets callers skip already-visited enemies (e.g. chain skills).
 */
export function findNearestEnemy<E extends SpatialEnemy>(
  enemies: E[],
  fromX: number,
  fromY: number,
  maxDistSq: number,
  exclude?: (e: E) => boolean,
): E | null {
  let best: E | null = null;
  let bestD = maxDistSq;
  for (const e of enemies) {
    if (e.dead || e.reachedEnd) continue;
    if (exclude && exclude(e)) continue;
    const dx = e.x - fromX;
    const dy = e.y - fromY;
    const d = dx * dx + dy * dy;
    if (d < bestD) { best = e; bestD = d; }
  }
  return best;
}

export function hexColor(s: string): number {
  // '#abcdef' or '#abcdef??' → 0xabcdef
  return parseInt(s.slice(1, 7), 16);
}
