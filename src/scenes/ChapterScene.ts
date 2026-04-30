import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, px } from '@/constants';
import { PALETTE } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { CHAPTER_ORDER, CHAPTERS, type ChapterId } from '@/data/chapters';

export class ChapterScene extends Phaser.Scene {
  private stardustLabel?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.Chapter);
  }

  create() {
    // Backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0)).setOrigin(0);

    this.drawTopBar();

    this.add.text(GAME_WIDTH / 2, px(56), '章节选择', {
      fontFamily: 'sans-serif', fontSize: '36px',
      color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, PALETTE.accentRose, 8, true, true);

    this.add.text(GAME_WIDTH / 2, px(96), '选择一个章节直接开战', {
      fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.textDim,
    }).setOrigin(0.5);

    // Modal scenes (Store/Talent/Settings) pause this scene; on resume we
    // re-render the stardust label so any purchase delta is reflected.
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.refreshStardust());

    // 5 cards in a row
    const cardW = px(200);
    const cardH = px(360);
    const gap = px(20);
    const totalW = cardW * 5 + gap * 4;
    const startX = (GAME_WIDTH - totalW) / 2;
    const cardY = px(150);

    for (let i = 0; i < CHAPTER_ORDER.length; i++) {
      const id = CHAPTER_ORDER[i];
      const cx = startX + i * (cardW + gap);
      this.makeChapterCard(id, cx, cardY, cardW, cardH);
    }

    // Back to title
    this.button(GAME_WIDTH / 2, GAME_HEIGHT - px(36), '← 返回标题', px(180), px(36), () => {
      this.scene.start(SCENES.Title);
    });
  }

  private makeChapterCard(id: ChapterId, x: number, y: number, w: number, h: number) {
    const ch = CHAPTERS[id];
    const unlocked = this.isChapterUnlocked(id);
    const stars = this.chapterStars(id);
    const totalStars = 3;

    // Card background
    const bg = this.add.rectangle(x, y, w, h, hexColor(unlocked ? PALETTE.bg2 : PALETTE.bg1)).setOrigin(0);
    bg.setStrokeStyle(2, hexColor(unlocked ? ch.accent : PALETTE.divider), unlocked ? 0.9 : 0.4);

    // Theme tile (stylized field background)
    const tileH = px(130);
    const pad = px(8);
    const cellStep = px(16);
    const tile = this.add.graphics();
    tile.fillStyle(hexColor(ch.fieldBase), unlocked ? 1 : 0.5);
    tile.fillRect(x + pad, y + pad, w - pad * 2, tileH);
    // Faint grid overlay so it reads as the play-field
    tile.lineStyle(1, hexColor(ch.fieldGrid), unlocked ? 0.5 : 0.2);
    for (let gx = pad; gx <= w - pad; gx += cellStep) tile.lineBetween(x + gx, y + pad, x + gx, y + pad + tileH);
    for (let gy = pad; gy <= tileH; gy += cellStep) tile.lineBetween(x + pad, y + gy, x + w - pad, y + gy);

    // Chapter index badge
    const badge = this.add.circle(x + px(28), y + px(28), px(18), hexColor(ch.accent), unlocked ? 1 : 0.4);
    badge.setStrokeStyle(2, 0xffffff, unlocked ? 0.7 : 0.3);
    this.add.text(x + px(28), y + px(28), `${ch.index}`, {
      fontFamily: 'sans-serif', fontSize: '16px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(unlocked ? 1 : 0.5);

    // Name + subtitle
    this.add.text(x + px(16), y + pad + tileH + px(12), ch.name, {
      fontFamily: 'sans-serif', fontSize: '20px',
      color: unlocked ? PALETTE.textBright : PALETTE.textDim,
      fontStyle: 'bold',
    });
    this.add.text(x + px(16), y + pad + tileH + px(38), ch.subtitle, {
      fontFamily: 'sans-serif', fontSize: '11px',
      color: unlocked ? PALETTE.text : PALETTE.textFaint,
    });

    // BOSS line
    this.add.text(x + px(16), y + pad + tileH + px(64), `BOSS · ${ch.bossLabel}`, {
      fontFamily: 'sans-serif', fontSize: '11px',
      color: unlocked ? PALETTE.accentRose : PALETTE.textFaint,
    });

    // Star progress
    this.add.text(x + px(16), y + h - px(76), `★ ${stars} / ${totalStars}`, {
      fontFamily: 'sans-serif', fontSize: '12px',
      color: unlocked ? PALETTE.accent : PALETTE.textFaint,
    });

    // Locked overlay
    if (!unlocked) {
      this.add.rectangle(x, y, w, h, 0x000000, 0.45).setOrigin(0);
      this.add.text(x + w / 2, y + h / 2, '🔒\n通关上一章解锁', {
        fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.textDim, align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // Enter button
    const btn = this.add.rectangle(x + w / 2, y + h - px(36), w - px(32), px(36), hexColor(PALETTE.btnUpgrade)).setOrigin(0.5);
    btn.setStrokeStyle(1, hexColor(ch.accent));
    btn.setInteractive({ useHandCursor: true });
    this.add.text(x + w / 2, y + h - px(36), '进入', {
      fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(hexColor(PALETTE.btnUpgradeHot)));
    btn.on('pointerout', () => btn.setFillStyle(hexColor(PALETTE.btnUpgrade)));
    btn.on('pointerdown', () => {
      this.registry.set(REGISTRY_KEYS.currentChapterId, id);
      this.scene.start(SCENES.Game);
    });
  }

  private isChapterUnlocked(id: ChapterId): boolean {
    if (CHAPTERS[id].index === 1) return true;
    const unlocked = (this.registry.get(REGISTRY_KEYS.unlockedChapters) as ChapterId[] | undefined) ?? ['ch1_meadow'];
    return unlocked.includes(id);
  }

  private chapterStars(id: ChapterId): number {
    const stars = (this.registry.get(REGISTRY_KEYS.starsByChapter) as Record<string, number> | undefined) ?? {};
    return stars[id] ?? 0;
  }

  private button(x: number, y: number, label: string, w: number, h: number, onClick: () => void) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0.5);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.text,
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(hexColor(PALETTE.bg3)));
    bg.on('pointerout', () => bg.setFillStyle(hexColor(PALETTE.bg2)));
    bg.on('pointerdown', onClick);
  }

  // ─── meta-progression top bar ──────────────────────────────────

  private drawTopBar() {
    // Action buttons on the left: 商店 / Talent / 设置
    const btnY = px(28);
    const btnW = px(96);
    const btnH = px(32);
    const gap = px(8);
    let bx = px(24) + btnW / 2;
    this.topBarButton(bx, btnY, btnW, btnH, '⭐ 商店', () => {
      this.scene.launch(SCENES.Store, { returnTo: SCENES.Chapter });
    });
    bx += btnW + gap;
    this.topBarButton(bx, btnY, btnW, btnH, '🧬 Talent', () => {
      this.scene.launch(SCENES.Talent, { returnTo: SCENES.Chapter });
    });
    bx += btnW + gap;
    this.topBarButton(bx, btnY, btnW, btnH, '⚙ 设置', () => {
      this.scene.launch(SCENES.Settings, { returnTo: SCENES.Chapter });
    });

    // Stardust pill on the right.
    this.stardustLabel = this.add.text(GAME_WIDTH - px(24), btnY, '', {
      fontFamily: 'sans-serif', fontSize: '18px', color: PALETTE.accentHot, fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.refreshStardust();
  }

  private topBarButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0.5);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.text, fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(hexColor(PALETTE.bg3)));
    bg.on('pointerout',  () => bg.setFillStyle(hexColor(PALETTE.bg2)));
    bg.on('pointerdown', onClick);
  }

  private refreshStardust() {
    if (!this.stardustLabel) return;
    const cur = (this.registry.get(REGISTRY_KEYS.stardust) as number | undefined) ?? 0;
    this.stardustLabel.setText(`⭐ ${cur}`);
  }
}
