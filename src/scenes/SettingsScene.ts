import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, px } from '@/constants';
import { PALETTE } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { getSettings, setSetting } from '@/systems/SaveSystem';
import { audio } from '@/managers/AudioManager';
import type { Settings, SettingKey } from '@/systems/SaveSystem';

interface SettingsPayload {
  returnTo: string;
}

interface ToggleRow {
  key: SettingKey;
  label: string;
  hint: string;
}

const ROWS: ToggleRow[] = [
  { key: 'sfx',   label: '音效',     hint: '塔射击 / 命中 / 反应触发音' },
  { key: 'bgm',   label: 'BGM',     hint: '关卡背景音乐' },
  { key: 'shake', label: '震屏',     hint: 'BOSS 出场 / 大型反应屏幕震动' },
];

/**
 * Modal settings panel. Pauses the caller scene so input doesn't leak through.
 */
export class SettingsScene extends Phaser.Scene {
  private payload!: SettingsPayload;

  constructor() {
    super(SCENES.Settings);
  }

  init(data: SettingsPayload) {
    this.payload = data;
  }

  create() {
    // Pause the caller so its input doesn't fire under us.
    this.scene.pause(this.payload.returnTo);

    // Dimmed backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0), 0.78).setOrigin(0);

    // Panel
    const panelW = px(520);
    const panelH = px(440);
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;
    this.add.rectangle(panelX, panelY, panelW, panelH, hexColor(PALETTE.bg2)).setOrigin(0)
      .setStrokeStyle(2, hexColor(PALETTE.accentRose));

    this.add.text(panelX + panelW / 2, panelY + px(36), '设置', {
      fontFamily: 'sans-serif', fontSize: '32px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, PALETTE.accentRose, 12, true, true);

    this.add.text(panelX + panelW / 2, panelY + px(72), '本地保存,刷新页面后保留', {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textFaint,
    }).setOrigin(0.5);

    let rowY = panelY + px(110);
    for (const row of ROWS) {
      this.makeRow(panelX + px(32), rowY, panelW - px(64), row);
      rowY += px(76);
    }

    this.button(
      panelX + panelW / 2, panelY + panelH - px(38),
      '返回', px(200), px(40), PALETTE.btnUpgrade,
      () => this.close(),
    );

    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private close() {
    this.scene.resume(this.payload.returnTo);
    this.scene.stop();
  }

  private makeRow(x: number, y: number, w: number, row: ToggleRow) {
    const settings = getSettings(this.registry);

    this.add.text(x, y, row.label, {
      fontFamily: 'sans-serif', fontSize: '18px', color: PALETTE.textBright, fontStyle: 'bold',
    });
    this.add.text(x, y + px(24), row.hint, {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textDim,
    });

    // Toggle pill (right-aligned)
    const pillW = px(64), pillH = px(28);
    const pillX = x + w - pillW;
    const pillY = y + px(8);

    const pill = this.add.rectangle(pillX, pillY, pillW, pillH, 0).setOrigin(0, 0);
    pill.setStrokeStyle(2, hexColor(PALETTE.divider));

    const knobR = px(11);
    const knobInset = px(4);
    const knob = this.add.circle(0, pillY + pillH / 2, knobR, 0).setOrigin(0.5);

    const stateLabel = this.add.text(pillX + pillW + px(14), pillY + pillH / 2, '', {
      fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const paint = (on: boolean) => {
      pill.setFillStyle(hexColor(on ? PALETTE.btnUpgrade : PALETTE.bg3));
      pill.setStrokeStyle(2, hexColor(on ? PALETTE.accentMint : PALETTE.divider));
      knob.setPosition(on ? pillX + pillW - knobR - knobInset : pillX + knobR + knobInset, pillY + pillH / 2);
      knob.setFillStyle(hexColor(on ? PALETTE.textBright : PALETTE.textDim));
      stateLabel.setText(on ? '开' : '关').setColor(on ? PALETTE.accentMint : PALETTE.textFaint);
    };
    paint(settings[row.key]);

    pill.setInteractive({ useHandCursor: true });
    pill.on('pointerdown', () => {
      const cur = getSettings(this.registry)[row.key];
      const next = !cur as Settings[SettingKey];
      setSetting(this.registry, row.key, next);
      paint(next);
      // play AFTER setSetting so a fresh sfx-on click is audible immediately
      audio.playSfx('sfx_click');
    });
  }

  private button(x: number, y: number, label: string, w: number, h: number, color: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(color)).setOrigin(0.5);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(hexColor(PALETTE.btnUpgradeHot)));
    bg.on('pointerout',  () => bg.setFillStyle(hexColor(color)));
    bg.on('pointerdown', () => {
      audio.playSfx('sfx_click');
      onClick();
    });
  }
}
