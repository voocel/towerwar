import { state } from '@/game/GameState';
import { getActWaves, actDifficultyScale, actRewardScale } from '@/config/waves';
import { Enemy } from '@/entities/Enemy';
import { ECONOMY } from '@/config/economy';
import { generateNode } from './NodeSystem';
import { CELL_SIZE, distSq } from '@/utils/Grid';
import { ACTS } from '@/config/maps';
import { isPathCell } from '@/config/map';
import { recomputeFormations } from './FormationSystem';
import { resetBackgroundCache } from '@/render/Background';

function currentActWaves() {
  return getActWaves(state.currentActIndex);
}

export function canStartWave(): boolean {
  return !state.waveActive
    && state.currentWaveIndex < currentActWaves().length
    && !state.gameOver
    && !state.pendingNode
    && !state.pendingActTransition
    && !state.victory;
}

export function startNextWave() {
  if (!canStartWave()) return;
  const waves = currentActWaves();
  const wave = waves[state.currentWaveIndex];
  state.waveActive = true;
  state.waveSpawnQueue = [];
  let total = 0;
  for (const g of wave.spawns) {
    for (let i = 0; i < g.count; i++) {
      state.waveSpawnQueue.push({
        typeId: g.type,
        spawnAt: state.time + (g.startOffset ?? 0) + i * g.delay,
      });
      total++;
    }
  }
  state.waveEnemiesRemaining = total;
}

export function updateWave(_dt: number) {
  if (!state.waveActive) return;

  const due = state.waveSpawnQueue.filter(s => s.spawnAt <= state.time);
  for (const s of due) {
    const e = new Enemy(s.typeId);
    const hpMult = actDifficultyScale(state.currentActIndex);
    if (hpMult !== 1) {
      e.hp *= hpMult;
      e.maxHp *= hpMult;
    }
    if (state.ownedRelics.has('multimark')) e.maxMarks = 3;
    state.enemies.push(e);
  }
  if (due.length) {
    state.waveSpawnQueue = state.waveSpawnQueue.filter(s => s.spawnAt > state.time);
  }

  if (state.waveSpawnQueue.length === 0 && state.waveEnemiesRemaining === 0) {
    completeWave();
  }
}

function completeWave() {
  const waves = currentActWaves();
  const wave = waves[state.currentWaveIndex];
  state.gold += wave.rewardGold;
  state.stats.goldEarned += wave.rewardGold;
  state.waveActive = false;
  state.currentWaveIndex++;

  // Node offered by this wave fires even if it was the act's last wave;
  // players can collect the reward, then step into the act transition.
  if (wave.offerNode) {
    const isLate = state.nodesCompleted >= 2;
    state.pendingNode = generateNode(isLate);
  }

  if (state.currentWaveIndex >= waves.length) {
    const isLastAct = state.currentActIndex >= ACTS.length - 1;
    if (isLastAct) {
      state.victory = true;
    } else {
      state.pendingActTransition = true;
    }
  }
}

export function advanceAct() {
  if (!state.pendingActTransition) return;
  // Node must be resolved first if one is pending (safeguards against future wave
  // configs where the act's last wave also offers a node).
  if (state.pendingNode) return;
  const nextIndex = state.currentActIndex + 1;
  if (nextIndex >= ACTS.length) {
    // Safety net: shouldn't happen given completeWave guards, but don't strand the game.
    state.pendingActTransition = false;
    state.victory = true;
    return;
  }

  // Full sweep of in-play entities so nothing bleeds into the new map's path
  state.enemies = [];
  state.projectiles = [];
  state.groundZones = [];
  state.floaters = [];
  state.particles = [];
  state.waveSpawnQueue = [];
  state.waveEnemiesRemaining = 0;
  state.waveActive = false;

  // Reset per-frame visual / buff residue so it doesn't leak into the new act
  state.shakeIntensity = 0;
  state.afterglowUntil = 0;
  state.selectedTowerToPlace = null;

  state.currentActIndex = nextIndex;
  state.currentMapId = ACTS[nextIndex].mapId;
  state.currentWaveIndex = 0;

  // Refund towers that now sit on the new map's path, at their full investment.
  // Full refund (not sellValue) because displacement is not the player's fault.
  const displaced = state.towers.filter(t => isPathCell(t.grid.gx, t.grid.gy));
  if (displaced.length > 0) {
    for (const t of displaced) {
      state.gold += t.totalInvestment;
      state.stats.goldEarned += t.totalInvestment;
      state.floaters.push({
        pos: { x: t.pos.x, y: t.pos.y - 6 },
        text: `🏗️ +${t.totalInvestment}`,
        color: '#ffd93d',
        remainingTime: 1.6,
        vy: -20,
      });
    }
    const displacedSet = new Set(displaced);
    state.towers = state.towers.filter(t => !displacedSet.has(t));
    state.selectedTower = null;
    recomputeFormations();
  }

  // Drop baked meadow/forest tile image so next frame redraws with new waypoints.
  resetBackgroundCache();

  state.pendingActTransition = false;
}

export function onEnemyKilled(enemy: Enemy) {
  state.stats.enemiesKilled++;
  const hadFireMark = enemy.marks.some(m => m.element === 'fire');
  const hadAnyMark = enemy.marks.length > 0;

  const rewardMult = actRewardScale(state.currentActIndex);
  const bounty = Math.round(enemy.def.reward * rewardMult);
  const markedBonus = hadAnyMark ? (ECONOMY.killRewardMarked - ECONOMY.killReward) : 0;
  const total = bounty + markedBonus;
  state.gold += total;
  state.stats.goldEarned += total;

  // Relic: ember (fire-mark death → small explosion)
  if (hadFireMark && state.ownedRelics.has('ember')) {
    const r2 = CELL_SIZE * CELL_SIZE;
    for (const e of state.enemies) {
      if (e.dead || e.id === enemy.id) continue;
      if (distSq(e.pos, enemy.pos) > r2) continue;
      e.takeDamage(15, state.time, { isMagic: true });
    }
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 100 + Math.random() * 80;
      state.particles.push({
        pos: { ...enemy.pos },
        vel: { x: Math.cos(a) * sp, y: Math.sin(a) * sp },
        color: '#ff9933',
        remainingTime: 0.4, life: 0.4,
        radius: 3,
      });
    }
  }

  // Relic: eternalfire (fire-mark death → burning ground)
  if (hadFireMark && state.ownedRelics.has('eternalfire')) {
    state.groundZones.push({
      pos: { ...enemy.pos },
      radiusPx: CELL_SIZE * 1.0,
      remainingTime: 3,
      damagePerSec: 8,
      slow: 0,
      color: '#ff5511',
    });
  }

  state.waveEnemiesRemaining = Math.max(0, state.waveEnemiesRemaining - 1);
}

export function onEnemyReachedEnd(_enemy: import('@/entities/Enemy').Enemy) {
  state.lives -= 1;
  state.waveEnemiesRemaining = Math.max(0, state.waveEnemiesRemaining - 1);
  if (state.lives <= 0) {
    state.gameOver = true;
  }
}
