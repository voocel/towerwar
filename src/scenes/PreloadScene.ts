import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, px } from '@/constants';
import { PALETTE } from '@/theme';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Preload);
  }

  preload() {
    this.drawProgressBar();

    // SVG textures are rasterised once at load time. To stay sharp on Retina
    // we hint Phaser to bake the texture at logical * dpr px, matching the
    // canvas's physical-pixel buffer set up in constants.ts.

    // 8 tower sprites (AI-generated PNG, transparent background)
    for (const id of ['spark', 'lava', 'frost', 'blizzard', 'arc', 'magstorm', 'toxin', 'miasma']) {
      this.load.image(`tower_${id}`, `/assets/towers/${id}.png`);
    }
    // 11 enemy sprites (AI-generated PNG, transparent background)
    for (const id of ['normal', 'fast', 'elite', 'flying', 'defender', 'support', 'boss1', 'boss2', 'boss3', 'boss4', 'boss5']) {
      this.load.image(`enemy_${id}`, `/assets/enemies/${id}.png`);
    }
    // 5 chapter backgrounds + thumbs. Raster backgrounds are terrain-only;
    // the actual route is still drawn procedurally by GameScene.
    const rasterBackgrounds = new Set(['ch1_meadow', 'ch2_forest', 'ch3_tundra', 'ch4_volcano', 'ch5_void']);
    for (const id of ['ch1_meadow', 'ch2_forest', 'ch3_tundra', 'ch4_volcano', 'ch5_void']) {
      if (rasterBackgrounds.has(id)) {
        this.load.image(`map_${id}_bg`, `/assets/maps/${id}_bg_gptroad.png`);
      } else {
        this.load.svg(`map_${id}_bg`, `/assets/maps/${id}_bg.svg`, { width: px(1280), height: px(720) });
      }
      this.load.svg(`map_${id}_thumb`, `/assets/maps/${id}_thumb.svg`, { width: px(480),  height: px(270) });
    }
    // 4 element marks
    for (const id of ['fire', 'ice', 'thunder', 'poison']) {
      this.load.image(`mark_${id}`, `/assets/marks/${id}.png`);
    }
    // skill icons
    for (const id of ['meteor', 'frostnova', 'lightning']) {
      this.load.image(`skill_${id}`, `/assets/skills/${id}_icon.png`);
    }
    // UI icons for later HUD/result polish.
    for (const id of ['coin', 'heart', 'star_filled', 'star_empty', 'stardust']) {
      this.load.image(`ui_${id}`, `/assets/ui/${id}.png`);
    }

    // Tolerate missing files (placeholder set may be incomplete in dev).
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('[preload] missing asset, ok during placeholder phase:', file.key);
    });
  }

  create() {
    this.scene.start(SCENES.Title);
  }

  private drawProgressBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const w = px(360);
    const h = px(14);

    this.add
      .text(cx, cy - px(50), 'TOWERWAR', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: PALETTE.textBright,
      })
      .setOrigin(0.5);

    const frame = this.add.rectangle(cx, cy, w, h, 0x000000, 0).setStrokeStyle(1, 0x2a303a);
    const fill = this.add.rectangle(cx - w / 2 + px(2), cy, 0, h - px(4), hex(PALETTE.accentRose));
    fill.setOrigin(0, 0.5);

    const label = this.add
      .text(cx, cy + px(30), '正在加载… 0%', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: PALETTE.textDim,
      })
      .setOrigin(0.5);

    this.load.on('progress', (p: number) => {
      fill.width = (w - px(4)) * p;
      label.setText(`正在加载… ${Math.round(p * 100)}%`);
    });
    this.load.on('complete', () => {
      label.setText('加载完成');
      void frame;
    });
  }
}

function hex(s: string): number {
  // '#abcdef' or '#abcdef??' → 0xabcdef
  return parseInt(s.slice(1, 7), 16);
}
