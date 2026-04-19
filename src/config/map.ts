import type { GridPos } from '@/types';
import { GRID_COLS, GRID_ROWS } from '@/utils/Grid';
import { MAPS, type MapDef } from './maps';
import { state } from '@/game/GameState';

// Path-cell bitmap cached per map (set of gx*1000+gy)
const pathSetCache = new Map<string, Set<number>>();

function buildPathSet(map: MapDef): Set<number> {
  const set = new Set<number>();
  const wps = map.waypoints;
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i];
    const b = wps[i + 1];
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

function pathSet(map: MapDef): Set<number> {
  let s = pathSetCache.get(map.id);
  if (!s) {
    s = buildPathSet(map);
    pathSetCache.set(map.id, s);
  }
  return s;
}

export function getCurrentMap(): MapDef {
  return MAPS[state.currentMapId] ?? MAPS.meadow;
}

export function getWaypoints(): GridPos[] {
  return getCurrentMap().waypoints;
}

export function isPathCell(gx: number, gy: number): boolean {
  return pathSet(getCurrentMap()).has(gx * 1000 + gy);
}

export function isBuildable(gx: number, gy: number): boolean {
  return gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS && !isPathCell(gx, gy);
}
