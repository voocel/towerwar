import type { GridPos } from '@/types';

export type MapTheme = 'meadow' | 'forest' | 'tundra' | 'volcano' | 'void';

export interface MapDef {
  id: string;
  name: string;
  theme: MapTheme;
  waypoints: GridPos[];  // First entry is off-screen spawn, last is off-screen exit
}

// Act I — S curve across the whole field.
const MEADOW_WAYPOINTS: GridPos[] = [
  { gx: -1, gy: 2  },
  { gx: 6,  gy: 2  },
  { gx: 6,  gy: 8  },
  { gx: 14, gy: 8  },
  { gx: 14, gy: 3  },
  { gx: 20, gy: 3  },
  { gx: 20, gy: 15 },
  { gx: 4,  gy: 15 },
  { gx: 4,  gy: 12 },
  { gx: 25, gy: 12 },
];

// Act II — hook entering bottom-left, wrapping up then back down.
const FOREST_WAYPOINTS: GridPos[] = [
  { gx: -1, gy: 15 },
  { gx: 4,  gy: 15 },
  { gx: 4,  gy: 4  },
  { gx: 11, gy: 4  },
  { gx: 11, gy: 11 },
  { gx: 17, gy: 11 },
  { gx: 17, gy: 2  },
  { gx: 22, gy: 2  },
  { gx: 22, gy: 16 },
  { gx: 25, gy: 16 },
];

// Act III — enters from right, Z-zags across.
const TUNDRA_WAYPOINTS: GridPos[] = [
  { gx: 25, gy: 2  },
  { gx: 3,  gy: 2  },
  { gx: 3,  gy: 7  },
  { gx: 21, gy: 7  },
  { gx: 21, gy: 12 },
  { gx: 3,  gy: 12 },
  { gx: 3,  gy: 16 },
  { gx: 25, gy: 16 },
];

// Act IV — 熔岩之巢 · labyrinthine path with sharp vertical jolts; exits on the right.
const VOLCANO_WAYPOINTS: GridPos[] = [
  { gx: -1, gy: 8  },
  { gx: 5,  gy: 8  },
  { gx: 5,  gy: 2  },
  { gx: 12, gy: 2  },
  { gx: 12, gy: 10 },
  { gx: 18, gy: 10 },
  { gx: 18, gy: 4  },
  { gx: 22, gy: 4  },
  { gx: 22, gy: 15 },
  { gx: 9,  gy: 15 },
  { gx: 9,  gy: 13 },
  { gx: 25, gy: 13 },
];

// Act V — 苍穹之渊 · grand serpentine sweeping the full grid three times.
const VOID_WAYPOINTS: GridPos[] = [
  { gx: -1, gy: 1  },
  { gx: 23, gy: 1  },
  { gx: 23, gy: 4  },
  { gx: 2,  gy: 4  },
  { gx: 2,  gy: 8  },
  { gx: 23, gy: 8  },
  { gx: 23, gy: 12 },
  { gx: 2,  gy: 12 },
  { gx: 2,  gy: 16 },
  { gx: 25, gy: 16 },
];

export const MAPS: Record<string, MapDef> = {
  meadow:  { id: 'meadow',  name: '绿野',     theme: 'meadow',  waypoints: MEADOW_WAYPOINTS },
  forest:  { id: 'forest',  name: '秋林',     theme: 'forest',  waypoints: FOREST_WAYPOINTS },
  tundra:  { id: 'tundra',  name: '雪原',     theme: 'tundra',  waypoints: TUNDRA_WAYPOINTS },
  volcano: { id: 'volcano', name: '熔岩之巢', theme: 'volcano', waypoints: VOLCANO_WAYPOINTS },
  void:    { id: 'void',    name: '苍穹之渊', theme: 'void',    waypoints: VOID_WAYPOINTS },
};

export interface ActDef {
  id: number;
  name: string;       // Display name, e.g. "第一幕 · 绿野"
  mapId: string;      // key into MAPS
  bossLabel: string;  // Used in transition banner for next-act preview
}

export const ACTS: ActDef[] = [
  { id: 0, name: '第一幕 · 绿野',     mapId: 'meadow',  bossLabel: 'BOSS · 狂化兽王' },
  { id: 1, name: '第二幕 · 秋林',     mapId: 'forest',  bossLabel: 'BOSS · 林之腐主' },
  { id: 2, name: '第三幕 · 雪原',     mapId: 'tundra',  bossLabel: 'BOSS · 霜雪女皇' },
  { id: 3, name: '第四幕 · 熔岩之巢', mapId: 'volcano', bossLabel: 'BOSS · 熔心暴君' },
  { id: 4, name: '终幕 · 苍穹之渊',   mapId: 'void',    bossLabel: 'BOSS · 虚空之主' },
];

export function getActByIndex(idx: number): ActDef {
  const clamped = Math.max(0, Math.min(ACTS.length - 1, idx));
  return ACTS[clamped];
}
