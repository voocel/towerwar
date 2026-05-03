import * as Phaser from 'phaser';
import type { GameContext } from '@/game/GameContext';
import { Enemy } from '@/entities/Enemy';
import { generateNode } from './RelicSystem';

export const WAVE_AUTO_START_DELAY = 10;

export function canStartWave(ctx: GameContext): boolean {
  return !ctx.waveActive
    && ctx.currentWaveIndex < ctx.level.waves.length
    && !ctx.pendingNode
    && !ctx.gameOver
    && !ctx.victory;
}

export function startNextWave(ctx: GameContext) {
  if (!canStartWave(ctx)) return;
  const wave = ctx.level.waves[ctx.currentWaveIndex];
  ctx.waveActive = true;
  ctx.nextWaveAutoStartAt = null;
  ctx.nextWaveAutoStartIndex = null;
  ctx.waveSpawnQueue = [];
  // Talent 'delay' adds a one-shot grace window before the very first wave.
  const extraDelay = ctx.currentWaveIndex === 0 ? ctx.firstWaveExtraDelay : 0;
  let total = 0;
  for (const g of wave.spawns) {
    for (let i = 0; i < g.count; i++) {
      ctx.waveSpawnQueue.push({
        typeId: g.type,
        spawnAt: ctx.time + extraDelay + (g.startOffset ?? 0) + i * g.delay,
      });
      total++;
    }
  }
  ctx.waveEnemiesRemaining = total;
}

export function updateWaveAutoStart(ctx: GameContext): boolean {
  if (!canStartWave(ctx)) {
    ctx.nextWaveAutoStartAt = null;
    ctx.nextWaveAutoStartIndex = null;
    return false;
  }

  if (
    ctx.nextWaveAutoStartIndex !== ctx.currentWaveIndex
    || ctx.nextWaveAutoStartAt == null
  ) {
    ctx.nextWaveAutoStartIndex = ctx.currentWaveIndex;
    ctx.nextWaveAutoStartAt = ctx.time + WAVE_AUTO_START_DELAY;
  }

  if (ctx.time < ctx.nextWaveAutoStartAt) return false;
  startNextWave(ctx);
  return true;
}

export function waveAutoStartRemaining(ctx: GameContext): number | null {
  if (!canStartWave(ctx) || ctx.nextWaveAutoStartAt == null) return null;
  return Math.max(0, ctx.nextWaveAutoStartAt - ctx.time);
}

export function updateWave(scene: Phaser.Scene, ctx: GameContext) {
  if (!ctx.waveActive) return;

  const start = ctx.waypoints[0];
  const stillPending: typeof ctx.waveSpawnQueue = [];
  for (const s of ctx.waveSpawnQueue) {
    if (s.spawnAt <= ctx.time) {
      const e = new Enemy(scene, s.typeId, start.x, start.y);
      ctx.enemies.push(e);
    } else {
      stillPending.push(s);
    }
  }
  ctx.waveSpawnQueue = stillPending;

  if (ctx.waveSpawnQueue.length === 0 && ctx.waveEnemiesRemaining === 0) {
    completeWave(ctx);
  }
}

function completeWave(ctx: GameContext) {
  const completedIndex = ctx.currentWaveIndex;
  const wave = ctx.level.waves[completedIndex];
  if (wave) {
    ctx.gold += wave.rewardGold;
    ctx.stats.goldEarned += wave.rewardGold;
  }
  ctx.waveActive = false;
  ctx.currentWaveIndex++;
  const isFinalWave = ctx.currentWaveIndex >= ctx.level.waves.length;
  if (isFinalWave) {
    ctx.victory = true;
    return;
  }
  // Relic node fires only after waves listed in level.relicNodeAfterWaves
  // (1-based). Stage-11 chapter format pops at wave 4 + 8, giving two
  // build-decisions per chapter without flooding the player.
  const completedWaveNumber = completedIndex + 1;  // 1-based
  if (
    ctx.level.relicNodeAfterWaves.includes(completedWaveNumber)
    && !ctx.nodesFiredAfterWave.has(completedIndex)
  ) {
    ctx.nodesFiredAfterWave.add(completedIndex);
    ctx.pendingNode = generateNode(ctx);
  }
}

export function onEnemyKilled(ctx: GameContext, enemy: Enemy) {
  ctx.stats.enemiesKilled++;
  const reward = Math.round(enemy.def.reward * ctx.goldKillMultiplier);
  ctx.gold += reward;
  ctx.stats.goldEarned += reward;
  ctx.waveEnemiesRemaining = Math.max(0, ctx.waveEnemiesRemaining - 1);

  // Stardust drop (meta currency). Most enemies don't drop; elites/bosses
  // always do; defenders drop with low probability for a "bonus" feel.
  // The reward is NOT added to runStardust here — instead we queue a spawn
  // spec for GameScene, which creates a clickable pickup the player must
  // grab before it falls (otherwise it's lost).
  const sReward = enemy.def.stardustReward;
  if (sReward && sReward > 0) {
    const chance = enemy.def.stardustChance ?? 1;
    if (chance >= 1 || Math.random() < chance) {
      ctx.pendingStardustDrops.push({ x: enemy.x, y: enemy.y, amount: sReward });
    }
  }
}

export function onEnemyReachedEnd(ctx: GameContext, _enemy: Enemy) {
  ctx.lives -= 1;
  ctx.waveEnemiesRemaining = Math.max(0, ctx.waveEnemiesRemaining - 1);
  if (ctx.lives <= 0) {
    ctx.gameOver = true;
  }
}
