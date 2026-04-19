import { Game } from '@/game/Game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/Grid';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
if (!canvas) throw new Error('Canvas #game-canvas not found');

// HiDPI: set internal buffer to physical-pixel size, keep CSS size at logical size.
// The 2D context is pre-scaled so all draw calls use logical coordinates.
const dpr = window.devicePixelRatio || 1;
canvas.width = CANVAS_WIDTH * dpr;
canvas.height = CANVAS_HEIGHT * dpr;
canvas.style.width = CANVAS_WIDTH + 'px';
canvas.style.height = CANVAS_HEIGHT + 'px';
const ctx = canvas.getContext('2d');
if (ctx) ctx.scale(dpr, dpr);

const game = new Game(canvas);
game.start();

(window as any).__game = game;
