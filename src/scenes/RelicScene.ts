import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, px } from '@/constants';
import { PALETTE } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { audio } from '@/managers/AudioManager';
import type { NodeOption } from '@/types';
import type { GameScene } from './GameScene';

interface RelicPayload {
  options: NodeOption[];
}

/**
 * Modal three-card pick. Game is paused by the caller; we resume + stop on
 * selection. Selection is applied via GameScene.resolveNode(option).
 */
export class RelicScene extends Phaser.Scene {
  private payload!: RelicPayload;

  constructor() {
    super(SCENES.Relic);
  }

  init(data: RelicPayload) {
    this.payload = data;
  }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0), 0.7).setOrigin(0);

    this.add.text(GAME_WIDTH / 2, px(100), '战利品 · 三选一', {
      fontFamily: 'sans-serif', fontSize: '36px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, PALETTE.accentRose, 14, true, true);

    this.add.text(GAME_WIDTH / 2, px(142), '本波结束的奖励 — 任选其一', {
      fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.textDim,
    }).setOrigin(0.5);

    const cardW = px(280);
    const cardH = px(380);
    const gap = px(36);
    const totalW = cardW * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalW) / 2;
    const cardY = (GAME_HEIGHT - cardH) / 2 + px(40);

    for (let i = 0; i < this.payload.options.length; i++) {
      const opt = this.payload.options[i];
      const x = startX + i * (cardW + gap);
      this.makeCard(x, cardY, cardW, cardH, opt);
    }
  }

  private makeCard(x: number, y: number, w: number, h: number, opt: NodeOption) {
    const accent = opt.type === 'relic' ? PALETTE.accentRose : PALETTE.accent;

    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0);
    bg.setStrokeStyle(2, hexColor(accent));
    bg.setInteractive({ useHandCursor: true });

    // Icon (big emoji-ish)
    this.add.text(x + w / 2, y + px(90), opt.icon, {
      fontFamily: 'sans-serif', fontSize: '88px',
    }).setOrigin(0.5);

    // Label
    this.add.text(x + w / 2, y + px(200), opt.label, {
      fontFamily: 'sans-serif', fontSize: '22px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Type tag
    const tag = opt.type === 'relic' ? '永久遗物 · 本局有效' : '即时收益';
    this.add.text(x + w / 2, y + px(232), tag, {
      fontFamily: 'sans-serif', fontSize: '11px', color: accent,
    }).setOrigin(0.5);

    // Description (wrapped)
    this.add.text(x + px(24), y + px(270), opt.description, {
      fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.text,
      wordWrap: { width: w - px(48) }, align: 'center',
    }).setOrigin(0, 0).setFixedSize(w - px(48), px(70));

    // Hover affordance
    bg.on('pointerover', () => bg.setFillStyle(hexColor(PALETTE.bg3)));
    bg.on('pointerout',  () => bg.setFillStyle(hexColor(PALETTE.bg2)));
    bg.on('pointerdown', () => this.choose(opt));
  }

  private choose(opt: NodeOption) {
    audio.playSfx('sfx_click');
    const game = this.scene.get(SCENES.Game) as GameScene;
    game.resolveNode(opt);
    this.scene.resume(SCENES.Game);
    this.scene.stop();
  }
}
