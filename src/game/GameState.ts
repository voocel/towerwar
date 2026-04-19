import type { TowerId, RelicId } from '@/types';
import type { Tower } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import type { Projectile } from '@/entities/Projectile';
import type { GroundZone, Floater, Particle } from '@/entities/Effects';
import { ECONOMY } from '@/config/economy';
import { ACTS } from '@/config/maps';

export interface NodeOption {
  type: 'relic' | 'upgrade' | 'gold';
  relicId?: RelicId;
  goldAmount?: number;
  label: string;
  description: string;
  icon: string;
}

export interface PendingNode {
  options: NodeOption[];
}

export class GameState {
  time: number = 0;
  paused: boolean = false;
  gameOver: boolean = false;
  victory: boolean = false;

  gold: number = ECONOMY.startingGold;
  lives: number = ECONOMY.startingLives;

  towers: Tower[] = [];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  groundZones: GroundZone[] = [];
  floaters: Floater[] = [];
  particles: Particle[] = [];

  // Act / map state
  currentActIndex: number = 0;
  currentMapId: string = ACTS[0].mapId;
  pendingActTransition: boolean = false;

  currentWaveIndex: number = 0;  // index within the current act's waves
  waveActive: boolean = false;
  waveSpawnQueue: Array<{ typeId: import('@/types').EnemyTypeId; spawnAt: number }> = [];
  waveEnemiesRemaining: number = 0;

  mouseX: number = 0;
  mouseY: number = 0;
  mouseInPlayArea: boolean = false;
  selectedTowerToPlace: TowerId | null = null;
  selectedTower: Tower | null = null;

  // Roguelike
  ownedRelics: Set<RelicId> = new Set();
  upgradeVouchers: number = 0;
  pendingNode: PendingNode | null = null;
  afterglowUntil: number = 0;
  nodesCompleted: number = 0;

  // Visuals
  shakeIntensity: number = 0;

  stats = {
    enemiesKilled: 0,
    reactionsTriggered: 0,
    goldEarned: 0,
  };
}

export const state = new GameState();
