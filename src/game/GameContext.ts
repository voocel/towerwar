import type { Enemy } from '@/entities/Enemy';
import type { Tower } from '@/entities/Tower';
import type { Projectile } from '@/entities/Projectile';
import type { Vec2, GameSpeed, EnemyTypeId, TowerId, SkillId, RelicId, PendingNode } from '@/types';
import type { LevelDef } from '@/data/levels';
import { waypointsToPixels, computePathSet } from '@/systems/PathSystem';
import { SELL_RATIO } from '@/config/towers';

export interface PendingSpawn {
  typeId: EnemyTypeId;
  spawnAt: number;
}

export interface GroundZone {
  x: number;
  y: number;
  radiusPx: number;
  remainingTime: number;
  damagePerSec: number;
  slow: number;
  color: string;
  /** Phaser graphics that draws this zone — owned by GameScene. */
  gfx?: Phaser.GameObjects.Graphics;
}

/** Clickable stardust drop tossed into the air on enemy kill.
 *  Must be collected (clicked) before gravity brings it back down — when
 *  it touches floorY it despawns silently and the reward is lost. */
export interface StardustPickup {
  amount: number;
  // World position (px, DPR-scaled)
  x: number;
  y: number;
  // Velocity (px/sec)
  vx: number;
  vy: number;
  /** Y at which the pickup expires (set just below the spawn position). */
  floorY: number;
  /** Phaser container that renders this pickup — owned by GameScene. */
  gfx?: Phaser.GameObjects.Container;
  /** Lifecycle gate: prevents double-collect from a click + physics race. */
  done: boolean;
}

/**
 * Mutable scene-scoped state. Replaces the old global singleton.
 * One instance per GameScene; lives only as long as the scene is active.
 */
export class GameContext {
  level: LevelDef;
  waypoints: Vec2[];
  pathSet: Set<number>;

  enemies: Enemy[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  groundZones: GroundZone[] = [];

  gold: number;
  lives: number;
  time: number = 0;

  speedMultiplier: GameSpeed = 1;
  paused: boolean = false;
  gameOver: boolean = false;
  victory: boolean = false;

  currentWaveIndex: number = 0;
  waveActive: boolean = false;
  waveSpawnQueue: PendingSpawn[] = [];
  waveEnemiesRemaining: number = 0;
  /** Countdown deadline for auto-starting the next available wave. */
  nextWaveAutoStartAt: number | null = null;
  /** Wave index the current auto-start deadline belongs to. */
  nextWaveAutoStartIndex: number | null = null;

  selectedTowerToPlace: TowerId | null = null;
  selectedTower: Tower | null = null;

  /** Skill currently armed for cast (player picked the button, awaiting target click). */
  pendingSkillId: SkillId | null = null;
  /** Per-skill remaining cooldown in seconds. */
  skillCooldowns: Map<SkillId, number> = new Map();

  /** Relics the player has picked up this run (clears each run via fresh GameContext). */
  ownedRelics: Set<RelicId> = new Set();
  /** Three-card pick currently waiting for player input (null when no pending node). */
  pendingNode: PendingNode | null = null;
  /** ctx.time of the most recent reaction — drives the afterglow window. */
  lastReactionAt: number = -999;
  /** Whether a node has already fired for the wave at this index (prevents double-pop). */
  nodesFiredAfterWave: Set<number> = new Set();

  stats = {
    enemiesKilled: 0,
    goldEarned: 0,
    reactionsTriggered: 0,
    skillsUsed: 0,
  };

  /** Stardust accumulated *during* this run from enemy kills.
   *  Persisted at result time (full amount on victory, ½ on defeat). */
  runStardust: number = 0;

  /** Spawn requests produced this tick — GameScene drains them every frame
   *  to instantiate clickable {@link StardustPickup}s. */
  pendingStardustDrops: { x: number; y: number; amount: number }[] = [];

  /** Live pickups currently in flight. Updated each tick (gravity + floor
   *  expiry) and cleared on click / despawn. */
  stardustPickups: StardustPickup[] = [];

  // ─── Talent-driven modifiers (set by TalentSystem.applyEquipped) ─────
  /** Multiplier on enemy kill gold (1 = no change). */
  goldKillMultiplier: number = 1;
  /** Sell return ratio of investment; defaults to config SELL_RATIO. */
  sellRatio: number = SELL_RATIO;
  /** Extra delay (seconds) before the very first wave can spawn enemies. */
  firstWaveExtraDelay: number = 0;
  /** Number of options shown in a relic node (default 3). */
  relicChoiceCount: number = 3;

  constructor(level: LevelDef) {
    this.level = level;
    this.gold = level.startGold;
    this.lives = level.startLives;
    this.waypoints = waypointsToPixels(level.waypoints);
    this.pathSet = computePathSet(level.waypoints);
  }
}
