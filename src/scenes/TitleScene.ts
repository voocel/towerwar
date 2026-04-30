import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, px } from '@/constants';
import { PALETTE } from '@/theme';
import { audio } from '@/managers/AudioManager';
import type { ChapterId } from '@/data/chapters';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Title);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Title — large rose-gold text
    this.add
      .text(cx, cy - px(120), 'TOWERWAR', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        color: PALETTE.textBright,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, PALETTE.accentRose, 12, true, true);

    this.add
      .text(cx, cy - px(60), '元素反应 · 塔防 · 章节制', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: PALETTE.accentCool,
      })
      .setOrigin(0.5);

    // Buttons
    const unlocked = (this.registry.get(REGISTRY_KEYS.unlockedChapters) as ChapterId[] | undefined) ?? [];
    const stars = (this.registry.get(REGISTRY_KEYS.starsByChapter) as Record<string, number> | undefined) ?? {};
    const stardust = (this.registry.get(REGISTRY_KEYS.stardust) as number | undefined) ?? 0;
    const hasProgress = unlocked.length > 1 || Object.keys(stars).length > 0 || stardust > 0;

    if (hasProgress) {
      this.button(cx, cy + px(30), '继续游戏', () => this.scene.start(SCENES.Chapter));
      this.button(cx, cy + px(90), '从头开始', () => this.scene.start(SCENES.Chapter));
    } else {
      this.button(cx, cy + px(60), '开始游戏', () => this.scene.start(SCENES.Chapter));
    }

    this.button(cx, cy + px(160), '设置', () => {
      this.scene.launch(SCENES.Settings, { returnTo: SCENES.Title });
    });

    // Footer
    this.add
      .text(cx, GAME_HEIGHT - px(18), 'v0.2 · Phaser 4 重构版', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: PALETTE.textFaint,
      })
      .setOrigin(0.5);
  }

  private button(x: number, y: number, label: string, onClick: () => void) {
    const w = px(240);
    const h = px(44);
    const bg = this.add.rectangle(x, y, w, h, hex(PALETTE.btnStart));
    bg.setStrokeStyle(1, hex(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: PALETTE.textBright,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(hex(PALETTE.btnStartHot));
      bg.setStrokeStyle(2, hex(PALETTE.accentMint));
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(hex(PALETTE.btnStart));
      bg.setStrokeStyle(1, hex(PALETTE.divider));
    });
    bg.on('pointerdown', () => {
      audio.playSfx('sfx_click');
      onClick();
    });
    void text;
  }
}

function hex(s: string): number {
  return parseInt(s.slice(1, 7), 16);
}
