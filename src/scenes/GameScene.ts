import * as Phaser from 'phaser';
import {
  SCENES, GAME_HEIGHT, PLAY_WIDTH, PLAY_HEIGHT,
  CELL_SIZE, GRID_COLS, GRID_ROWS, HUD_WIDTH, REGISTRY_KEYS, px,
} from '@/constants';
import { PALETTE } from '@/theme';
import { hexColor, pixelToGrid, gridToPixel } from '@/utils/Grid';
import { isPathCell } from '@/systems/PathSystem';
import { GameContext } from '@/game/GameContext';
import { getLevel } from '@/data/levels';
import { CHAPTERS, type ChapterId } from '@/data/chapters';
import { Tower } from '@/entities/Tower';
import { TOWERS } from '@/config/towers';
import type { TowerId } from '@/types';
import {
  canStartWave, startNextWave, updateWave, updateWaveAutoStart,
  waveAutoStartRemaining, onEnemyKilled, onEnemyReachedEnd,
} from '@/systems/WaveSystem';
import { updateTowers, updateProjectiles } from '@/systems/TargetingSystem';
import { updateGroundZones } from '@/systems/ReactionSystem';
import { recomputeFormations } from '@/systems/FormationSystem';
import { castMeteor, castFrostNova, castLightning, isSkillReady, skillCooldownRatio, updateSkills } from '@/systems/SkillSystem';
import { resolveNode as applyNode } from '@/systems/RelicSystem';
import { applyEquippedTalents } from '@/systems/TalentSystem';
import type { TalentId } from '@/types';
import { RELICS } from '@/config/relics';
import { SKILLS } from '@/config/skills';
import { audio } from '@/managers/AudioManager';
import type { GameSpeed, SkillId, NodeOption } from '@/types';

interface SelPanelRefs {
  title: Phaser.GameObjects.Text;
  stats: Phaser.GameObjects.Text;
  upBg: Phaser.GameObjects.Rectangle;
  upLabel: Phaser.GameObjects.Text;
  sellLabel: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private ctx!: GameContext;

  // Visual layers
  private pathGfx!: Phaser.GameObjects.Graphics;
  private placementGfx!: Phaser.GameObjects.Graphics;
  private rangeGfx!: Phaser.GameObjects.Graphics;
  private skillTargetGfx!: Phaser.GameObjects.Graphics;

  // HUD references that update each frame
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private waveStatusText!: Phaser.GameObjects.Text;
  private reactionsText!: Phaser.GameObjects.Text;
  private startWaveBtn!: Phaser.GameObjects.Rectangle;
  private startWaveLabel!: Phaser.GameObjects.Text;
  private pauseBtn!: Phaser.GameObjects.Rectangle;
  private speedBtns: { rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; speed: GameSpeed }[] = [];
  private skillBtnGroups: Map<SkillId, {
    bg: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.GameObject;
    cdOverlay: Phaser.GameObjects.Graphics;
    cdLabel: Phaser.GameObjects.Text;
    skillId: SkillId;
  }> = new Map();
  private overlay?: Phaser.GameObjects.Container;
  private resultScheduled: boolean = false;

  // Selected-tower detail panel (rebuilt on selection change)
  private selectionPanel?: Phaser.GameObjects.Container;
  private selectionPanelRefs?: SelPanelRefs;
  private selectionPanelForId: number | null = null;

  constructor() {
    super(SCENES.Game);
  }

  create() {
    const chapterId = (this.registry.get(REGISTRY_KEYS.currentChapterId) as ChapterId | undefined) ?? 'ch1_meadow';
    const level = getLevel(chapterId);
    this.ctx = new GameContext(level);
    // Apply equipped meta-talents before any wave spawns so modifiers like
    // pioneer (+50 gold) and delay (+5s first wave) take effect on turn 0.
    const equipped = (this.registry.get(REGISTRY_KEYS.equippedTalents) as TalentId[] | undefined) ?? [];
    applyEquippedTalents(this.ctx, equipped);
    this.resultScheduled = false;
    this.overlay = undefined;

    this.drawBackground();
    this.pathGfx = this.add.graphics();
    this.placementGfx = this.add.graphics();
    this.rangeGfx = this.add.graphics();
    this.skillTargetGfx = this.add.graphics().setDepth(50);
    this.speedBtns = [];
    this.skillBtnGroups = new Map();
    this.drawPath();

    this.drawHUD();
    this.attachInput();

    // Allow pause via Space when no wave / pending state
    this.input.keyboard?.on('keydown-SPACE', () => this.onSpace());
    this.input.keyboard?.on('keydown-ESC', () => this.onEscape());

    audio.playBgm(`bgm_${level.chapterId}`);
  }

  update(_time: number, deltaMs: number) {
    if (!this.ctx) return;

    // Check end-state every frame so that scheduleResult fires even when
    // victory/gameOver was set externally (e.g. test harness) without ever
    // entering the tick path.
    if (this.ctx.gameOver) { this.showOverlay(false); this.scheduleResult(false); return; }
    if (this.ctx.victory)  { this.showOverlay(true);  this.scheduleResult(true);  return; }

    // A pending relic node — open the modal and freeze the world until picked.
    if (this.ctx.pendingNode) {
      this.scene.pause();
      this.scene.launch(SCENES.Relic, { options: this.ctx.pendingNode.options });
      this.ctx.pendingNode = null;
      return;
    }

    if (this.ctx.paused) return;

    const dt = Math.min(0.05, deltaMs / 1000);
    for (let i = 0; i < this.ctx.speedMultiplier; i++) this.tick(dt);
    this.refreshHUD();
    this.drawPlacementPreview();
    this.drawSelectedRange();
    this.drawSkillTargeting();
    this.refreshSelectionPanel();
  }

  // ───────────── core tick ─────────────

  private tick(dt: number) {
    const ctx = this.ctx;
    ctx.time += dt;

    updateWave(this, ctx);

    for (const e of ctx.enemies) e.followPath(ctx.waypoints, dt, ctx.time);

    updateTowers(this, ctx, dt);
    updateProjectiles(this, ctx, dt);
    updateGroundZones(ctx, dt);
    updateSkills(ctx, dt);
    updateWaveAutoStart(ctx);

    // Resolve dead / escaped
    for (const e of ctx.enemies) {
      if (e.dead) onEnemyKilled(ctx, e);
      else if (e.reachedEnd) onEnemyReachedEnd(ctx, e);
    }
    const removed = ctx.enemies.filter(e => e.dead || e.reachedEnd);
    for (const e of removed) e.destroy();
    ctx.enemies = ctx.enemies.filter(e => !e.dead && !e.reachedEnd);

    // (overlay + result transition handled in update() so externally-set
    //  victory/gameOver also routes through it cleanly)
  }

  private scheduleResult(victory: boolean) {
    if (this.resultScheduled) return;
    this.resultScheduled = true;
    this.time.delayedCall(900, () => {
      this.scene.start(SCENES.Result, {
        chapterId: this.ctx.level.chapterId,
        victory,
        livesLeft: this.ctx.lives,
        enemiesKilled: this.ctx.stats.enemiesKilled,
        reactionsTriggered: this.ctx.stats.reactionsTriggered,
        goldEarned: this.ctx.stats.goldEarned,
        skillsUsed: this.ctx.stats.skillsUsed,
        relicsAcquired: [...this.ctx.ownedRelics],
      });
    });
  }

  // ───────────── drawing ─────────────

  private drawBackground() {
    const ch = CHAPTERS[this.ctx.level.chapterId];
    // Play area — chapter sprite if loaded, else fallback to themed solid color.
    const bgKey = `map_${this.ctx.level.chapterId}_bg`;
    if (this.textures.exists(bgKey)) {
      this.add.image(0, 0, bgKey).setOrigin(0).setDisplaySize(PLAY_WIDTH, PLAY_HEIGHT);
    } else {
      this.add.rectangle(0, 0, PLAY_WIDTH, PLAY_HEIGHT, hexColor(ch.fieldBase)).setOrigin(0);
    }
    // Faint grid (always drawn so tile boundaries stay visible)
    const g = this.add.graphics({ lineStyle: { width: 1, color: 0xffffff, alpha: 0.04 } });
    for (let x = 0; x <= PLAY_WIDTH; x += CELL_SIZE) g.lineBetween(x, 0, x, PLAY_HEIGHT);
    for (let y = 0; y <= PLAY_HEIGHT; y += CELL_SIZE) g.lineBetween(0, y, PLAY_WIDTH, y);
    // Sidebar
    this.add.rectangle(PLAY_WIDTH, 0, HUD_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg1)).setOrigin(0);
    this.add.line(0, 0, PLAY_WIDTH, 0, PLAY_WIDTH, GAME_HEIGHT, hexColor(PALETTE.divider)).setOrigin(0);
  }

  private drawPath() {
    this.pathGfx.clear();
    const wps = this.ctx.waypoints;
    // Road body is baked into assets/maps/*_bg_roads.png. Runtime only draws
    // spawn / exit markers so the route no longer feels like a UI overlay.
    const spawn = wps[0];
    const exit = wps[wps.length - 1];
    this.add.circle(spawn.x, spawn.y, px(10), hexColor(PALETTE.spawnMark), 0.7).setStrokeStyle(2, 0xffffff, 0.6);
    this.add.circle(exit.x, exit.y, px(10), hexColor(PALETTE.exitMark), 0.7).setStrokeStyle(2, 0xffffff, 0.6);
  }

  private drawPlacementPreview() {
    this.placementGfx.clear();
    const ctx = this.ctx;
    if (!ctx.selectedTowerToPlace) return;
    const ptr = this.input.activePointer;
    if (ptr.x >= PLAY_WIDTH) return;
    const gp = pixelToGrid(ptr.x, ptr.y);
    if (gp.gx < 0 || gp.gx >= GRID_COLS || gp.gy < 0 || gp.gy >= GRID_ROWS) return;

    const def = TOWERS[ctx.selectedTowerToPlace];
    const occupied = ctx.towers.some(t => t.grid.gx === gp.gx && t.grid.gy === gp.gy);
    const onPath = isPathCell(ctx.pathSet, gp.gx, gp.gy);
    const valid = !occupied && !onPath && ctx.gold >= def.cost;

    const color = valid ? hexColor(def.color) : hexColor(PALETTE.danger);
    this.placementGfx.fillStyle(color, 0.18);
    this.placementGfx.fillRect(gp.gx * CELL_SIZE, gp.gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    this.placementGfx.lineStyle(1.5, color, 0.9);
    this.placementGfx.strokeRect(gp.gx * CELL_SIZE + px(1), gp.gy * CELL_SIZE + px(1), CELL_SIZE - px(2), CELL_SIZE - px(2));

    const center = gridToPixel(gp.gx, gp.gy);
    this.placementGfx.lineStyle(1.5, color, 0.5);
    this.placementGfx.strokeCircle(center.x, center.y, def.range * CELL_SIZE);
  }

  private drawSelectedRange() {
    this.rangeGfx.clear();
    const t = this.ctx.selectedTower;
    if (!t) return;
    this.rangeGfx.lineStyle(2, hexColor(t.def.color), 0.7);
    this.rangeGfx.strokeCircle(t.x, t.y, t.rangePx);
    this.rangeGfx.fillStyle(hexColor(t.def.color), 0.06);
    this.rangeGfx.fillCircle(t.x, t.y, t.rangePx);
  }

  // ───────────── HUD ─────────────

  private drawHUD() {
    const sx = PLAY_WIDTH + px(20);
    const ctx = this.ctx;

    // Title
    this.add.text(sx, px(16), 'TOWERWAR', {
      fontFamily: 'sans-serif', fontSize: '18px',
      color: PALETTE.textBright, fontStyle: 'bold',
    }).setShadow(0, 0, PALETTE.accentRose, 8, true, true);
    this.add.text(sx, px(38), ctx.level.name, {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textDim,
    });

    // Resources
    this.goldText = this.add.text(sx, px(64), '', {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.accent,
    });
    this.livesText = this.add.text(sx + px(130), px(64), '', {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.danger,
    });

    // Wave status
    this.waveText = this.add.text(sx, px(92), '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textDim,
    });
    this.waveStatusText = this.add.text(sx, px(108), '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.text,
    });
    this.reactionsText = this.add.text(sx, px(126), '', {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.accentRose,
    });

    // Tower picker — 2 columns × N rows (compact for 8 towers)
    const labelY = px(150);
    this.add.text(sx, labelY, '建塔', {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textDim,
    });
    const ids = ctx.level.allowedTowers;
    const colW = (HUD_WIDTH - px(40) - px(8)) / 2;
    const rowH = px(44);
    const towerRows = Math.ceil(ids.length / 2);
    for (let i = 0; i < ids.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = sx + col * (colW + px(8));
      const by = labelY + px(18) + row * (rowH + px(6));
      this.makeTowerButton(ids[i], bx, by, colW, rowH);
    }
    const towerEndY = labelY + px(18) + towerRows * (rowH + px(6));

    // Skill row (only if level grants any). Stack vertically.
    let nextY = towerEndY + px(8);
    if (ctx.level.allowedSkills.length > 0) {
      this.add.text(sx, nextY, '技能', {
        fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textDim,
      });
      let skillY = nextY + px(18);
      for (const sid of ctx.level.allowedSkills) {
        this.makeSkillButton(sid, sx, skillY);
        skillY += px(56 + 6);
      }
      nextY = skillY + px(2);
    }

    // Speed + pause control bar
    this.drawControlBar(sx, nextY);

    // Start-wave button
    const btnW = HUD_WIDTH - px(40);
    const btnH = px(44);
    this.startWaveBtn = this.add.rectangle(
      sx + btnW / 2, GAME_HEIGHT - px(56), btnW, btnH, hexColor(PALETTE.btnStart),
    );
    this.startWaveBtn.setStrokeStyle(1, hexColor(PALETTE.divider));
    this.startWaveBtn.setInteractive({ useHandCursor: true });
    this.startWaveLabel = this.add.text(sx + btnW / 2, GAME_HEIGHT - px(56), '', {
      fontFamily: 'sans-serif', fontSize: '14px',
      color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.startWaveBtn.on('pointerdown', () => {
      if (canStartWave(this.ctx)) startNextWave(this.ctx);
    });
    this.startWaveBtn.on('pointerover', () => {
      if (canStartWave(this.ctx)) this.startWaveBtn.setFillStyle(hexColor(PALETTE.btnStartHot));
    });
    this.startWaveBtn.on('pointerout', () => {
      this.startWaveBtn.setFillStyle(canStartWave(this.ctx) ? hexColor(PALETTE.btnStart) : hexColor(PALETTE.btnDisabled));
    });

    // Hint text
    this.add.text(sx, GAME_HEIGHT - px(14), 'SPACE 开波 · P 暂停 · ESC 取消', {
      fontFamily: 'sans-serif', fontSize: '9px', color: PALETTE.textFaint,
    });
  }

  // ─── control bar: pause + speed ─────────────────────────────────

  private drawControlBar(sx: number, y: number) {
    // Pause button — 48 wide
    const pauseW = px(48), h = px(32);
    this.pauseBtn = this.add.rectangle(sx, y, pauseW, h, hexColor(PALETTE.bg2)).setOrigin(0, 0);
    this.pauseBtn.setStrokeStyle(1, hexColor(PALETTE.divider));
    this.pauseBtn.setInteractive({ useHandCursor: true });
    this.add.text(sx + pauseW / 2, y + h / 2, '⏸', {
      fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.textBright,
    }).setOrigin(0.5);
    this.pauseBtn.on('pointerover', () => this.pauseBtn.setFillStyle(hexColor(PALETTE.bg3)));
    this.pauseBtn.on('pointerout',  () => this.pauseBtn.setFillStyle(hexColor(PALETTE.bg2)));
    this.pauseBtn.on('pointerdown', () => this.openPauseMenu());

    // Speed buttons 1× / 2× / 3×
    const gap = px(4);
    const speedW = (HUD_WIDTH - px(40) - pauseW - gap - gap * 2) / 3;
    const speeds: GameSpeed[] = [1, 2, 3];
    for (let i = 0; i < speeds.length; i++) {
      const bx = sx + pauseW + gap + i * (speedW + gap);
      const speed = speeds[i];
      const rect = this.add.rectangle(bx, y, speedW, h, hexColor(PALETTE.bg2)).setOrigin(0, 0);
      rect.setStrokeStyle(1, hexColor(PALETTE.divider));
      rect.setInteractive({ useHandCursor: true });
      const label = this.add.text(bx + speedW / 2, y + h / 2, `${speed}×`, {
        fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.text, fontStyle: 'bold',
      }).setOrigin(0.5);
      rect.on('pointerover', () => { if (this.ctx.speedMultiplier !== speed) rect.setFillStyle(hexColor(PALETTE.bg3)); });
      rect.on('pointerout',  () => this.refreshSpeedButtonColors());
      rect.on('pointerdown', () => { this.ctx.speedMultiplier = speed; this.refreshSpeedButtonColors(); });
      this.speedBtns.push({ rect, label, speed });
    }
    this.refreshSpeedButtonColors();
  }

  private refreshSpeedButtonColors() {
    for (const b of this.speedBtns) {
      const active = this.ctx.speedMultiplier === b.speed;
      b.rect.setFillStyle(hexColor(active ? PALETTE.btnUpgrade : PALETTE.bg2));
      b.rect.setStrokeStyle(active ? 2 : 1, hexColor(active ? PALETTE.accentCool : PALETTE.divider));
      b.label.setColor(active ? PALETTE.textBright : PALETTE.text);
    }
  }

  /** Called by RelicScene when the player picks a card. */
  resolveNode(opt: NodeOption) {
    applyNode(this.ctx, opt);
  }

  private openPauseMenu() {
    if (this.ctx.gameOver || this.ctx.victory) return;
    this.scene.pause();
    this.scene.launch(SCENES.Pause);
  }

  // ─── skill button + targeting ──────────────────────────────────

  private makeSkillButton(skillId: SkillId, x: number, y: number) {
    const def = SKILLS[skillId];
    const w = HUD_WIDTH - px(40), h = px(56);
    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0, 0);
    bg.setStrokeStyle(1, hexColor(def.color));
    bg.setInteractive({ useHandCursor: true });

    const iconKey = `skill_${skillId}`;
    const icon = this.textures.exists(iconKey)
      ? this.add.image(x + px(26), y + h / 2, iconKey).setDisplaySize(px(34), px(34)).setOrigin(0.5)
      : this.add.text(x + px(14), y + h / 2, def.shortName, {
          fontFamily: 'sans-serif', fontSize: '24px',
        }).setOrigin(0, 0.5);
    this.add.text(x + px(50), y + px(8), def.name, {
      fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.textBright, fontStyle: 'bold',
    });
    this.add.text(x + px(50), y + px(26), def.description, {
      fontFamily: 'sans-serif', fontSize: '10px', color: PALETTE.textDim,
      wordWrap: { width: w - px(60) },
    });

    // Cooldown overlay (drawn on top, refreshed every frame)
    const cdOverlay = this.add.graphics();
    cdOverlay.setDepth(2);
    const cdLabel = this.add.text(x + w - px(16), y + px(8), '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(1, 0);

    bg.on('pointerover', () => bg.setFillStyle(hexColor(PALETTE.bg3)));
    bg.on('pointerout',  () => bg.setFillStyle(hexColor(this.ctx.pendingSkillId === skillId ? PALETTE.bg4 : PALETTE.bg2)));
    bg.on('pointerdown', () => {
      if (!isSkillReady(this.ctx, skillId)) return;
      // toggle: clicking again cancels
      this.ctx.pendingSkillId = this.ctx.pendingSkillId === skillId ? null : skillId;
      this.ctx.selectedTowerToPlace = null;
    });

    this.skillBtnGroups.set(skillId, { bg, icon, cdOverlay, cdLabel, skillId });
  }

  private refreshSkillButton() {
    for (const grp of this.skillBtnGroups.values()) {
      const ratio = skillCooldownRatio(this.ctx, grp.skillId);
      grp.cdOverlay.clear();
      if (ratio > 0) {
        const b = grp.bg.getBounds();
        grp.cdOverlay.fillStyle(0x000000, 0.65);
        grp.cdOverlay.fillRect(b.x, b.y, b.width, b.height * ratio);
        const cd = this.ctx.skillCooldowns.get(grp.skillId) ?? 0;
        grp.cdLabel.setText(`${Math.ceil(cd)}s`);
      } else {
        grp.cdLabel.setText('');
      }
      const armed = this.ctx.pendingSkillId === grp.skillId;
      grp.bg.setStrokeStyle(armed ? 2 : 1, hexColor(armed ? PALETTE.accentCool : SKILLS[grp.skillId].color));
    }
  }

  private drawSkillTargeting() {
    this.skillTargetGfx.clear();
    if (!this.ctx.pendingSkillId) return;
    const ptr = this.input.activePointer;
    if (ptr.x >= PLAY_WIDTH) return;
    const def = SKILLS[this.ctx.pendingSkillId];
    const radPx = def.radiusGrid * CELL_SIZE;
    const c = hexColor(def.color);
    this.skillTargetGfx.lineStyle(2, c, 0.95);
    this.skillTargetGfx.strokeCircle(ptr.x, ptr.y, radPx);
    this.skillTargetGfx.fillStyle(c, 0.18);
    this.skillTargetGfx.fillCircle(ptr.x, ptr.y, radPx);
    // Crosshair
    this.skillTargetGfx.lineStyle(1.5, c, 0.85);
    this.skillTargetGfx.lineBetween(ptr.x - px(8), ptr.y, ptr.x + px(8), ptr.y);
    this.skillTargetGfx.lineBetween(ptr.x, ptr.y - px(8), ptr.x, ptr.y + px(8));
  }

  private makeTowerButton(id: TowerId, x: number, y: number, w: number, h: number) {
    const def = TOWERS[id];
    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0, 0);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });

    // Prefer the loaded SVG sprite; fall back to a colored dot if missing.
    const iconCx = x + px(16);
    const iconCy = y + h / 2;
    const spriteKey = `tower_${id}`;
    if (this.textures.exists(spriteKey)) {
      const icon = this.add.image(iconCx, iconCy, spriteKey);
      icon.setDisplaySize(px(24), px(24));
    } else {
      const dot = this.add.circle(iconCx, iconCy, px(9), hexColor(def.color));
      dot.setStrokeStyle(2, 0xffffff, 0.5);
    }

    this.add.text(x + px(32), y + px(5), def.name, {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textBright,
    });
    this.add.text(x + px(32), y + px(22), `${def.cost} 💰`, {
      fontFamily: 'sans-serif', fontSize: '10px', color: PALETTE.textDim,
    });

    bg.on('pointerover', () => {
      bg.setFillStyle(hexColor(PALETTE.bg3));
      bg.setStrokeStyle(2, hexColor(def.color));
    });
    bg.on('pointerout', () => {
      const selected = this.ctx.selectedTowerToPlace === id;
      bg.setFillStyle(hexColor(selected ? PALETTE.bg4 : PALETTE.bg2));
      bg.setStrokeStyle(selected ? 2 : 1, hexColor(selected ? def.color : PALETTE.divider));
    });
    bg.on('pointerdown', () => {
      if (this.ctx.gold >= def.cost) {
        this.ctx.selectedTowerToPlace = id;
        this.ctx.selectedTower = null;
      }
    });
  }

  private refreshHUD() {
    const ctx = this.ctx;
    this.goldText.setText(`💰 ${ctx.gold}`);
    this.livesText.setText(`❤ ${ctx.lives}`);

    const totalWaves = ctx.level.waves.length;
    const idx = Math.min(ctx.currentWaveIndex + 1, totalWaves);
    this.waveText.setText(`波次 ${idx} / ${totalWaves}`);

    if (ctx.victory) {
      this.waveStatusText.setText('✓ 关卡完成').setColor(PALETTE.positive);
    } else if (ctx.waveActive) {
      this.waveStatusText.setText(`进行中 · 剩余 ${ctx.waveEnemiesRemaining}`).setColor(PALETTE.accentRose);
    } else if (ctx.currentWaveIndex < totalWaves) {
      const next = ctx.level.waves[ctx.currentWaveIndex];
      const tip = next.tips ? ` · ${next.tips}` : '';
      const remaining = waveAutoStartRemaining(ctx);
      const countdown = remaining == null ? '' : ` · 自动 ${Math.ceil(remaining)}s`;
      this.waveStatusText.setText(`下一波 · ${next.name}${countdown}${tip}`).setColor(PALETTE.text);
    }

    const relicTail = ctx.ownedRelics.size > 0
      ? ' · ' + [...ctx.ownedRelics].map(r => RELICS[r].icon).join(' ')
      : '';
    this.reactionsText.setText(`✦ 反应数 ${ctx.stats.reactionsTriggered}${relicTail}`);
    this.refreshSkillButton();

    const startable = canStartWave(ctx);
    this.startWaveBtn.setFillStyle(hexColor(startable ? PALETTE.btnStart : PALETTE.btnDisabled));
    this.startWaveLabel.setText(
      ctx.victory ? '已通关'
      : ctx.gameOver ? '失败'
      : ctx.waveActive ? '波次进行中'
      : this.startWaveButtonText(),
    );
  }

  private startWaveButtonText(): string {
    const waveName = this.ctx.level.waves[this.ctx.currentWaveIndex]?.name ?? '';
    const remaining = waveAutoStartRemaining(this.ctx);
    if (remaining == null) return `开始 ${waveName}`;
    return `开始 ${waveName} · ${Math.ceil(remaining)}s`;
  }

  // ───────────── input ─────────────

  private attachInput() {
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.x >= PLAY_WIDTH) return;  // sidebar handled by widgets
      if (ptr.button === 2) {
        this.ctx.selectedTowerToPlace = null;
        this.ctx.selectedTower = null;
        this.ctx.pendingSkillId = null;
        return;
      }
      this.handlePlayClick(ptr.x, ptr.y);
    });
    // suppress browser context menu so right-click can deselect
    this.input.mouse?.disableContextMenu();
    // P / ESC open the pause menu (modal)
    this.input.keyboard?.on('keydown-P', () => this.openPauseMenu());
  }

  private handlePlayClick(x: number, y: number) {
    const ctx = this.ctx;
    const gp = pixelToGrid(x, y);

    // Cast pending skill (e.g. meteor) — takes precedence over building
    if (ctx.pendingSkillId) {
      switch (ctx.pendingSkillId) {
        case 'meteor':    castMeteor(this, ctx, x, y); break;
        case 'frostnova': castFrostNova(this, ctx, x, y); break;
        case 'lightning': castLightning(this, ctx, x, y); break;
      }
      return;
    }

    if (ctx.selectedTowerToPlace) {
      const def = TOWERS[ctx.selectedTowerToPlace];
      if (isPathCell(ctx.pathSet, gp.gx, gp.gy)) return;
      if (gp.gx < 0 || gp.gx >= GRID_COLS || gp.gy < 0 || gp.gy >= GRID_ROWS) return;
      if (ctx.towers.some(t => t.grid.gx === gp.gx && t.grid.gy === gp.gy)) return;
      if (ctx.gold < def.cost) return;
      ctx.gold -= def.cost;
      const tower = new Tower(this, ctx.selectedTowerToPlace, gp);
      ctx.towers.push(tower);
      recomputeFormations(ctx);
      ctx.selectedTowerToPlace = null;
      return;
    }

    const hit = ctx.towers.find(t => t.grid.gx === gp.gx && t.grid.gy === gp.gy);
    ctx.selectedTower = hit ?? null;
  }

  private onSpace() {
    if (canStartWave(this.ctx)) {
      startNextWave(this.ctx);
      audio.playSfx('sfx_wave_start');
    }
  }

  private onEscape() {
    if (this.ctx.gameOver || this.ctx.victory) {
      this.scene.start(SCENES.Chapter);
      return;
    }
    if (this.ctx.selectedTowerToPlace || this.ctx.selectedTower || this.ctx.pendingSkillId) {
      this.ctx.selectedTowerToPlace = null;
      this.ctx.selectedTower = null;
      this.ctx.pendingSkillId = null;
    }
  }

  // ───────────── selected tower detail panel ─────────────

  /** Rebuild the floating panel only when the selection target changes. */
  private refreshSelectionPanel() {
    const sel = this.ctx.selectedTower;
    const id = sel?.towerEntityId ?? null;
    if (id === this.selectionPanelForId) {
      // Same selection — repaint dynamic labels (cost may shift if level/gold changed)
      if (sel) this.repaintSelectionPanel(sel);
      return;
    }
    this.selectionPanel?.destroy();
    this.selectionPanel = undefined;
    this.selectionPanelRefs = undefined;
    this.selectionPanelForId = id;
    if (sel) this.buildSelectionPanel(sel);
  }

  private buildSelectionPanel(t: Tower) {
    const panelW = px(200);
    const panelH = px(130);
    const pad = px(8);
    const margin = px(6);
    // Anchor to the right of the tower; clamp to keep it on-screen.
    let panelX = t.x + CELL_SIZE * 0.7;
    let panelY = t.y - panelH / 2;
    if (panelX + panelW > PLAY_WIDTH - margin) panelX = t.x - CELL_SIZE * 0.7 - panelW;
    if (panelY < margin) panelY = margin;
    if (panelY + panelH > PLAY_HEIGHT - margin) panelY = PLAY_HEIGHT - panelH - margin;

    const c = this.add.container(panelX, panelY).setDepth(60);
    const bg = this.add.rectangle(0, 0, panelW, panelH, hexColor(PALETTE.bg2)).setOrigin(0);
    bg.setStrokeStyle(1, hexColor(t.def.color));
    c.add(bg);

    const title = this.add.text(pad, px(6), '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.textBright, fontStyle: 'bold',
    });
    const stats = this.add.text(pad, px(26), '', {
      fontFamily: 'sans-serif', fontSize: '10px', color: PALETTE.textDim,
      lineSpacing: 2,
    });
    c.add([title, stats]);

    const btnW = (panelW - px(24)) / 2;
    const btnH = px(22);
    const btnY = panelH - px(30);
    const labelDY = btnH / 2;

    const upBg = this.add.rectangle(pad, btnY, btnW, btnH, 0).setOrigin(0);
    upBg.setStrokeStyle(1, hexColor(PALETTE.divider));
    upBg.setInteractive({ useHandCursor: true });
    const upLabel = this.add.text(pad + btnW / 2, btnY + labelDY, '', {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    upBg.on('pointerdown', () => this.tryUpgradeSelected());
    c.add([upBg, upLabel]);

    const sellX = pad + btnW + pad;
    const sellBg = this.add.rectangle(sellX, btnY, btnW, btnH, hexColor(PALETTE.btnSell)).setOrigin(0);
    sellBg.setStrokeStyle(1, hexColor(PALETTE.divider));
    sellBg.setInteractive({ useHandCursor: true });
    const sellLabel = this.add.text(sellX + btnW / 2, btnY + labelDY, '', {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    sellBg.on('pointerover', () => sellBg.setFillStyle(hexColor(PALETTE.btnSellHot)));
    sellBg.on('pointerout',  () => sellBg.setFillStyle(hexColor(PALETTE.btnSell)));
    sellBg.on('pointerdown', () => this.sellSelected());
    c.add([sellBg, sellLabel]);

    this.selectionPanel = c;
    this.selectionPanelRefs = { title, stats, upBg, upLabel, sellLabel };
    this.repaintSelectionPanel(t);
  }

  private repaintSelectionPanel(t: Tower) {
    const refs = this.selectionPanelRefs;
    if (!refs) return;
    refs.title.setText(`${t.def.name}  Lv${t.level}`).setColor(t.def.color);

    const dmg = Math.round(t.damage * 10) / 10;
    const aps = Math.round(t.attackSpeed * 100) / 100;
    const rng = Math.round(t.range * 10) / 10;
    refs.stats.setText([`伤害 ${dmg}  攻速 ${aps}/s`, `射程 ${rng} 格`].join('\n'));

    const cost = t.nextUpgradeCost();
    const canAfford = cost != null && this.ctx.gold >= cost;
    if (cost == null) {
      refs.upLabel.setText('已满级');
      refs.upBg.setFillStyle(hexColor(PALETTE.btnDisabled));
    } else {
      refs.upLabel.setText(`升级 ${cost}💰`);
      refs.upBg.setFillStyle(hexColor(canAfford ? PALETTE.btnUpgrade : PALETTE.btnDisabled));
    }
    refs.sellLabel.setText(`出售 +${t.sellValue(this.ctx.sellRatio)}💰`);
  }

  private tryUpgradeSelected() {
    const t = this.ctx.selectedTower;
    if (!t) return;
    const cost = t.nextUpgradeCost();
    if (cost == null || this.ctx.gold < cost) return;
    this.ctx.gold -= cost;
    t.upgrade();
    audio.playSfx('sfx_click');
    // Visual pulse — quick scale bounce + a glowing ring at the tower
    this.tweens.add({
      targets: t, scaleX: 1.18, scaleY: 1.18,
      duration: 120, yoyo: true, ease: 'Cubic.easeOut',
    });
    const ring = this.add.circle(t.x, t.y, CELL_SIZE * 0.5, hexColor(t.def.color), 0)
      .setStrokeStyle(3, hexColor(t.def.color), 0.9).setDepth(40);
    this.tweens.add({
      targets: ring, radius: CELL_SIZE * 1.2, alpha: 0,
      duration: 420, ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private sellSelected() {
    const t = this.ctx.selectedTower;
    if (!t) return;
    const refund = t.sellValue(this.ctx.sellRatio);
    this.ctx.gold += refund;
    this.ctx.stats.goldEarned += refund;
    this.ctx.towers = this.ctx.towers.filter(x => x !== t);
    t.destroy();
    this.ctx.selectedTower = null;
    recomputeFormations(this.ctx);
    audio.playSfx('sfx_click');
  }

  // ───────────── overlay ─────────────

  private showOverlay(victory: boolean) {
    if (this.overlay) return;
    const c = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(0, 0, PLAY_WIDTH, PLAY_HEIGHT, 0x000000, 0.72).setOrigin(0);
    const title = this.add.text(PLAY_WIDTH / 2, PLAY_HEIGHT / 2 - px(30),
      victory ? '胜利!' : '失败', {
      fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'bold',
      color: victory ? PALETTE.accentHot : PALETTE.danger,
    }).setOrigin(0.5);
    const sub = this.add.text(PLAY_WIDTH / 2, PLAY_HEIGHT / 2 + px(30),
      'ESC 返回章节', {
      fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.text,
    }).setOrigin(0.5);
    c.add([bg, title, sub]);
    this.overlay = c;
  }
}
