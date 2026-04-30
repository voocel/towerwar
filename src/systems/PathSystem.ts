import type { GridPos, Vec2 } from '@/types';
import { gridToPixel } from '@/utils/Grid';

export function waypointsToPixels(waypoints: GridPos[]): Vec2[] {
  return waypoints.map(g => gridToPixel(g.gx, g.gy));
}

/** Set of grid cells covered by axis-aligned segments between consecutive waypoints. */
export function computePathSet(waypoints: GridPos[]): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (a.gx === b.gx) {
      const [y1, y2] = a.gy < b.gy ? [a.gy, b.gy] : [b.gy, a.gy];
      for (let y = y1; y <= y2; y++) set.add(a.gx * 1000 + y);
    } else {
      const [x1, x2] = a.gx < b.gx ? [a.gx, b.gx] : [b.gx, a.gx];
      for (let x = x1; x <= x2; x++) set.add(x * 1000 + a.gy);
    }
  }
  return set;
}

export function isPathCell(set: Set<number>, gx: number, gy: number): boolean {
  return set.has(gx * 1000 + gy);
}
