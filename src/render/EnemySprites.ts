import type { Enemy } from '@/entities/Enemy';
import { state } from '@/game/GameState';
import { ELEMENTS } from '@/config/elements';
import { PALETTE, withAlpha } from '@/theme';

type Ctx = CanvasRenderingContext2D;

export function drawEnemy(ctx: Ctx, e: Enemy) {
  const drawer = DRAWERS[e.type] ?? drawNormal;
  drawShadow(ctx, e.pos.x, e.pos.y + e.def.radius * 0.7, e.def.radius);
  drawer(ctx, e);
  drawStatusOverlays(ctx, e);
  drawHPBar(ctx, e);
  drawMarks(ctx, e);
}

function drawShadow(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function darker(color: string, f = 0.55): string {
  // Shade a hex color toward black
  const c = color.replace('#', '');
  if (c.length !== 6) return color;
  const r = Math.round(parseInt(c.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(c.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(c.slice(4, 6), 16) * f);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function drawNormal(ctx: Ctx, e: Enemy) {
  const bob = Math.sin(state.time * 6 + e.id) * 1;
  const x = e.pos.x;
  const y = e.pos.y + bob * 0.5;
  ctx.fillStyle = darker(e.def.color, 0.55);
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 9, 18, 18, 3);
  ctx.fill();
  ctx.fillStyle = e.def.color;
  ctx.beginPath();
  ctx.roundRect(x - 7, y - 7, 14, 14, 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.bg0;
  ctx.fillRect(x - 3, y - 2, 2, 3);
  ctx.fillRect(x + 1, y - 2, 2, 3);
  ctx.strokeStyle = PALETTE.bg0;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 9, 18, 18, 3);
  ctx.stroke();
}

function drawFast(ctx: Ctx, e: Enemy) {
  const x = e.pos.x, y = e.pos.y;
  ctx.fillStyle = e.def.color;
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x - 6, y - 7);
  ctx.lineTo(x - 2, y);
  ctx.lineTo(x - 6, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darker(e.def.color, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = withAlpha(e.def.color, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 3); ctx.lineTo(x - 14, y - 3);
  ctx.moveTo(x - 8, y + 3); ctx.lineTo(x - 14, y + 3);
  ctx.stroke();
}

function drawElite(ctx: Ctx, e: Enemy) {
  const x = e.pos.x, y = e.pos.y;
  ctx.fillStyle = darker(e.def.color, 0.5);
  hexPath(ctx, x, y, 15);
  ctx.fill();
  ctx.fillStyle = e.def.color;
  hexPath(ctx, x, y, 12);
  ctx.fill();
  ctx.fillStyle = darker(e.def.color, 0.65);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const sx = x + Math.cos(a) * 14;
    const sy = y + Math.sin(a) * 14;
    const ex = x + Math.cos(a) * 19;
    const ey = y + Math.sin(a) * 19;
    ctx.beginPath();
    ctx.moveTo(sx - Math.sin(a) * 2, sy + Math.cos(a) * 2);
    ctx.lineTo(ex, ey);
    ctx.lineTo(sx + Math.sin(a) * 2, sy - Math.cos(a) * 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.thunderGlow;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darker(e.def.color, 0.3);
  ctx.lineWidth = 1.5;
  hexPath(ctx, x, y, 15);
  ctx.stroke();
}

function drawFlying(ctx: Ctx, e: Enemy) {
  const float = Math.sin(state.time * 3 + e.id) * 2;
  const x = e.pos.x;
  const y = e.pos.y + float - 2;
  const flap = Math.sin(state.time * 8 + e.id) * 0.5 + 1;
  ctx.fillStyle = withAlpha(e.def.color, 0.55);
  ctx.beginPath();
  ctx.ellipse(x - 8, y, 6 * flap, 3, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 8, y, 6 * flap, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.def.color;
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darker(e.def.color, 0.45);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.danger;
  ctx.beginPath();
  ctx.arc(x, y - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDefender(ctx: Ctx, e: Enemy) {
  const x = e.pos.x, y = e.pos.y;
  ctx.fillStyle = darker(e.def.color, 0.55);
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x + 10, y - 7);
  ctx.lineTo(x + 10, y + 5);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x - 10, y + 5);
  ctx.lineTo(x - 10, y - 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = e.def.color;
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 7, y - 5);
  ctx.lineTo(x + 7, y + 3);
  ctx.lineTo(x, y + 9);
  ctx.lineTo(x - 7, y + 3);
  ctx.lineTo(x - 7, y - 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(x - 2, y - 3, 4, 6);
  ctx.strokeStyle = darker(e.def.color, 0.3);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x + 10, y - 7);
  ctx.lineTo(x + 10, y + 5);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x - 10, y + 5);
  ctx.lineTo(x - 10, y - 7);
  ctx.closePath();
  ctx.stroke();
}

function drawSupport(ctx: Ctx, e: Enemy) {
  const x = e.pos.x, y = e.pos.y;
  const pulse = 0.5 + Math.sin(state.time * 2) * 0.2;
  ctx.strokeStyle = withAlpha(e.def.color, pulse);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = darker(e.def.color, 0.5);
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x, y + 11);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = e.def.color;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 7, y);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x - 7, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.textBright;
  ctx.fillRect(x - 3, y - 1, 6, 2);
  ctx.fillRect(x - 1, y - 3, 2, 6);
  ctx.strokeStyle = darker(e.def.color, 0.35);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x, y + 11);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.stroke();
}

function drawBoss(ctx: Ctx, e: Enemy, accent: string) {
  const x = e.pos.x, y = e.pos.y;
  const pulse = Math.sin(state.time * 2) * 0.5;
  ctx.fillStyle = withAlpha(e.def.color, 0.14);
  ctx.beginPath();
  ctx.arc(x, y, 34 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(state.time * 0.3);
  ctx.fillStyle = PALETTE.bg2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.fillRect(Math.cos(a) * 24 - 3, Math.sin(a) * 24 - 3, 6, 6);
  }
  ctx.restore();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = darker(e.def.color, 0.35);
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.def.color;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.bg0;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + Math.sin(state.time * 3) * 1.5, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoss1(ctx: Ctx, e: Enemy) { drawBoss(ctx, e, PALETTE.accentHot); }
function drawBoss2(ctx: Ctx, e: Enemy) { drawBoss(ctx, e, PALETTE.accent); }
function drawBoss3(ctx: Ctx, e: Enemy) { drawBoss(ctx, e, PALETTE.accentCool); }

function drawStatusOverlays(ctx: Ctx, e: Enemy) {
  if (state.time < e.freezeUntil) {
    ctx.save();
    ctx.fillStyle = withAlpha(PALETTE.iceGlow, 0.4);
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.def.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.textBright;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + state.time * 0.5;
      const r = e.def.radius + 4;
      const x = e.pos.x + Math.cos(a) * r;
      const y = e.pos.y + Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y);
      ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (state.time < e.vulnerableUntil) {
    ctx.save();
    ctx.strokeStyle = withAlpha(PALETTE.accent, 0.7);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.def.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHPBar(ctx: Ctx, e: Enemy) {
  const barW = e.def.radius * 2.2;
  const barH = 3;
  const x = e.pos.x - barW / 2;
  const y = e.pos.y - e.def.radius - 9;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);
  ctx.fillStyle = PALETTE.bg2;
  ctx.fillRect(x, y, barW, barH);
  const pct = Math.max(0, e.hp / e.maxHp);
  const color = pct > 0.5 ? PALETTE.hpHigh : pct > 0.25 ? PALETTE.hpMid : PALETTE.hpLow;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, barW * pct, barH);
}

function drawMarks(ctx: Ctx, e: Enemy) {
  const barW = e.def.radius * 2.2;
  const x0 = e.pos.x - barW / 2;
  const y = e.pos.y - e.def.radius - 1;
  for (let i = 0; i < e.marks.length; i++) {
    const m = e.marks[i];
    const color = ELEMENTS[m.element].color;
    const x = x0 + i * 9 + 3;
    ctx.fillStyle = withAlpha(color, 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.bg0;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function hexPath(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 6) + (i * Math.PI) / 3;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

const DRAWERS: Record<string, (ctx: Ctx, e: Enemy) => void> = {
  normal: drawNormal,
  fast: drawFast,
  elite: drawElite,
  flying: drawFlying,
  defender: drawDefender,
  support: drawSupport,
  boss1: drawBoss1,
  boss2: drawBoss2,
  boss3: drawBoss3,
};
