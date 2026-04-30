// HiDPI strategy: every "logical pixel" the game thinks in is multiplied by
// DPR before reaching Phaser. The internal canvas buffer therefore has
// physical-pixel resolution on Retina (DPR=2) / 4K (DPR=3) screens, while
// the FIT scale mode shrinks it back to the viewport — so circles, lines,
// strokes and text are all rendered at native sharpness.
//
// Use the constants below directly (they're already DPR-scaled). For local
// "logical" numbers in scene/entity code, wrap with px(n).
const _DPR = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
export const DPR = _DPR;
export const px = (n: number) => n * _DPR;

export const GAME_WIDTH = px(1280);
export const GAME_HEIGHT = px(720);

export const CELL_SIZE = px(40);
export const GRID_COLS = 25;
export const GRID_ROWS = 15;
export const PLAY_WIDTH = GRID_COLS * CELL_SIZE;
export const PLAY_HEIGHT = GRID_ROWS * CELL_SIZE;
export const HUD_WIDTH = GAME_WIDTH - PLAY_WIDTH;

export const SCENES = {
  Boot: 'Boot',
  Preload: 'Preload',
  Title: 'Title',
  Chapter: 'Chapter',
  Game: 'Game',
  HUD: 'HUD',
  Pause: 'Pause',
  Result: 'Result',
  Settings: 'Settings',
  Relic: 'Relic',
  Store: 'Store',
  Talent: 'Talent',
} as const;

export const REGISTRY_KEYS = {
  // chapter granularity (stage 11)
  unlockedChapters: 'unlockedChapters',
  starsByChapter: 'starsByChapter',
  currentChapterId: 'currentChapterId',
  // meta-progression (stage 11)
  stardust: 'stardust',
  unlockedTowers: 'unlockedTowers',
  ownedTalents: 'ownedTalents',
  equippedTalents: 'equippedTalents',
  // settings
  settings: 'settings',
} as const;
