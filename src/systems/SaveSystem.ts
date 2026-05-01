import { REGISTRY_KEYS } from '@/constants';
import type { TowerId, TalentId } from '@/types';
import type { ChapterId } from '@/data/chapters';
import { DEFAULT_UNLOCKED_TOWERS } from '@/config/towerPrices';
import { MAX_EQUIPPED_TALENTS } from '@/config/talents';

export type Settings = { sfx: boolean; bgm: boolean; shake: boolean };
export type SettingKey = keyof Settings;

/**
 * Snapshot persisted to localStorage. Schema is forward-compatible: missing
 * keys fall back to defaults; pre-stage-11 level-grain progress is migrated
 * lazily into chapter granularity on read.
 */
export interface SaveSnapshot {
  // chapter granularity
  unlockedChapters: ChapterId[];
  starsByChapter: Record<ChapterId, number>;
  // meta progression
  stardust: number;
  unlockedTowers: TowerId[];
  ownedTalents: TalentId[];
  equippedTalents: TalentId[];
  // settings
  settings: Settings;
  // legacy input only: readSave can migrate these if an old save is present.
  unlockedLevels?: string[];
  starsByLevel?: Record<string, number>;
}

const KEY = 'towerwar.save';
const DEFAULT_UNLOCKED_CHAPTERS: ChapterId[] = ['ch1_meadow'];

function defaultSnapshot(): SaveSnapshot {
  return {
    unlockedChapters: [...DEFAULT_UNLOCKED_CHAPTERS],
    starsByChapter: {} as Record<ChapterId, number>,
    stardust: 0,
    unlockedTowers: [...DEFAULT_UNLOCKED_TOWERS],
    ownedTalents: [],
    equippedTalents: [],
    settings: { sfx: true, bgm: true, shake: true },
  };
}

/**
 * Convert pre-stage-11 (level-grain) progress to chapter-grain.
 * Rule: a chapter is unlocked iff any of its level ids was; chapter ★ = max
 * of its 4 level ★ (best-of). One-shot during readSave; new schema overwrites
 * the slot on next write.
 */
function migrateLegacy(parsed: Record<string, unknown>, fallback: SaveSnapshot): SaveSnapshot {
  const out: SaveSnapshot = { ...fallback };

  const legacyUnlocked = parsed.unlockedLevels as string[] | undefined;
  const legacyStars = parsed.starsByLevel as Record<string, number> | undefined;

  if (legacyUnlocked && legacyUnlocked.length > 0) {
    const chapters = new Set<ChapterId>(DEFAULT_UNLOCKED_CHAPTERS);
    for (const lvl of legacyUnlocked) {
      // level id format: level_<chapterIndex>_<x>
      const m = /^level_(\d)_/.exec(lvl);
      if (!m) continue;
      const ch = chapterIdFromIndex(Number(m[1]));
      if (ch) chapters.add(ch);
    }
    out.unlockedChapters = [...chapters];
  }

  if (legacyStars) {
    const stars: Record<string, number> = {};
    for (const [lvl, s] of Object.entries(legacyStars)) {
      const m = /^level_(\d)_/.exec(lvl);
      if (!m) continue;
      const ch = chapterIdFromIndex(Number(m[1]));
      if (!ch) continue;
      stars[ch] = Math.max(stars[ch] ?? 0, s);
    }
    out.starsByChapter = stars as Record<ChapterId, number>;
  }

  return out;
}

function chapterIdFromIndex(i: number): ChapterId | null {
  switch (i) {
    case 1: return 'ch1_meadow';
    case 2: return 'ch2_forest';
    case 3: return 'ch3_tundra';
    case 4: return 'ch4_volcano';
    case 5: return 'ch5_void';
    default: return null;
  }
}

export function readSave(): SaveSnapshot {
  const fallback = defaultSnapshot();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Detect new-schema presence; if missing, run a migration pass.
    const hasNewSchema = Array.isArray(parsed.unlockedChapters);
    const base = hasNewSchema ? fallback : migrateLegacy(parsed, fallback);

    return {
      unlockedChapters:
        (parsed.unlockedChapters as ChapterId[] | undefined) ?? base.unlockedChapters,
      starsByChapter:
        (parsed.starsByChapter as Record<ChapterId, number> | undefined) ?? base.starsByChapter,
      stardust:        (parsed.stardust as number | undefined) ?? base.stardust,
      unlockedTowers:  (parsed.unlockedTowers as TowerId[] | undefined) ?? base.unlockedTowers,
      ownedTalents:    (parsed.ownedTalents as TalentId[] | undefined) ?? base.ownedTalents,
      equippedTalents: (parsed.equippedTalents as TalentId[] | undefined) ?? base.equippedTalents,
      settings: { ...fallback.settings, ...((parsed.settings as Settings | undefined) ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export function writeSave(snap: SaveSnapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    // Ignore quota / private mode failures — save is best-effort.
  }
}

// ─── helpers that snapshot the *current* registry state for writeSave ─────

function snapshotFromRegistry(reg: Phaser.Data.DataManager): SaveSnapshot {
  const fallback = defaultSnapshot();
  return {
    unlockedChapters:
      (reg.get(REGISTRY_KEYS.unlockedChapters) as ChapterId[] | undefined) ?? fallback.unlockedChapters,
    starsByChapter:
      (reg.get(REGISTRY_KEYS.starsByChapter) as Record<ChapterId, number> | undefined) ?? fallback.starsByChapter,
    stardust:
      (reg.get(REGISTRY_KEYS.stardust) as number | undefined) ?? fallback.stardust,
    unlockedTowers:
      (reg.get(REGISTRY_KEYS.unlockedTowers) as TowerId[] | undefined) ?? fallback.unlockedTowers,
    ownedTalents:
      (reg.get(REGISTRY_KEYS.ownedTalents) as TalentId[] | undefined) ?? fallback.ownedTalents,
    equippedTalents:
      (reg.get(REGISTRY_KEYS.equippedTalents) as TalentId[] | undefined) ?? fallback.equippedTalents,
    settings:
      (reg.get(REGISTRY_KEYS.settings) as Settings | undefined) ?? fallback.settings,
  };
}

// ─── chapter-level victory + stardust award ───────────────────────────────

// Stardust award per chapter clear, indexed by star count.
// Tuned so that a first-clear at ★1 (60 → now 100) covers the cheapest
// store tower (80), giving the player at least one purchase decision after
// their first run.
const STARDUST_PER_STAR = [0, 20, 40, 70];   // index = star count
const FIRST_CLEAR_BONUS = 80;

/**
 * Persist a chapter victory:
 *  - bumps stars (max-of)
 *  - unlocks next chapter (if any)
 *  - awards stardust = base[★] (+50 first time only)
 * Returns the stardust delta granted, so the caller can show a popup.
 */
export function recordChapterVictory(
  registry: Phaser.Data.DataManager,
  chapterId: ChapterId,
  stars: number,
  nextChapterId: ChapterId | null,
): number {
  const unlocked: ChapterId[] = [
    ...((registry.get(REGISTRY_KEYS.unlockedChapters) as ChapterId[] | undefined) ?? DEFAULT_UNLOCKED_CHAPTERS),
  ];
  const stars_: Record<string, number> = {
    ...((registry.get(REGISTRY_KEYS.starsByChapter) as Record<string, number> | undefined) ?? {}),
  };

  const wasFirstClear = (stars_[chapterId] ?? 0) === 0 && stars > 0;
  const prev = stars_[chapterId] ?? 0;
  stars_[chapterId] = Math.max(prev, stars);

  if (nextChapterId && !unlocked.includes(nextChapterId)) {
    unlocked.push(nextChapterId);
  }

  // stardust delta: pay only for *new* stars (so re-clearing doesn't double-pay)
  const prevAward = STARDUST_PER_STAR[prev] ?? 0;
  const newAward  = STARDUST_PER_STAR[stars] ?? 0;
  const delta = Math.max(0, newAward - prevAward) + (wasFirstClear ? FIRST_CLEAR_BONUS : 0);

  const curStardust = (registry.get(REGISTRY_KEYS.stardust) as number | undefined) ?? 0;
  const nextStardust = curStardust + delta;

  registry.set(REGISTRY_KEYS.unlockedChapters, unlocked);
  registry.set(REGISTRY_KEYS.starsByChapter, stars_);
  registry.set(REGISTRY_KEYS.stardust, nextStardust);
  writeSave(snapshotFromRegistry(registry));

  return delta;
}

export function isChapterUnlocked(
  registry: Phaser.Data.DataManager,
  chapterId: ChapterId,
): boolean {
  const unlocked = (registry.get(REGISTRY_KEYS.unlockedChapters) as ChapterId[] | undefined) ?? [];
  return unlocked.includes(chapterId);
}

// ─── meta-store: tower / talent purchases ─────────────────────────────────

export function isTowerUnlocked(
  registry: Phaser.Data.DataManager,
  id: TowerId,
): boolean {
  const list = (registry.get(REGISTRY_KEYS.unlockedTowers) as TowerId[] | undefined) ?? DEFAULT_UNLOCKED_TOWERS;
  return list.includes(id);
}

export function ownsTalent(
  registry: Phaser.Data.DataManager,
  id: TalentId,
): boolean {
  const list = (registry.get(REGISTRY_KEYS.ownedTalents) as TalentId[] | undefined) ?? [];
  return list.includes(id);
}

/** Generic spend; returns true if balance was sufficient and was deducted. */
export function spendStardust(
  registry: Phaser.Data.DataManager,
  cost: number,
): boolean {
  const cur = (registry.get(REGISTRY_KEYS.stardust) as number | undefined) ?? 0;
  if (cur < cost) return false;
  registry.set(REGISTRY_KEYS.stardust, cur - cost);
  writeSave(snapshotFromRegistry(registry));
  return true;
}

export function unlockTower(
  registry: Phaser.Data.DataManager,
  id: TowerId,
): boolean {
  if (isTowerUnlocked(registry, id)) return false;
  const list = [...((registry.get(REGISTRY_KEYS.unlockedTowers) as TowerId[] | undefined) ?? DEFAULT_UNLOCKED_TOWERS)];
  list.push(id);
  registry.set(REGISTRY_KEYS.unlockedTowers, list);
  writeSave(snapshotFromRegistry(registry));
  return true;
}

export function buyTalent(
  registry: Phaser.Data.DataManager,
  id: TalentId,
): boolean {
  if (ownsTalent(registry, id)) return false;
  const list = [...((registry.get(REGISTRY_KEYS.ownedTalents) as TalentId[] | undefined) ?? [])];
  list.push(id);
  registry.set(REGISTRY_KEYS.ownedTalents, list);
  writeSave(snapshotFromRegistry(registry));
  return true;
}

/** Replace the equip list (caller validates length ≤ MAX_EQUIPPED_TALENTS). */
export function setEquippedTalents(
  registry: Phaser.Data.DataManager,
  ids: TalentId[],
): TalentId[] {
  const trimmed = ids.slice(0, MAX_EQUIPPED_TALENTS);
  registry.set(REGISTRY_KEYS.equippedTalents, trimmed);
  writeSave(snapshotFromRegistry(registry));
  return trimmed;
}

// ─── settings ─────────────────────────────────────────────────────────────

export function getSettings(registry: Phaser.Data.DataManager): Settings {
  const fallback: Settings = { sfx: true, bgm: true, shake: true };
  const cur = registry.get(REGISTRY_KEYS.settings) as Settings | undefined;
  return { ...fallback, ...(cur ?? {}) };
}

export function setSetting<K extends SettingKey>(
  registry: Phaser.Data.DataManager,
  key: K,
  value: Settings[K],
) {
  const next: Settings = { ...getSettings(registry), [key]: value };
  registry.set(REGISTRY_KEYS.settings, next);
  writeSave(snapshotFromRegistry(registry));
}

