import { PLAY_WIDTH, PLAY_HEIGHT, CELL_SIZE, GRID_COLS, GRID_ROWS, gridToPixel } from '@/utils/Grid';
import { getWaypoints, isPathCell } from '@/config/map';
import { state } from '@/game/GameState';
import { PALETTE, withAlpha } from '@/theme';

type Ctx = CanvasRenderingContext2D;

let bgCache: HTMLCanvasElement | null = null;

export function resetBackgroundCache() {
  bgCache = null;
}

function isPathCellPx(px: number, py: number): boolean {
  const gx = Math.floor(px / CELL_SIZE);
  const gy = Math.floor(py / CELL_SIZE);
  return isPathCell(gx, gy);
}

function buildBackgroundCache(): HTMLCanvasElement {
  const dpr = window.devicePixelRatio || 1;
  const off = document.createElement('canvas');
  off.width = Math.ceil(PLAY_WIDTH * dpr);
  off.height = Math.ceil(PLAY_HEIGHT * dpr);
  const ctx = off.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Seeded-feel random so rebuilds look similar-ish (using Math.random is fine since cache is built once)
  drawGrass(ctx);
  drawDirtPath(ctx);
  drawGrassTuftsAndFlowers(ctx);    // after path so tufts can hug path edges
  drawPathOutline(ctx);
  drawEndcaps(ctx);
  drawVignette(ctx);

  return off;
}

function drawGrass(ctx: Ctx) {
  // Base grass
  ctx.fillStyle = PALETTE.grassBase;
  ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

  // Light sun patches (big soft radial blobs)
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * PLAY_WIDTH;
    const y = Math.random() * PLAY_HEIGHT;
    const r = 50 + Math.random() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(PALETTE.grassLight, 0.22));
    g.addColorStop(1, withAlpha(PALETTE.grassLight, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shadow patches (darker irregular blobs)
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * PLAY_WIDTH;
    const y = Math.random() * PLAY_HEIGHT;
    const r = 40 + Math.random() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(PALETTE.grassDark, 0.32));
    g.addColorStop(1, withAlpha(PALETTE.grassDark, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine noise — tiny color specks to break the flat feel
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * PLAY_WIDTH;
    const y = Math.random() * PLAY_HEIGHT;
    const roll = Math.random();
    ctx.fillStyle = roll < 0.4 ? withAlpha(PALETTE.grassLight, 0.35)
                   : roll < 0.75 ? withAlpha(PALETTE.grassDark, 0.35)
                   : withAlpha(PALETTE.grassBlade, 0.2);
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawGrassTuftsAndFlowers(ctx: Ctx) {
  // Tiny grass blades — skip path cells
  ctx.strokeStyle = PALETTE.grassBlade;
  ctx.lineWidth = 1;
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * PLAY_WIDTH;
    const y = Math.random() * PLAY_HEIGHT;
    if (isPathCellPx(x, y)) continue;
    if (isPathCellPx(x - 2, y)) continue;  // avoid hugging right against path
    if (isPathCellPx(x + 2, y)) continue;
    const h = 2 + Math.random() * 2;
    const lean = (Math.random() - 0.5) * 2;
    ctx.globalAlpha = 0.55 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean, y - h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sparse flower specks (warm yellow + occasional white)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * PLAY_WIDTH;
    const y = Math.random() * PLAY_HEIGHT;
    if (isPathCellPx(x, y)) continue;
    ctx.fillStyle = Math.random() < 0.7 ? PALETTE.grassFlower : '#e0d4b0';
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawDirtPath(ctx: Ctx) {
  // Drop shadow outside the path (darker strip under edges)
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000';
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (!isPathCell(x, y)) continue;
      ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 2, CELL_SIZE, CELL_SIZE);
    }
  }
  ctx.restore();

  // Dirt base
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (!isPathCell(x, y)) continue;
      const g = ctx.createLinearGradient(
        x * CELL_SIZE, y * CELL_SIZE,
        x * CELL_SIZE, (y + 1) * CELL_SIZE,
      );
      g.addColorStop(0, PALETTE.pathTop);
      g.addColorStop(0.5, PALETTE.pathDirt);
      g.addColorStop(1, PALETTE.pathDirtDark);
      ctx.fillStyle = g;
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // Dirt texture noise (pebbles/specks, 3 colors)
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * PLAY_WIDTH;
    const y = Math.random() * PLAY_HEIGHT;
    if (!isPathCellPx(x, y)) continue;
    const roll = Math.random();
    ctx.fillStyle = roll < 0.45 ? withAlpha(PALETTE.pathDirtLight, 0.5)
                   : roll < 0.8 ? withAlpha(PALETTE.pathDirtDark, 0.6)
                   : withAlpha('#3a2a14', 0.7);
    ctx.fillRect(x, y, 1, 1);
  }

  // Wheel ruts — two faint parallel lighter streaks along the path
  drawRuts(ctx, 0.28);
  drawRuts(ctx, -0.28);
}

function drawRuts(ctx: Ctx, offset: number) {
  // Along each segment, draw a faint parallel line offset perpendicular to segment direction
  ctx.save();
  ctx.strokeStyle = withAlpha(PALETTE.pathRut, 0.32);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let first = true;
  const wps = getWaypoints();
  for (let i = 0; i < wps.length - 1; i++) {
    const a = gridToPixel(wps[i].gx, wps[i].gy);
    const b = gridToPixel(wps[i + 1].gx, wps[i + 1].gy);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const off = offset * (CELL_SIZE * 0.5);
    const ax = a.x + nx * off;
    const ay = a.y + ny * off;
    const bx = b.x + nx * off;
    const by = b.y + ny * off;
    if (first) { ctx.moveTo(ax, ay); first = false; }
    else ctx.lineTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPathOutline(ctx: Ctx) {
  ctx.strokeStyle = PALETTE.pathDirtDark;
  ctx.lineWidth = 1.5;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (!isPathCell(x, y)) continue;
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;
      if (!isPathCell(x, y - 1)) { ctx.beginPath(); ctx.moveTo(px, py + 0.5); ctx.lineTo(px + CELL_SIZE, py + 0.5); ctx.stroke(); }
      if (!isPathCell(x, y + 1)) { ctx.beginPath(); ctx.moveTo(px, py + CELL_SIZE - 0.5); ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE - 0.5); ctx.stroke(); }
      if (!isPathCell(x - 1, y)) { ctx.beginPath(); ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + CELL_SIZE); ctx.stroke(); }
      if (!isPathCell(x + 1, y)) { ctx.beginPath(); ctx.moveTo(px + CELL_SIZE - 0.5, py); ctx.lineTo(px + CELL_SIZE - 0.5, py + CELL_SIZE); ctx.stroke(); }
    }
  }
}

function drawEndcaps(ctx: Ctx) {
  const wps = getWaypoints();
  const spawn = wps[0];
  const exit = wps[wps.length - 1];
  const sp = gridToPixel(spawn.gx, spawn.gy);
  const ep = gridToPixel(exit.gx, exit.gy);
  drawCap(ctx, sp.x, sp.y, PALETTE.spawnMark);
  drawCap(ctx, ep.x, ep.y, PALETTE.exitMark);
}

function drawCap(ctx: Ctx, x: number, y: number, color: string) {
  ctx.fillStyle = withAlpha(color, 0.22);
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha(color, 0.9);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawVignette(ctx: Ctx) {
  const vign = ctx.createRadialGradient(
    PLAY_WIDTH / 2, PLAY_HEIGHT / 2, PLAY_WIDTH * 0.45,
    PLAY_WIDTH / 2, PLAY_HEIGHT / 2, PLAY_WIDTH * 0.9,
  );
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(10,15,8,0.42)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
}

export function drawBackground(ctx: Ctx) {
  if (!bgCache) bgCache = buildBackgroundCache();
  ctx.drawImage(bgCache, 0, 0, PLAY_WIDTH, PLAY_HEIGHT);

  // Ambient pulse on spawn marker (portal shimmer)
  const pulse = 0.7 + Math.sin(state.time * 3) * 0.3;
  const spawn = getWaypoints()[0];
  const sp = gridToPixel(spawn.gx, spawn.gy);
  ctx.save();
  ctx.fillStyle = withAlpha(PALETTE.spawnMark, 0.24 * pulse);
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 14 + pulse * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawPathArrows(ctx);
}

function drawPathArrows(ctx: Ctx) {
  const dash = state.time * 22;
  ctx.save();
  ctx.strokeStyle = PALETTE.pathArrow;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.setLineDash([5, 11]);
  ctx.lineDashOffset = -dash;
  ctx.beginPath();
  let first = true;
  for (const wp of getWaypoints()) {
    const p = gridToPixel(wp.gx, wp.gy);
    if (first) { ctx.moveTo(p.x, p.y); first = false; }
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
}
