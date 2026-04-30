import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, px } from '@/constants';
import { PALETTE, brighten } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { TALENTS, TALENT_ORDER, MAX_EQUIPPED_TALENTS } from '@/config/talents';
import { setEquippedTalents } from '@/systems/SaveSystem';
import { audio } from '@/managers/AudioManager';
import type { TalentId } from '@/types';

interface TalentPayload {
  returnTo: string;
}

/**
 * Loadout configurator. Player toggles owned talents in/out of MAX_EQUIPPED
 * slots; equipping a talent when slots are full replaces the oldest equipped.
 */
export class TalentScene extends Phaser.Scene {
  private payload!: TalentPayload;
  private gridContainer!: Phaser.GameObjects.Container;
  private slotsContainer!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.Talent);
  }

  init(data: TalentPayload) {
    this.payload = data ?? { returnTo: SCENES.Chapter };
  }

  create() {
    this.scene.pause(this.payload.returnTo);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0), 0.85).setOrigin(0);

    this.add.text(GAME_WIDTH / 2, px(56), 'Talent 装备', {
      fontFamily: 'sans-serif', fontSize: '32px',
      color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, PALETTE.accentRose, 12, true, true);

    this.add.text(GAME_WIDTH / 2, px(96), `每局最多装备 ${MAX_EQUIPPED_TALENTS} 个 · 出战前可随时调整`, {
      fontFamily: 'sans-serif', fontSize: '12px', color: PALETTE.textDim,
    }).setOrigin(0.5);

    // Equipped slots strip
    this.slotsContainer = this.add.container(0, 0);
    this.gridContainer = this.add.container(0, 0);
    this.renderSlots();
    this.renderGrid();

    // Close
    this.button(GAME_WIDTH / 2, GAME_HEIGHT - px(48), '返回', px(220), px(44), PALETTE.btnUpgrade, () => this.close());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private close() {
    audio.playSfx('sfx_click');
    this.scene.resume(this.payload.returnTo);
    this.scene.stop();
  }

  private getOwned(): TalentId[] {
    return (this.registry.get(REGISTRY_KEYS.ownedTalents) as TalentId[] | undefined) ?? [];
  }

  private getEquipped(): TalentId[] {
    return (this.registry.get(REGISTRY_KEYS.equippedTalents) as TalentId[] | undefined) ?? [];
  }

  private renderSlots() {
    this.slotsContainer.removeAll(true);
    const equipped = this.getEquipped();

    const slotW = px(220);
    const slotH = px(78);
    const gap = px(20);
    const totalW = slotW * MAX_EQUIPPED_TALENTS + gap * (MAX_EQUIPPED_TALENTS - 1);
    const startX = (GAME_WIDTH - totalW) / 2;
    const slotY = px(140);

    for (let i = 0; i < MAX_EQUIPPED_TALENTS; i++) {
      const sx = startX + i * (slotW + gap);
      const id = equipped[i];
      const bg = this.add.rectangle(sx, slotY, slotW, slotH, hexColor(PALETTE.bg2)).setOrigin(0);
      bg.setStrokeStyle(2, hexColor(id ? PALETTE.accentMint : PALETTE.divider));
      this.slotsContainer.add(bg);

      if (id) {
        const def = TALENTS[id];
        const icon = this.add.text(sx + px(40), slotY + slotH / 2, def.icon, {
          fontFamily: 'sans-serif', fontSize: '32px',
        }).setOrigin(0.5);
        const name = this.add.text(sx + px(72), slotY + px(16), def.name, {
          fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.textBright, fontStyle: 'bold',
        });
        const hint = this.add.text(sx + px(72), slotY + px(40), '点击此卡卸下', {
          fontFamily: 'sans-serif', fontSize: '10px', color: PALETTE.textDim,
        });
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.unequip(id));
        this.slotsContainer.add([icon, name, hint]);
      } else {
        const lbl = this.add.text(sx + slotW / 2, slotY + slotH / 2, `空槽 #${i + 1}`, {
          fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.textFaint,
        }).setOrigin(0.5);
        this.slotsContainer.add(lbl);
      }
    }
  }

  private renderGrid() {
    this.gridContainer.removeAll(true);
    const owned = new Set(this.getOwned());
    const equipped = new Set(this.getEquipped());

    const cardW = GAME_WIDTH - px(320);
    const cardH = px(56);
    const gap = px(8);
    const startX = px(160);
    const startY = px(260);

    if (owned.size === 0) {
      const tip = this.add.text(GAME_WIDTH / 2, startY + px(40),
        '暂无可装备 talent — 去星辉商店购买后再来。', {
        fontFamily: 'sans-serif', fontSize: '13px', color: PALETTE.textDim,
      }).setOrigin(0.5);
      this.gridContainer.add(tip);
      return;
    }

    let row = 0;
    for (const id of TALENT_ORDER) {
      if (!owned.has(id)) continue;
      const def = TALENTS[id];
      const isEquipped = equipped.has(id);
      const y = startY + row * (cardH + gap);
      row++;

      const bg = this.add.rectangle(startX, y, cardW, cardH, hexColor(PALETTE.bg2)).setOrigin(0);
      bg.setStrokeStyle(1, hexColor(isEquipped ? PALETTE.accentMint : PALETTE.divider));
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setFillStyle(hexColor(PALETTE.bg3)));
      bg.on('pointerout',  () => bg.setFillStyle(hexColor(PALETTE.bg2)));
      bg.on('pointerdown', () => isEquipped ? this.unequip(id) : this.equip(id));

      const icon = this.add.text(startX + px(28), y + cardH / 2, def.icon, {
        fontFamily: 'sans-serif', fontSize: '28px',
      }).setOrigin(0.5);
      const name = this.add.text(startX + px(60), y + px(10), def.name, {
        fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.textBright, fontStyle: 'bold',
      });
      const desc = this.add.text(startX + px(60), y + px(30), def.description, {
        fontFamily: 'sans-serif', fontSize: '11px', color: PALETTE.textDim,
      });
      const stateLbl = this.add.text(startX + cardW - px(20), y + cardH / 2,
        isEquipped ? '已装备' : '装备', {
        fontFamily: 'sans-serif', fontSize: '12px',
        color: isEquipped ? PALETTE.accentMint : PALETTE.text, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      this.gridContainer.add([bg, icon, name, desc, stateLbl]);
    }
  }

  private equip(id: TalentId) {
    audio.playSfx('sfx_click');
    const equipped = [...this.getEquipped()];
    if (equipped.includes(id)) return;
    if (equipped.length >= MAX_EQUIPPED_TALENTS) {
      // Replace oldest entry (FIFO) so player can keep clicking to swap.
      equipped.shift();
    }
    equipped.push(id);
    setEquippedTalents(this.registry, equipped);
    this.renderSlots();
    this.renderGrid();
  }

  private unequip(id: TalentId) {
    audio.playSfx('sfx_click');
    const equipped = this.getEquipped().filter(e => e !== id);
    setEquippedTalents(this.registry, equipped);
    this.renderSlots();
    this.renderGrid();
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
