import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, px } from '@/constants';
import { PALETTE, brighten } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { audio } from '@/managers/AudioManager';

/**
 * Modal pause overlay launched on top of GameScene.
 * GameScene is paused via scene.pause() in the caller; PauseScene resumes it
 * on close. Settings opens as a nested overlay on top of PauseScene.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Pause);
  }

  create() {
    // Backdrop — slightly transparent so the paused field is hinted underneath.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0), 0.65).setOrigin(0);

    // Panel
    const panelW = px(440);
    const panelH = px(380);
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;
    this.add.rectangle(panelX, panelY, panelW, panelH, hexColor(PALETTE.bg2)).setOrigin(0)
      .setStrokeStyle(2, hexColor(PALETTE.accentCool));

    this.add.text(panelX + panelW / 2, panelY + px(44), '已暂停', {
      fontFamily: 'sans-serif', fontSize: '36px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, PALETTE.accentCool, 12, true, true);

    this.add.text(panelX + panelW / 2, panelY + px(84), '按 P 或 ESC 继续', {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textFaint,
    }).setOrigin(0.5);

    const cx = panelX + panelW / 2;
    const btnW = px(280);
    const btnH = px(44);
    let by = panelY + px(124);
    const gap = px(56);

    this.button(cx, by, '继续游戏', btnW, btnH, PALETTE.btnStart, () => this.resume());
    by += gap;
    this.button(cx, by, '重玩本关', btnW, btnH, PALETTE.btnUpgrade, () => this.restart());
    by += gap;
    this.button(cx, by, '设置', btnW, btnH, PALETTE.bg3, () => {
      this.scene.launch(SCENES.Settings, { returnTo: SCENES.Pause });
    });
    by += gap;
    this.button(cx, by, '返回章节列表', btnW, btnH, PALETTE.btnSell, () => this.exitToChapter());

    this.input.keyboard?.on('keydown-P',   () => this.resume());
    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private resume() {
    this.scene.resume(SCENES.Game);
    this.scene.stop();
  }

  private restart() {
    this.scene.stop(SCENES.Game);
    this.scene.stop();
    this.scene.start(SCENES.Game);
  }

  private exitToChapter() {
    this.scene.stop(SCENES.Game);
    this.scene.stop();
    this.scene.start(SCENES.Chapter);
  }

  private button(x: number, y: number, label: string, w: number, h: number, color: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(color)).setOrigin(0.5);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(hexColor(brighten(color))));
    bg.on('pointerout',  () => bg.setFillStyle(hexColor(color)));
    bg.on('pointerdown', () => {
      audio.playSfx('sfx_click');
      onClick();
    });
  }
}
