import { state } from '@/game/GameState';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_WIDTH, PLAY_HEIGHT,
  CELL_SIZE, GRID_COLS, GRID_ROWS, gridToPixel, pixelToGrid,
} from '@/utils/Grid';
import { isBuildable } from '@/config/map';
import { TOWERS } from '@/config/towers';
import { getActWaves } from '@/config/waves';
import { ACTS, getActByIndex } from '@/config/maps';
import { RELICS } from '@/config/relics';
import type { TowerId } from '@/types';
import { drawBackground } from './Background';
import { drawTower, drawTowerIcon } from './TowerSprites';
import { drawEnemy } from './EnemySprites';
import { PALETTE, withAlpha } from '@/theme';

const PICKER_X = PLAY_WIDTH + 10;
const PICKER_CELL = 56;
const PICKER_COLS = 2;
const PICKER_Y = 140;

const TOWER_ORDER: TowerId[] = ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma'];

export function pickerButtonRect(i: number) {
  const col = i % PICKER_COLS;
  const row = Math.floor(i / PICKER_COLS);
  return {
    x: PICKER_X + col * (PICKER_CELL + 8),
    y: PICKER_Y + row * (PICKER_CELL + 8),
    w: PICKER_CELL,
    h: PICKER_CELL,
  };
}

export function getTowerPickerSlot(mx: number, my: number): TowerId | null {
  for (let i = 0; i < TOWER_ORDER.length; i++) {
    const r = pickerButtonRect(i);
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
      return TOWER_ORDER[i];
    }
  }
  return null;
}

interface InfoButtons {
  upgrade?: { x: number; y: number; w: number; h: number; cost: number };
  sell?: { x: number; y: number; w: number; h: number; value: number };
  startWave?: { x: number; y: number; w: number; h: number };
  continueAct?: { x: number; y: number; w: number; h: number };
}

export const uiButtons: InfoButtons = {};
export const nodeCardRects: Array<{ x: number; y: number; w: number; h: number }> = [];

export class Renderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Play-area drawing under screen shake transform
    ctx.save();
    if (state.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * state.shakeIntensity;
      const sy = (Math.random() - 0.5) * state.shakeIntensity;
      ctx.translate(sx, sy);
    }
    // Clip to play area so shake doesn't bleed into HUD
    ctx.beginPath();
    ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.clip();

    drawBackground(ctx);
    this.drawGroundZones();
    this.drawPlacementPreview();
    this.drawTowers();
    this.drawProjectiles();
    this.drawEnemies();
    this.drawParticles();
    this.drawFloaters();
    this.drawSelectedTowerRange();
    ctx.restore();

    this.drawHUD();
    this.drawNodeOverlay();
    this.drawActTransition();
    this.drawOverlay();
  }

  private drawGroundZones() {
    const ctx = this.ctx;
    for (const z of state.groundZones) {
      const alpha = Math.min(0.4, z.remainingTime * 0.3);
      ctx.fillStyle = hexWithAlpha(z.color, alpha);
      ctx.beginPath();
      ctx.arc(z.pos.x, z.pos.y, z.radiusPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexWithAlpha(z.color, 0.6);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawPlacementPreview() {
    const ctx = this.ctx;
    if (!state.selectedTowerToPlace || !state.mouseInPlayArea) return;
    const gp = pixelToGrid(state.mouseX, state.mouseY);
    if (gp.gx < 0 || gp.gx >= GRID_COLS || gp.gy < 0 || gp.gy >= GRID_ROWS) return;
    const def = TOWERS[state.selectedTowerToPlace];
    const valid = isBuildable(gp.gx, gp.gy) && !state.towers.some(t => t.grid.gx === gp.gx && t.grid.gy === gp.gy) && state.gold >= def.cost;
    const p = gridToPixel(gp.gx, gp.gy);

    // Cell fill
    ctx.fillStyle = valid ? withAlpha(def.color, 0.15) : withAlpha(PALETTE.danger, 0.22);
    ctx.fillRect(gp.gx * CELL_SIZE, gp.gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = valid ? def.color : PALETTE.danger;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(gp.gx * CELL_SIZE + 1, gp.gy * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.setLineDash([]);

    // Range ring
    ctx.strokeStyle = withAlpha(def.color, 0.55);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -state.time * 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, def.range * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = withAlpha(def.color, 0.05);
    ctx.beginPath();
    ctx.arc(p.x, p.y, def.range * CELL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    if (valid) {
      drawTowerIcon(ctx, state.selectedTowerToPlace, p.x, p.y, 10);
    }
  }

  private drawSelectedTowerRange() {
    const ctx = this.ctx;
    const t = state.selectedTower;
    if (!t) return;
    ctx.save();
    ctx.strokeStyle = withAlpha(t.def.color, 0.7);
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -state.time * 16;
    ctx.beginPath();
    ctx.arc(t.pos.x, t.pos.y, t.rangePx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = withAlpha(t.def.color, 0.06);
    ctx.fill();
    ctx.restore();
  }

  private drawTowers() {
    this.drawFormationLinks();
    for (const t of state.towers) drawTower(this.ctx, t);
  }

  private drawFormationLinks() {
    const ctx = this.ctx;
    const seen = new Set<string>();
    for (const a of state.towers) {
      if (a.formations.size === 0) continue;
      for (const b of state.towers) {
        if (a === b || b.formations.size === 0) continue;
        const dx = Math.abs(a.grid.gx - b.grid.gx);
        const dy = Math.abs(a.grid.gy - b.grid.gy);
        if (!((dx + dy) > 0 && dx <= 1 && dy <= 1)) continue;
        // Must share at least one formation id
        let share = false;
        for (const f of a.formations) if (b.formations.has(f)) { share = true; break; }
        if (!share) continue;
        const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // Pulsing teal resonance (not gold — keep gold for currency)
        const pulse = 0.5 + Math.sin(state.time * 3) * 0.3;
        ctx.strokeStyle = withAlpha(PALETTE.accentCool, 0.3 + pulse * 0.3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.pos.x, a.pos.y);
        ctx.lineTo(b.pos.x, b.pos.y);
        ctx.stroke();
        ctx.strokeStyle = withAlpha(PALETTE.accentCool, 0.7);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  private drawProjectiles() {
    const ctx = this.ctx;
    for (const p of state.projectiles) {
      // Trail particle
      state.particles.push({
        pos: { ...p.pos },
        vel: { x: 0, y: 0 },
        color: p.color,
        remainingTime: 0.18, life: 0.18, radius: p.radius * 0.9,
      });
      // Outer glow
      const grad = ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, p.radius * 2.5);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, hexWithAlpha(p.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.fillStyle = PALETTE.textBright;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEnemies() {
    for (const e of state.enemies) {
      if (e.dead || e.reachedEnd) continue;
      drawEnemy(this.ctx, e);
    }
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of state.particles) {
      const alpha = Math.max(0, p.remainingTime / p.life);
      ctx.fillStyle = hexWithAlpha(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFloaters() {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    for (const f of state.floaters) {
      const alpha = Math.max(0, Math.min(1, f.remainingTime / 0.9));
      // Determine style by text: big numbers or gold or small
      const asNum = parseFloat(f.text);
      let fontPx = 11;
      let bold = false;
      if (!isNaN(asNum)) {
        if (asNum >= 60) { fontPx = 16; bold = true; }
        else if (asNum >= 30) { fontPx = 13; bold = true; }
      } else if (f.text.includes('💰')) {
        fontPx = 12; bold = true;
      }
      ctx.font = `${bold ? 'bold ' : ''}${fontPx}px sans-serif`;
      ctx.fillStyle = `rgba(0,0,0,${0.75 * alpha})`;
      ctx.fillText(f.text, f.pos.x + 1, f.pos.y + 1);
      ctx.fillStyle = withAlpha(f.color, alpha);
      ctx.fillText(f.text, f.pos.x, f.pos.y);
    }
  }

  private drawHUD() {
    const ctx = this.ctx;
    // Sidebar gradient background
    const sbGrad = ctx.createLinearGradient(PLAY_WIDTH, 0, CANVAS_WIDTH, 0);
    sbGrad.addColorStop(0, PALETTE.bg1);
    sbGrad.addColorStop(1, PALETTE.bg0);
    ctx.fillStyle = sbGrad;
    ctx.fillRect(PLAY_WIDTH, 0, CANVAS_WIDTH - PLAY_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = PALETTE.divider;
    ctx.beginPath();
    ctx.moveTo(PLAY_WIDTH + 0.5, 0);
    ctx.lineTo(PLAY_WIDTH + 0.5, CANVAS_HEIGHT);
    ctx.stroke();

    // Title with a cool rose-gold glow (not yellow)
    ctx.save();
    ctx.shadowColor = PALETTE.accentRose;
    ctx.shadowBlur = 6;
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOWERWAR', PLAY_WIDTH + 12, 22);
    ctx.restore();
    ctx.font = '9px sans-serif';
    ctx.fillStyle = PALETTE.textDim;
    const act = getActByIndex(state.currentActIndex);
    ctx.fillText(act.name, PLAY_WIDTH + 12, 36);

    // Resources
    ctx.font = '12px sans-serif';
    ctx.fillStyle = PALETTE.accent;
    ctx.fillText(`💰 ${state.gold}`, PLAY_WIDTH + 12, 58);
    ctx.fillStyle = PALETTE.danger;
    ctx.fillText(`❤ ${state.lives}`, PLAY_WIDTH + 100, 58);

    // Wave info
    const waves = getActWaves(state.currentActIndex);
    const waveIdx = state.currentWaveIndex;
    const waveInfo = waveIdx < waves.length ? waves[waveIdx] : null;
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`下一波 ${Math.min(waveIdx + 1, waves.length)}/${waves.length}`, PLAY_WIDTH + 12, 78);
    if (waveInfo) {
      ctx.fillStyle = PALETTE.text;
      ctx.fillText(waveInfo.name, PLAY_WIDTH + 12, 92);
    }

    // Vouchers + relics
    if (state.upgradeVouchers > 0) {
      ctx.fillStyle = PALETTE.accent;
      ctx.font = '12px sans-serif';
      ctx.fillText(`🎟️ 升级券 ×${state.upgradeVouchers}`, PLAY_WIDTH + 12, 110);
    }
    if (state.ownedRelics.size > 0) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = PALETTE.textBright;
      let rx = PLAY_WIDTH + 12;
      let ry = 130;
      for (const rid of state.ownedRelics) {
        const relic = RELICS[rid];
        ctx.fillText(relic.icon, rx, ry);
        rx += 16;
        if (rx > PLAY_WIDTH + 184) { rx = PLAY_WIDTH + 12; ry += 16; }
      }
    }

    // Tower picker
    for (let i = 0; i < TOWER_ORDER.length; i++) {
      const id = TOWER_ORDER[i];
      const def = TOWERS[id];
      const r = pickerButtonRect(i);
      const affordable = state.gold >= def.cost;
      const selected = state.selectedTowerToPlace === id;
      ctx.fillStyle = selected ? PALETTE.bg4 : PALETTE.bg2;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = selected ? def.color : affordable ? PALETTE.divider : PALETTE.bg3;
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      // Tower icon
      ctx.save();
      if (!affordable) ctx.globalAlpha = 0.35;
      drawTowerIcon(ctx, id, r.x + r.w / 2, r.y + 22, 12);
      ctx.restore();
      // Label
      ctx.font = '9px sans-serif';
      ctx.fillStyle = affordable ? PALETTE.text : PALETTE.textFaint;
      ctx.textAlign = 'center';
      ctx.fillText(def.name, r.x + r.w / 2, r.y + 42);
      ctx.fillStyle = affordable ? PALETTE.accent : PALETTE.textFaint;
      ctx.fillText(`${def.cost}💰`, r.x + r.w / 2, r.y + 52);
    }

    // Selected tower info
    const pickerBottom = PICKER_Y + Math.ceil(TOWER_ORDER.length / PICKER_COLS) * (PICKER_CELL + 8);
    let infoY = pickerBottom + 10;
    uiButtons.upgrade = undefined;
    uiButtons.sell = undefined;
    if (state.selectedTower) {
      const t = state.selectedTower;
      const cur = t.statsAtLevel(t.level);
      const nxt = t.level < 3 ? t.statsAtLevel((t.level + 1) as 1 | 2 | 3) : null;

      ctx.fillStyle = PALETTE.textBright;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      let title = `${t.def.name} L${t.level}`;
      if (nxt) title += `  →  L${nxt.level}`;
      ctx.fillText(title, PLAY_WIDTH + 12, infoY);
      infoY += 16;

      // Stat diff rows
      const rows: Array<{ label: string; cur: string; next?: string }> = [];
      rows.push({
        label: '伤害',
        cur: Math.round(cur.damage).toString(),
        next: nxt ? Math.round(nxt.damage).toString() : undefined,
      });
      rows.push({
        label: '攻速',
        cur: cur.attackSpeed.toFixed(2),
        next: nxt ? nxt.attackSpeed.toFixed(2) : undefined,
      });
      rows.push({
        label: '射程',
        cur: cur.range.toFixed(1),
        next: nxt ? nxt.range.toFixed(1) : undefined,
      });
      if (cur.aoeRadius !== undefined) {
        rows.push({
          label: 'AOE',
          cur: cur.aoeRadius.toFixed(2),
          next: nxt?.aoeRadius !== undefined ? nxt.aoeRadius.toFixed(2) : undefined,
        });
      }
      if (cur.dotDamage !== undefined) {
        rows.push({
          label: 'DOT',
          cur: `${cur.dotDamage.toFixed(1)}/s`,
          next: nxt?.dotDamage !== undefined ? `${nxt.dotDamage.toFixed(1)}/s` : undefined,
        });
      }
      if (t.towerId === 'frost') {
        rows.push({
          label: '印记',
          cur: `${Math.round(cur.markChance * 100)}%`,
          next: nxt ? `${Math.round(nxt.markChance * 100)}%` : undefined,
        });
      }

      for (const row of rows) {
        drawStatRow(ctx, row.label, row.cur, row.next, PLAY_WIDTH + 12, infoY);
        infoY += 13;
      }

      if (t.formations.size > 0) {
        ctx.fillStyle = PALETTE.accentCool;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`阵型: ${[...t.formations].join(', ')}`, PLAY_WIDTH + 12, infoY);
        infoY += 14;
      }
      // Upgrade button
      const upCost = t.upgradeCost();
      if (upCost !== null) {
        const btn = { x: PLAY_WIDTH + 12, y: infoY + 4, w: 84, h: 24 };
        const useVoucher = state.upgradeVouchers > 0;
        const canPay = useVoucher || state.gold >= upCost;
        ctx.fillStyle = canPay ? (useVoucher ? PALETTE.btnVoucher : PALETTE.btnUpgrade) : PALETTE.btnDisabled;
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = PALETTE.textBright;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(useVoucher ? `升级 🎟️` : `升级 ${upCost}💰`, btn.x + btn.w / 2, btn.y + 16);
        uiButtons.upgrade = { ...btn, cost: upCost };
      }
      // Sell button
      const sellBtn = { x: PLAY_WIDTH + 102, y: infoY + 4, w: 84, h: 24 };
      ctx.fillStyle = PALETTE.btnSell;
      ctx.fillRect(sellBtn.x, sellBtn.y, sellBtn.w, sellBtn.h);
      ctx.fillStyle = PALETTE.textBright;
      ctx.textAlign = 'center';
      ctx.fillText(`出售 ${t.sellValue()}💰`, sellBtn.x + sellBtn.w / 2, sellBtn.y + 16);
      uiButtons.sell = { ...sellBtn, value: t.sellValue() };
      infoY += 36;
    }

    // Start wave button at bottom
    const wbtn = { x: PLAY_WIDTH + 12, y: CANVAS_HEIGHT - 52, w: CANVAS_WIDTH - PLAY_WIDTH - 24, h: 34 };
    const canStart = !state.waveActive
      && state.currentWaveIndex < waves.length
      && !state.gameOver
      && !state.victory
      && !state.pendingActTransition;
    ctx.fillStyle = canStart ? PALETTE.btnStart : PALETTE.btnDisabled;
    ctx.fillRect(wbtn.x, wbtn.y, wbtn.w, wbtn.h);
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.waveActive ? `波次进行中` : `开始下一波`, wbtn.x + wbtn.w / 2, wbtn.y + 22);
    uiButtons.startWave = wbtn;

    // Stats at very bottom
    ctx.font = '9px sans-serif';
    ctx.fillStyle = PALETTE.textFaint;
    ctx.textAlign = 'left';
    ctx.fillText(`击杀 ${state.stats.enemiesKilled}   反应 ${state.stats.reactionsTriggered}`, PLAY_WIDTH + 12, CANVAS_HEIGHT - 10);
  }

  private drawOverlay() {
    if (!state.gameOver && !state.victory) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.fillStyle = state.victory ? PALETTE.accentHot : PALETTE.danger;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.victory ? '胜利!' : '失败', PLAY_WIDTH / 2, PLAY_HEIGHT / 2);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '14px sans-serif';
    ctx.fillText('F5 重新开始', PLAY_WIDTH / 2, PLAY_HEIGHT / 2 + 40);
  }

  private drawActTransition() {
    // Always clear in case we exited transition since last frame
    uiButtons.continueAct = undefined;
    if (!state.pendingActTransition) return;
    // If a node overlay is also showing (last wave offered one), let the node resolve first.
    if (state.pendingNode) return;

    const ctx = this.ctx;
    const nextIdx = state.currentActIndex + 1;
    if (nextIdx >= ACTS.length) return;  // safety; shouldn't happen
    const finishedAct = ACTS[state.currentActIndex];
    const nextAct = ACTS[nextIdx];

    // Panel backdrop (play area only, HUD remains)
    ctx.fillStyle = 'rgba(3,7,3,0.82)';
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

    // Top title
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.accentCool;
    ctx.font = '13px sans-serif';
    ctx.fillText('幕间', PLAY_WIDTH / 2, 80);

    ctx.fillStyle = PALETTE.accentRose;
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`${finishedAct.name} · 完成`, PLAY_WIDTH / 2, 128);

    // Mid-section stats
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = '14px sans-serif';
    const midY = PLAY_HEIGHT / 2 - 20;
    ctx.fillText('本局累计', PLAY_WIDTH / 2, midY - 30);

    const statLine = `击杀 ${state.stats.enemiesKilled}    反应 ${state.stats.reactionsTriggered}    金币 ${state.stats.goldEarned}`;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '15px sans-serif';
    ctx.fillText(statLine, PLAY_WIDTH / 2, midY);

    // Carryover hint
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '11px sans-serif';
    ctx.fillText(
      `所有塔及等级将继承至下一幕 · 压在新路径上的塔会自动退款`,
      PLAY_WIDTH / 2, midY + 24,
    );

    // Next-act preview
    ctx.fillStyle = PALETTE.accentCool;
    ctx.font = '13px sans-serif';
    ctx.fillText('即将进入', PLAY_WIDTH / 2, midY + 68);
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(nextAct.name, PLAY_WIDTH / 2, midY + 98);
    ctx.fillStyle = PALETTE.danger;
    ctx.font = '12px sans-serif';
    ctx.fillText(`终波 · ${nextAct.bossLabel}`, PLAY_WIDTH / 2, midY + 118);

    // Continue button
    const btn = { x: PLAY_WIDTH / 2 - 110, y: PLAY_HEIGHT - 86, w: 220, h: 44 };
    const hover = state.mouseX >= btn.x && state.mouseX <= btn.x + btn.w
      && state.mouseY >= btn.y && state.mouseY <= btn.y + btn.h;
    ctx.fillStyle = hover ? PALETTE.accent : PALETTE.btnStart;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = hover ? PALETTE.accentHot : PALETTE.divider;
    ctx.lineWidth = hover ? 2 : 1;
    ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w - 1, btn.h - 1);
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('继续 →  (空格)', btn.x + btn.w / 2, btn.y + 28);
    uiButtons.continueAct = btn;
  }

  private drawNodeOverlay() {
    nodeCardRects.length = 0;
    if (!state.pendingNode) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(4,6,10,0.78)';
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

    ctx.fillStyle = PALETTE.accentRose;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('战役奖励 · 三选一', PLAY_WIDTH / 2, 70);

    const cardW = 180, cardH = 240, gap = 24;
    const total = cardW * 3 + gap * 2;
    const startX = (PLAY_WIDTH - total) / 2;
    const y = (PLAY_HEIGHT - cardH) / 2;
    for (let i = 0; i < state.pendingNode.options.length; i++) {
      const opt = state.pendingNode.options[i];
      const x = startX + i * (cardW + gap);
      nodeCardRects.push({ x, y, w: cardW, h: cardH });

      const hover = state.mouseX >= x && state.mouseX <= x + cardW && state.mouseY >= y && state.mouseY <= y + cardH;
      ctx.fillStyle = hover ? PALETTE.bg4 : PALETTE.bg2;
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = hover ? PALETTE.accent : PALETTE.divider;
      ctx.lineWidth = hover ? 3 : 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, cardH - 1);

      // Type label
      ctx.font = '10px sans-serif';
      ctx.fillStyle = PALETTE.textDim;
      ctx.textAlign = 'center';
      const typeLabel = opt.type === 'relic' ? '遗物' : opt.type === 'upgrade' ? '资源' : '金币';
      ctx.fillText(typeLabel, x + cardW / 2, y + 22);

      // Icon
      ctx.font = '56px sans-serif';
      ctx.fillStyle = PALETTE.textBright;
      ctx.fillText(opt.icon, x + cardW / 2, y + 100);

      // Name
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = PALETTE.textBright;
      ctx.fillText(opt.label, x + cardW / 2, y + 140);

      // Description (wrapped)
      ctx.font = '12px sans-serif';
      ctx.fillStyle = PALETTE.text;
      this.wrapText(opt.description, x + cardW / 2, y + 168, cardW - 28, 16);
    }
  }

  private wrapText(text: string, x: number, y: number, maxW: number, lineH: number) {
    const ctx = this.ctx;
    const chars = Array.from(text);
    let line = '';
    let cursorY = y;
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cursorY);
        cursorY += lineH;
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cursorY);
  }
}

function hexWithAlpha(hex: string, a: number): string {
  return withAlpha(hex, a);
}

function drawStatRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  cur: string,
  next: string | undefined,
  x: number,
  y: number,
) {
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(label, x, y);

  const curX = x + 70;
  ctx.textAlign = 'right';
  ctx.fillStyle = next !== undefined && next !== cur ? PALETTE.textFaint : PALETTE.text;
  ctx.fillText(cur, curX, y);

  if (next !== undefined) {
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.accentCool;  // teal arrow (info, not currency)
    ctx.fillText('→', curX + 4, y);
    const changed = next !== cur;
    ctx.font = changed ? 'bold 10px sans-serif' : '10px sans-serif';
    ctx.fillStyle = changed ? PALETTE.accentCool : PALETTE.text;
    ctx.fillText(next, curX + 18, y);
  }
}

