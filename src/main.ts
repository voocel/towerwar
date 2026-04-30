import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DPR } from '@/constants';

// ── HiDPI auto-patches ─────────────────────────────────────────────────
// Strategy: game.config dimensions are already DPR-scaled (constants.ts),
// so canvas internal buffer = physical pixels. Phaser's Scale.FIT shrinks
// it to viewport via CSS — net effect: native-pixel rendering, no GPU
// upscaling, no blur. To keep the *visual* layout identical to before
// scaling, every literal pixel value also needs ×DPR. We patch the two
// hot APIs so business code stays clean:
//   • GameObjectFactory.text → style.fontSize ×DPR + setResolution(DPR)
//   • Shape.prototype.setStrokeStyle → lineWidth ×DPR
const factoryProto = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
  text(x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text;
};
const origText = factoryProto.text;
factoryProto.text = function (this: Phaser.GameObjects.GameObjectFactory, x, y, text, style) {
  const adj = scaleFontSize(style);
  const t = origText.call(this, x, y, text, adj);
  t.setResolution(DPR);
  return t;
};

function scaleFontSize(style?: Phaser.Types.GameObjects.Text.TextStyle): Phaser.Types.GameObjects.Text.TextStyle | undefined {
  if (!style || !style.fontSize) return style;
  const fs = style.fontSize;
  if (typeof fs === 'number') return { ...style, fontSize: fs * DPR };
  if (typeof fs === 'string') {
    const m = /^(\d+(?:\.\d+)?)\s*px$/.exec(fs);
    if (m) return { ...style, fontSize: `${parseFloat(m[1]) * DPR}px` };
  }
  return style;
}

// Shape.setStrokeStyle(lineWidth, color, alpha) — patch line width.
const shapeProto = Phaser.GameObjects.Shape.prototype as unknown as {
  setStrokeStyle(lineWidth?: number, color?: number, alpha?: number): Phaser.GameObjects.Shape;
};
const origStroke = shapeProto.setStrokeStyle;
shapeProto.setStrokeStyle = function (lineWidth, color, alpha) {
  return origStroke.call(this, (lineWidth ?? 1) * DPR, color, alpha);
};

// Graphics.lineStyle(width, color, alpha) — same idea.
const gfxProto = Phaser.GameObjects.Graphics.prototype as unknown as {
  lineStyle(lineWidth: number, color?: number, alpha?: number): Phaser.GameObjects.Graphics;
};
const origLineStyle = gfxProto.lineStyle;
gfxProto.lineStyle = function (lineWidth, color, alpha) {
  return origLineStyle.call(this, lineWidth * DPR, color, alpha);
};

// ── scenes ──────────────────────────────────────────────────────────────
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { TitleScene } from '@/scenes/TitleScene';
import { ChapterScene } from '@/scenes/ChapterScene';
import { GameScene } from '@/scenes/GameScene';
import { PauseScene } from '@/scenes/PauseScene';
import { ResultScene } from '@/scenes/ResultScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { RelicScene } from '@/scenes/RelicScene';
import { StoreScene } from '@/scenes/StoreScene';
import { TalentScene } from '@/scenes/TalentScene';
import { audio } from '@/managers/AudioManager';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,    // already DPR-scaled
  height: GAME_HEIGHT,
  backgroundColor: '#0a0c10',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [
    BootScene, PreloadScene, TitleScene,
    ChapterScene, GameScene,
    PauseScene, ResultScene, SettingsScene, RelicScene,
    StoreScene, TalentScene,
  ],
};

const game = new Phaser.Game(config);
audio.init(game);

(window as unknown as { __game: Phaser.Game }).__game = game;
