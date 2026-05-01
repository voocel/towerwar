import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, px } from '@/constants';
import { PALETTE, brighten } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { TOWERS, RARITY_COLOR, RARITY_LABEL } from '@/config/towers';
import { TOWER_PRICES, DEFAULT_UNLOCKED_TOWERS } from '@/config/towerPrices';
import { TALENTS, TALENT_ORDER } from '@/config/talents';
import {
  spendStardust, unlockTower, buyTalent,
  isTowerUnlocked, ownsTalent,
} from '@/systems/SaveSystem';
import { audio } from '@/managers/AudioManager';
import type { TowerId, TalentId, StoreItemKind } from '@/types';

interface StorePayload {
  returnTo: string;
}

/**
 * Meta-store. Two tabs (towers / talents). All purchases are stardust-priced
 * and persistent. Modal: pauses caller scene, restores it on close.
 */
export class StoreScene extends Phaser.Scene {
  private payload!: StorePayload;
  private tab: StoreItemKind = 'tower';
  private listContainer!: Phaser.GameObjects.Container;
  private stardustLabel!: Phaser.GameObjects.Text;
  private tabBgs: Map<StoreItemKind, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super(SCENES.Store);
  }

  init(data: StorePayload) {
    this.payload = data ?? { returnTo: SCENES.Chapter };
    this.tab = 'tower';
  }

  create() {
    this.scene.pause(this.payload.returnTo);

    // Backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0), 0.85).setOrigin(0);

    // Title
    this.add.text(GAME_WIDTH / 2, px(56), '星辉商店', {
      fontFamily: 'sans-serif', fontSize: '32px',
      color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, PALETTE.accentRose, 12, true, true);

    // Stardust balance (top-right)
    this.stardustLabel = this.add.text(GAME_WIDTH - px(40), px(40), '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: PALETTE.accentHot, fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.refreshStardust();

    // Tabs
    const tabY = px(110);
    const tabW = px(160);
    const tabH = px(40);
    const tabGap = px(12);
    const tabsTotalW = tabW * 2 + tabGap;
    const tabsX = (GAME_WIDTH - tabsTotalW) / 2;
    this.makeTab('tower',  '塔解锁',     tabsX,                   tabY, tabW, tabH);
    this.makeTab('talent', 'Talent 商店', tabsX + tabW + tabGap, tabY, tabW, tabH);

    // List area
    this.listContainer = this.add.container(0, 0);
    this.renderList();

    // Close button
    const closeBtnY = GAME_HEIGHT - px(48);
    this.button(GAME_WIDTH / 2, closeBtnY, '返回', px(220), px(44), PALETTE.btnUpgrade, () => this.close());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private close() {
    audio.playSfx('sfx_click');
    this.scene.resume(this.payload.returnTo);
    this.scene.stop();
  }

  private refreshStardust() {
    const cur = (this.registry.get(REGISTRY_KEYS.stardust) as number | undefined) ?? 0;
    this.stardustLabel.setText(`⭐ ${cur}`);
  }

  private makeTab(kind: StoreItemKind, label: string, x: number, y: number, w: number, h: number) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.text, fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => { if (this.tab !== kind) bg.setFillStyle(hexColor(PALETTE.bg3)); });
    bg.on('pointerout',  () => this.refreshTabs());
    bg.on('pointerdown', () => {
      audio.playSfx('sfx_click');
      this.tab = kind;
      this.renderList();
      this.refreshTabs();
    });
    this.tabBgs.set(kind, bg);
    this.refreshTabs();
  }

  private refreshTabs() {
    for (const [kind, bg] of this.tabBgs) {
      const active = this.tab === kind;
      bg.setFillStyle(hexColor(active ? PALETTE.btnUpgrade : PALETTE.bg2));
      bg.setStrokeStyle(active ? 2 : 1, hexColor(active ? PALETTE.accentCool : PALETTE.divider));
    }
  }

  private renderList() {
    this.listContainer.removeAll(true);

    const startX = px(160);
    const startY = px(180);
    const cardW = GAME_WIDTH - px(320);
    const cardH = px(64);
    const gap = px(10);

    if (this.tab === 'tower') {
      // List all non-default towers (default ones are always unlocked → no
      // store entry needed).
      const ids: TowerId[] = (Object.keys(TOWER_PRICES) as TowerId[])
        .filter(id => !DEFAULT_UNLOCKED_TOWERS.includes(id));
      ids.sort((a, b) => TOWER_PRICES[a] - TOWER_PRICES[b]);
      for (let i = 0; i < ids.length; i++) {
        this.makeTowerCard(ids[i], startX, startY + i * (cardH + gap), cardW, cardH);
      }
    } else {
      const ids: TalentId[] = TALENT_ORDER;
      for (let i = 0; i < ids.length; i++) {
        this.makeTalentCard(ids[i], startX, startY + i * (cardH + gap), cardW, cardH);
      }
    }
  }

  private makeTowerCard(id: TowerId, x: number, y: number, w: number, h: number) {
    const def = TOWERS[id];
    const cost = TOWER_PRICES[id];
    const owned = isTowerUnlocked(this.registry, id);
    const rarityColor = RARITY_COLOR[def.rarity];

    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0);
    // Owned cards get a mint outline; unowned cards get a rarity-tinted outline
    // so the price tier reads visually before reading the number.
    bg.setStrokeStyle(owned ? 1 : 2, hexColor(owned ? PALETTE.accentMint : rarityColor));
    this.listContainer.add(bg);

    // Icon
    const iconCx = x + px(36);
    const iconCy = y + h / 2;
    const spriteKey = `tower_${id}`;
    if (this.textures.exists(spriteKey)) {
      const icon = this.add.image(iconCx, iconCy, spriteKey).setDisplaySize(px(40), px(40));
      this.listContainer.add(icon);
    } else {
      const dot = this.add.circle(iconCx, iconCy, px(14), hexColor(def.color));
      dot.setStrokeStyle(2, 0xffffff, 0.5);
      this.listContainer.add(dot);
    }

    // Rarity inline tag — placed right after the name on the same line so it
    // never collides with the price button on the right.
    const rarityTag = this.add.text(x + px(70 + 56), y + px(13), `· ${RARITY_LABEL[def.rarity]}`, {
      fontFamily: 'sans-serif', fontSize: '11px', color: rarityColor, fontStyle: 'bold',
    });
    this.listContainer.add(rarityTag);

    // Name + tagline (mechanic summary) — much more useful than `element · cost`
    const name = this.add.text(x + px(70), y + px(10), def.name, {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.textBright, fontStyle: 'bold',
    });
    const tag = this.add.text(x + px(70), y + px(30), def.tagline, {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.text,
    });
    const meta = this.add.text(x + px(70), y + px(46), `${def.element} · 局内造价 ${def.cost} 💰`, {
      fontFamily: 'sans-serif', fontSize: '10px', color: PALETTE.textFaint,
    });
    this.listContainer.add([name, tag, meta]);

    // Right-side action
    this.makeBuyAction({
      x: x + w - px(140), y, h,
      cost, owned,
      onBuy: () => this.tryBuyTower(id, cost),
    });
  }

  private makeTalentCard(id: TalentId, x: number, y: number, w: number, h: number) {
    const def = TALENTS[id];
    const owned = ownsTalent(this.registry, id);

    const bg = this.add.rectangle(x, y, w, h, hexColor(PALETTE.bg2)).setOrigin(0);
    bg.setStrokeStyle(1, hexColor(owned ? PALETTE.accentMint : PALETTE.accentRose));
    this.listContainer.add(bg);

    const iconText = this.add.text(x + px(28), y + h / 2, def.icon, {
      fontFamily: 'sans-serif', fontSize: '32px',
    }).setOrigin(0.5);
    this.listContainer.add(iconText);

    const name = this.add.text(x + px(70), y + px(12), def.name, {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.textBright, fontStyle: 'bold',
    });
    const desc = this.add.text(x + px(70), y + px(34), def.description, {
      fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textDim,
    });
    this.listContainer.add([name, desc]);

    this.makeBuyAction({
      x: x + w - px(140), y, h,
      cost: def.cost, owned,
      onBuy: () => this.tryBuyTalent(id, def.cost),
    });
  }

  private makeBuyAction(opts: {
    x: number; y: number; h: number;
    cost: number; owned: boolean;
    onBuy: () => void;
  }) {
    const { x, y, h, cost, owned, onBuy } = opts;
    if (owned) {
      const lbl = this.add.text(x + px(64), y + h / 2, '已拥有', {
        fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.accentMint, fontStyle: 'bold',
      }).setOrigin(0.5);
      this.listContainer.add(lbl);
      return;
    }
    const cur = (this.registry.get(REGISTRY_KEYS.stardust) as number | undefined) ?? 0;
    const canAfford = cur >= cost;
    const btnColor = canAfford ? PALETTE.btnUpgrade : PALETTE.btnDisabled;
    const btn = this.add.rectangle(x + px(64), y + h / 2, px(120), px(34), hexColor(btnColor)).setOrigin(0.5);
    btn.setStrokeStyle(1, hexColor(canAfford ? PALETTE.divider : PALETTE.danger), canAfford ? 1 : 0.4);
    btn.setInteractive({ useHandCursor: canAfford });
    const lbl = this.add.text(x + px(64), y + h / 2, `⭐ ${cost}`, {
      fontFamily: 'sans-serif', fontSize: '13px',
      color: canAfford ? PALETTE.textBright : PALETTE.textDim, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => {
      if (canAfford) btn.setFillStyle(hexColor(brighten(btnColor)));
    });
    btn.on('pointerout',  () => btn.setFillStyle(hexColor(btnColor)));
    btn.on('pointerdown', () => {
      if (canAfford) {
        onBuy();
      } else {
        // Disabled-state click: explicit feedback so the player knows *why*
        // nothing happened (was previously a silent no-op).
        this.flashShortfall(cost - cur, x + px(64), y + h / 2);
      }
    });
    this.listContainer.add([btn, lbl]);
  }

  /** Float-up "⭐ 不足 · 还差 N" message above the button on a failed click. */
  private flashShortfall(short: number, x: number, y: number) {
    const t = this.add.text(x, y - px(28), `⭐ 不足 · 还差 ${short}`, {
      fontFamily: 'sans-serif', fontSize: '12px',
      color: PALETTE.danger, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.listContainer.add(t);
    this.tweens.add({
      targets: t,
      y: y - px(48),
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private tryBuyTower(id: TowerId, cost: number) {
    if (!spendStardust(this.registry, cost)) return;
    unlockTower(this.registry, id);
    audio.playSfx('sfx_click');
    this.refreshStardust();
    this.renderList();
  }

  private tryBuyTalent(id: TalentId, cost: number) {
    if (!spendStardust(this.registry, cost)) return;
    buyTalent(this.registry, id);
    audio.playSfx('sfx_click');
    this.refreshStardust();
    this.renderList();
  }

  private button(x: number, y: number, label: string, w: number, h: number, color: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(color)).setOrigin(0.5);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(hexColor(brighten(color))));
    bg.on('pointerout',  () => bg.setFillStyle(hexColor(color)));
    bg.on('pointerdown', onClick);
  }
}
