import type { Tower } from '@/entities/Tower';
import { state } from '@/game/GameState';
import { CELL_SIZE } from '@/utils/Grid';
import { PALETTE, withAlpha } from '@/theme';

type Ctx = CanvasRenderingContext2D;

export function drawTower(ctx: Ctx, tower: Tower) {
  const drawer = DRAWERS[tower.towerId];
  drawer(ctx, tower);
  drawLevelPips(ctx, tower);
  drawFormationBadge(ctx, tower);
}

function hexPath(ctx: Ctx, cx: number, cy: number, r: number, rotDeg = 30) {
  ctx.beginPath();
  const rot = (rotDeg * Math.PI) / 180;
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawShadow(ctx: Ctx, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.35, size * 0.9, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBase(ctx: Ctx, x: number, y: number, fill: string, outline: string) {
  ctx.fillStyle = fill;
  hexPath(ctx, x, y, 13);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;
  hexPath(ctx, x, y, 13);
  ctx.stroke();
}

function drawGlowCore(ctx: Ctx, x: number, y: number, r: number, color: string, innerColor: string) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.4);
  grad.addColorStop(0, color);
  grad.addColorStop(0.6, withAlpha(color, 0.45));
  grad.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarrel(ctx: Ctx, tower: Tower, length: number, width: number, color: string) {
  const { pos, aimAngle } = tower;
  const tx = pos.x + Math.cos(aimAngle) * length;
  const ty = pos.y + Math.sin(aimAngle) * length;
  ctx.save();
  ctx.strokeStyle = PALETTE.bg1;
  ctx.lineWidth = width + 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.restore();
}

function drawLevelPips(ctx: Ctx, tower: Tower) {
  const x0 = tower.pos.x - 9;
  const y = tower.pos.y - 18;
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * 9;
    const lit = i < tower.level;
    ctx.fillStyle = lit ? PALETTE.accent : PALETTE.bg4;
    ctx.fillRect(x, y, 6, 3);
    if (lit) {
      ctx.fillStyle = withAlpha(PALETTE.accent, 0.35);
      ctx.fillRect(x - 1, y - 1, 8, 5);
      ctx.fillStyle = PALETTE.accentHot;
      ctx.fillRect(x, y, 6, 3);
    }
  }
}

function drawFormationBadge(ctx: Ctx, tower: Tower) {
  if (tower.formations.size === 0) return;
  ctx.save();
  ctx.fillStyle = PALETTE.accentHot;
  ctx.shadowColor = PALETTE.accent;
  ctx.shadowBlur = 5;
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${tower.formations.size}★`, tower.pos.x + CELL_SIZE / 2 - 3, tower.pos.y + CELL_SIZE / 2 - 3);
  ctx.restore();
}

// ───── Tower-specific drawers ─────

function drawSpark(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 14);
  drawBase(ctx, pos.x, pos.y, PALETTE.fireDark, PALETTE.fire);
  drawGlowCore(ctx, pos.x, pos.y, 6 + Math.sin(state.time * 6) * 0.6, PALETTE.fire, PALETTE.fireGlow);
  drawBarrel(ctx, t, 16, 3, PALETTE.fireAccent);
}

function drawLava(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 16);
  drawBase(ctx, pos.x, pos.y, PALETTE.fireDark, PALETTE.fireAccent);
  // Heat cracks
  ctx.strokeStyle = withAlpha(PALETTE.fireAccent, 0.7 + Math.sin(state.time * 3) * 0.2);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(pos.x - 8, pos.y - 3); ctx.lineTo(pos.x + 2, pos.y + 4);
  ctx.moveTo(pos.x - 3, pos.y - 6); ctx.lineTo(pos.x + 6, pos.y + 1);
  ctx.stroke();
  drawGlowCore(ctx, pos.x, pos.y, 8, PALETTE.fireAccent, PALETTE.fireGlow);
  drawBarrel(ctx, t, 18, 5, PALETTE.fireAccent);
  const tx = pos.x + Math.cos(t.aimAngle) * 18;
  const ty = pos.y + Math.sin(t.aimAngle) * 18;
  ctx.fillStyle = PALETTE.fireGlow;
  ctx.beginPath();
  ctx.arc(tx, ty, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrost(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 14);
  drawBase(ctx, pos.x, pos.y, PALETTE.iceDark, PALETTE.ice);
  drawGlowCore(ctx, pos.x, pos.y, 5, PALETTE.ice, PALETTE.iceGlow);
  // Crystal spikes
  ctx.strokeStyle = PALETTE.iceGlow;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(pos.x + Math.cos(a) * 4, pos.y + Math.sin(a) * 4);
    ctx.lineTo(pos.x + Math.cos(a) * 9, pos.y + Math.sin(a) * 9);
    ctx.stroke();
  }
  drawBarrel(ctx, t, 18, 2, PALETTE.iceGlow);
}

function drawBlizzard(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 16);
  drawBase(ctx, pos.x, pos.y, PALETTE.iceDark, PALETTE.iceAccent);
  ctx.strokeStyle = withAlpha(PALETTE.iceGlow, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(PALETTE.ice, 0.8);
  ctx.lineWidth = 1;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(state.time * 1.2);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
    ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
    ctx.stroke();
  }
  ctx.restore();
  drawGlowCore(ctx, pos.x, pos.y, 4, PALETTE.iceAccent, PALETTE.iceGlow);
  drawBarrel(ctx, t, 16, 4, PALETTE.iceGlow);
}

function drawArc(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 14);
  drawBase(ctx, pos.x, pos.y, PALETTE.thunderDark, PALETTE.thunder);
  // Tesla coil rings
  for (let i = 0; i < 3; i++) {
    const r = 9 - i * 2;
    const y = pos.y - i * 2;
    ctx.fillStyle = '#2a2212';
    ctx.beginPath();
    ctx.ellipse(pos.x, y, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.thunder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(pos.x, y, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawGlowCore(ctx, pos.x, pos.y - 6, 4, PALETTE.thunderAccent, PALETTE.thunderGlow);
  // Ambient sparks
  if (Math.random() < 0.3) {
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      state.particles.push({
        pos: { x: pos.x + Math.cos(a) * 4, y: pos.y - 6 + Math.sin(a) * 4 },
        vel: { x: Math.cos(a) * 40, y: Math.sin(a) * 40 },
        color: PALETTE.thunderGlow,
        remainingTime: 0.12, life: 0.12, radius: 1.2,
      });
    }
  }
}

function drawMagstorm(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 16);
  drawBase(ctx, pos.x, pos.y, PALETTE.thunderDark, PALETTE.thunderAccent);
  ctx.strokeStyle = PALETTE.thunder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(state.time * 3);
  ctx.fillStyle = PALETTE.thunderAccent;
  ctx.fillRect(-6, -2, 12, 4);
  ctx.fillRect(-2, -6, 4, 12);
  ctx.restore();
  drawGlowCore(ctx, pos.x, pos.y, 4, PALETTE.thunderAccent, PALETTE.thunderGlow);
  drawBarrel(ctx, t, 20, 5, PALETTE.thunderAccent);
}

function drawToxin(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 14);
  drawBase(ctx, pos.x, pos.y, PALETTE.poisonDark, PALETTE.poison);
  // Flask body
  ctx.fillStyle = '#141a08';
  ctx.fillRect(pos.x - 4, pos.y - 5, 8, 10);
  ctx.strokeStyle = PALETTE.poison;
  ctx.lineWidth = 1;
  ctx.strokeRect(pos.x - 4, pos.y - 5, 8, 10);
  const bubble = Math.sin(state.time * 4);
  ctx.fillStyle = PALETTE.poison;
  ctx.fillRect(pos.x - 3, pos.y + 1 - Math.abs(bubble), 6, 4);
  ctx.fillStyle = PALETTE.poisonGlow;
  ctx.beginPath();
  ctx.arc(pos.x - 1 + bubble * 1.5, pos.y - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  drawBarrel(ctx, t, 16, 2, PALETTE.poisonGlow);
}

function drawMiasma(ctx: Ctx, t: Tower) {
  const { pos } = t;
  drawShadow(ctx, pos.x, pos.y + 2, 16);
  drawBase(ctx, pos.x, pos.y, PALETTE.poisonDark, PALETTE.poisonAccent);
  ctx.fillStyle = '#141a08';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + 1, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.poisonAccent;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + 1, 9, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Bubbling
  for (let i = 0; i < 3; i++) {
    const a = state.time * 2 + i * 2.1;
    const x = pos.x + Math.cos(a) * 4;
    const y = pos.y - 2 + Math.sin(a) * 1.5;
    ctx.fillStyle = withAlpha(PALETTE.poison, 0.8);
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Continuous smoke
  if (Math.random() < 0.15) {
    state.particles.push({
      pos: { x: pos.x + (Math.random() - 0.5) * 4, y: pos.y - 6 },
      vel: { x: (Math.random() - 0.5) * 10, y: -15 - Math.random() * 10 },
      color: withAlpha(PALETTE.poisonGlow, 0.55),
      remainingTime: 1.2, life: 1.2, radius: 3 + Math.random() * 2,
    });
  }
  drawBarrel(ctx, t, 14, 3, PALETTE.poisonAccent);
}

const DRAWERS: Record<string, (ctx: Ctx, t: Tower) => void> = {
  spark: drawSpark,
  lava: drawLava,
  frost: drawFrost,
  blizzard: drawBlizzard,
  arc: drawArc,
  magstorm: drawMagstorm,
  toxin: drawToxin,
  miasma: drawMiasma,
};

const ELEMENT_COLOR_BY_TOWER: Record<string, string> = {
  spark: PALETTE.fire,
  lava: PALETTE.fireAccent,
  frost: PALETTE.ice,
  blizzard: PALETTE.iceAccent,
  arc: PALETTE.thunder,
  magstorm: PALETTE.thunderAccent,
  toxin: PALETTE.poison,
  miasma: PALETTE.poisonAccent,
};

export function drawTowerIcon(ctx: Ctx, towerId: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  const color = ELEMENT_COLOR_BY_TOWER[towerId] ?? PALETTE.text;
  ctx.fillStyle = withAlpha(color, 0.2);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 6) + (i * Math.PI) / 3;
    const px = Math.cos(a) * size * 0.9;
    const py = Math.sin(a) * size * 0.9;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
