import { state } from './GameState';
import { Renderer, getTowerPickerSlot, uiButtons, nodeCardRects } from '@/render/Renderer';
import { pixelToGrid, PLAY_WIDTH, PLAY_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/Grid';
import { isBuildable } from '@/config/map';
import { Tower } from '@/entities/Tower';
import { TOWERS } from '@/config/towers';
import { updateTowers } from '@/systems/TargetingSystem';
import { updateProjectiles } from '@/systems/ProjectileSystem';
import { updateEnemies, updateGroundZones, updateEffects } from '@/systems/EnemySystem';
import { updateWave, startNextWave, onEnemyKilled, onEnemyReachedEnd, canStartWave, advanceAct } from '@/systems/WaveSystem';
import { recomputeFormations } from '@/systems/FormationSystem';
import { resolveNode } from '@/systems/NodeSystem';

export class Game {
  private renderer: Renderer;
  private lastTime: number = performance.now();
  private running: boolean = true;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.renderer = new Renderer(ctx);
    this.attachInput();
  }

  start() {
    const frame = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      if (!state.paused && !state.gameOver && !state.victory
          && !state.pendingNode && !state.pendingActTransition) {
        this.update(dt);
      }
      this.renderer.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private update(dt: number) {
    state.time += dt;

    updateWave(dt);
    updateEnemies(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateGroundZones(dt);
    updateEffects(dt);

    // Resolve dead and escaped enemies
    for (const e of state.enemies) {
      if (e.dead) onEnemyKilled(e);
      else if (e.reachedEnd) onEnemyReachedEnd(e);
    }
    state.enemies = state.enemies.filter(e => !e.dead && !e.reachedEnd);

    // Cleanup selected tower if sold etc.
    if (state.selectedTower && !state.towers.includes(state.selectedTower)) {
      state.selectedTower = null;
    }
  }

  private attachInput() {
    const rect = () => this.canvas.getBoundingClientRect();

    this.canvas.addEventListener('mousemove', (ev) => {
      const r = rect();
      const scaleX = CANVAS_WIDTH / r.width;
      const scaleY = CANVAS_HEIGHT / r.height;
      const mx = (ev.clientX - r.left) * scaleX;
      const my = (ev.clientY - r.top) * scaleY;
      state.mouseX = mx;
      state.mouseY = my;
      state.mouseInPlayArea = mx >= 0 && mx < PLAY_WIDTH && my >= 0 && my < PLAY_HEIGHT;
    });

    this.canvas.addEventListener('mouseleave', () => {
      state.mouseInPlayArea = false;
    });

    this.canvas.addEventListener('click', (ev) => {
      const r = rect();
      const scaleX = CANVAS_WIDTH / r.width;
      const scaleY = CANVAS_HEIGHT / r.height;
      const mx = (ev.clientX - r.left) * scaleX;
      const my = (ev.clientY - r.top) * scaleY;

      // Node cards take priority when open
      if (state.pendingNode) {
        for (let i = 0; i < nodeCardRects.length; i++) {
          const card = nodeCardRects[i];
          if (mx >= card.x && mx <= card.x + card.w && my >= card.y && my <= card.y + card.h) {
            resolveNode(state.pendingNode.options[i]);
            return;
          }
        }
        return;
      }

      // Act-transition overlay: only the "continue" button is clickable
      if (state.pendingActTransition) {
        const btn = uiButtons.continueAct;
        if (btn && mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          advanceAct();
        }
        return;
      }

      if (mx < PLAY_WIDTH) {
        this.handlePlayAreaClick(mx, my);
      } else {
        this.handleSidebarClick(mx, my);
      }
    });

    this.canvas.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      state.selectedTowerToPlace = null;
      state.selectedTower = null;
    });

    window.addEventListener('keydown', (ev) => {
      if (ev.code === 'Space') {
        ev.preventDefault();
        // Node always takes priority — Space shouldn't bypass a pending reward choice.
        if (state.pendingNode) return;
        if (state.pendingActTransition) advanceAct();
        else if (canStartWave()) startNextWave();
        else state.paused = !state.paused;
      }
      if (ev.code === 'Escape') {
        state.selectedTowerToPlace = null;
        state.selectedTower = null;
      }
      const digit = Number(ev.key);
      if (!isNaN(digit) && digit >= 1 && digit <= 8) {
        const ids = ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma'] as const;
        state.selectedTowerToPlace = ids[digit - 1];
        state.selectedTower = null;
      }
    });
  }

  private handlePlayAreaClick(mx: number, my: number) {
    const gp = pixelToGrid(mx, my);

    // If placing a tower: try to build
    if (state.selectedTowerToPlace) {
      const def = TOWERS[state.selectedTowerToPlace];
      if (!isBuildable(gp.gx, gp.gy)) return;
      if (state.towers.some(t => t.grid.gx === gp.gx && t.grid.gy === gp.gy)) return;
      if (state.gold < def.cost) return;
      state.gold -= def.cost;
      const tower = new Tower(state.selectedTowerToPlace, gp);
      state.towers.push(tower);
      recomputeFormations();
      // Shift-click keeps the tower selected for rapid placement
      // For MVP: deselect after placement
      state.selectedTowerToPlace = null;
      return;
    }

    // Otherwise: select a tower under cursor
    const clicked = state.towers.find(t => t.grid.gx === gp.gx && t.grid.gy === gp.gy);
    state.selectedTower = clicked ?? null;
  }

  private handleSidebarClick(mx: number, my: number) {
    // Tower picker
    const pick = getTowerPickerSlot(mx, my);
    if (pick) {
      const def = TOWERS[pick];
      if (state.gold >= def.cost) {
        state.selectedTowerToPlace = pick;
        state.selectedTower = null;
      }
      return;
    }

    // Upgrade / sell / start-wave
    const b = uiButtons;
    if (b.upgrade && within(mx, my, b.upgrade)) {
      const t = state.selectedTower;
      if (t && t.upgradeCost() !== null) {
        if (state.upgradeVouchers > 0) {
          state.upgradeVouchers -= 1;
          t.upgrade(true);
        } else if (state.gold >= b.upgrade.cost) {
          state.gold -= b.upgrade.cost;
          t.upgrade();
        }
      }
      return;
    }
    if (b.sell && within(mx, my, b.sell)) {
      const t = state.selectedTower;
      if (t) {
        state.gold += b.sell.value;
        state.towers = state.towers.filter(x => x !== t);
        state.selectedTower = null;
        recomputeFormations();
      }
      return;
    }
    if (b.startWave && within(mx, my, b.startWave)) {
      if (canStartWave()) startNextWave();
      return;
    }
  }
}

function within(x: number, y: number, r: { x: number; y: number; w: number; h: number }) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

