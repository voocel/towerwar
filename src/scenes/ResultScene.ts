import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, px } from '@/constants';
import { PALETTE, brighten } from '@/theme';
import { hexColor } from '@/utils/Grid';
import { getLevel } from '@/data/levels';
import { recordChapterVictory, awardStardust } from '@/systems/SaveSystem';
import { CHAPTER_ORDER } from '@/data/chapters';
import type { ChapterId } from '@/data/chapters';
import { audio } from '@/managers/AudioManager';
import { RELICS } from '@/config/relics';
import type { RelicId } from '@/types';

interface ResultPayload {
  chapterId: ChapterId;
  victory: boolean;
  livesLeft: number;
  enemiesKilled: number;
  reactionsTriggered: number;
  goldEarned: number;
  skillsUsed: number;
  relicsAcquired: RelicId[];
  /** Stardust dropped from kills during this run (elites/bosses/lucky defenders). */
  runStardust: number;
}

export class ResultScene extends Phaser.Scene {
  private payload!: ResultPayload;

  constructor() {
    super(SCENES.Result);
  }

  init(data: ResultPayload) {
    this.payload = data;
  }

  create() {
    const p = this.payload;
    const level = getLevel(p.chapterId);
    const cIdx = CHAPTER_ORDER.indexOf(level.chapterId);
    const nextChapterId: ChapterId | null =
      cIdx >= 0 && cIdx + 1 < CHAPTER_ORDER.length ? CHAPTER_ORDER[cIdx + 1] : null;

    // ★1: win
    // ★2: livesLeft ≥ starConditions.livesAtLeast
    // ★3: noSkillUsed (skillsUsed === 0)
    const cond = level.starConditions;
    let stars = 0;
    const starHits = { win: false, lives: false, noSkill: false };
    if (p.victory) {
      stars = 1; starHits.win = true;
      if (p.livesLeft >= cond.livesAtLeast) { stars++; starHits.lives = true; }
      if (cond.noSkillUsed && p.skillsUsed === 0) { stars++; starHits.noSkill = true; }
    }

    // Persist on victory before painting. Stage-11 progress is chapter-grain:
    // stars unlock the next chapter and grant account-bound stardust.
    // Defeat still awards 50% of the in-run drops as consolation so a failed
    // attempt is never *fully* wasted — but enough penalty to discourage
    // intentional losses.
    const battleDrop = p.runStardust ?? 0;
    let stardustTotal = 0;     // total written to save this result
    let clearReward = 0;       // portion from stars + first-clear (victory only)
    let dropReward = 0;        // portion from in-run kills (after defeat ½ cut)
    if (p.victory) {
      stardustTotal = recordChapterVictory(this.registry, level.chapterId, stars, nextChapterId, battleDrop);
      dropReward = battleDrop;
      clearReward = stardustTotal - dropReward;
    } else if (battleDrop > 0) {
      dropReward = Math.floor(battleDrop * 0.5);
      stardustTotal = awardStardust(this.registry, dropReward);
    }

    // Stop any chapter BGM and play the result sting.
    audio.stopBgm();
    audio.playSfx(p.victory ? 'sfx_victory' : 'sfx_defeat');

    // Backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexColor(PALETTE.bg0), 0.95).setOrigin(0);

    // Title
    const titleColor = p.victory ? PALETTE.accentHot : PALETTE.danger;
    this.add.text(GAME_WIDTH / 2, px(100), p.victory ? '胜利!' : '失败', {
      fontFamily: 'sans-serif', fontSize: '72px', fontStyle: 'bold',
      color: titleColor,
    }).setOrigin(0.5).setShadow(0, 0, titleColor, 16, true, true);

    this.add.text(GAME_WIDTH / 2, px(170), level.name, {
      fontFamily: 'sans-serif', fontSize: '20px', color: PALETTE.text,
    }).setOrigin(0.5);

    // Stars row
    if (p.victory) this.drawStars(GAME_WIDTH / 2, px(230), stars);

    // Star condition labels — show which condition each star tracks (in order)
    if (p.victory) {
      const starLabels: { text: string; hit: boolean }[] = [
        { text: '通关',                          hit: starHits.win },
        { text: `生命 ≥ ${cond.livesAtLeast}`,    hit: starHits.lives },
        { text: '未使用技能',                    hit: starHits.noSkill },
      ];
      const lbY = px(268);
      const size = px(56), gap = px(14), total = 3;
      const startX = GAME_WIDTH / 2 - (size * total + gap * (total - 1)) / 2 + size / 2;
      for (let i = 0; i < starLabels.length; i++) {
        const s = starLabels[i];
        this.add.text(startX + i * (size + gap), lbY, s.text, {
          fontFamily: 'sans-serif', fontSize: '11px',
          color: s.hit ? PALETTE.accentHot : PALETTE.textFaint,
        }).setOrigin(0.5);
      }
    }

    // Build stats list before sizing the panel so an optional stardust row
    // doesn't overflow the panel rectangle.
    const relicCell = p.relicsAcquired.length > 0
      ? p.relicsAcquired.map(r => RELICS[r].icon).join(' ')
      : '—';
    const stats: [string, string, string][] = [
      ['❤ 剩余生命', `${p.livesLeft} / ${level.startLives}`, PALETTE.danger],
      ['💀 击杀敌人', `${p.enemiesKilled}`, PALETTE.text],
      ['✦ 触发反应', `${p.reactionsTriggered}`, PALETTE.accentRose],
      ['🌠 使用技能', `${p.skillsUsed}`, PALETTE.fireAccent],
      ['💰 获得金币', `${p.goldEarned}`, PALETTE.accent],
      ['✨ 拾取遗物', relicCell, PALETTE.accentMint],
    ];
    if (dropReward > 0) {
      const label = p.victory ? '⭐ 战斗掉落' : '⭐ 战斗掉落 (×½)';
      stats.push([label, `+${dropReward}`, PALETTE.accentHot]);
    }
    if (clearReward > 0) {
      stats.push(['⭐ 通关奖励', `+${clearReward}`, PALETTE.accentHot]);
    }
    void stardustTotal; // total surfaced via the registry / popups elsewhere

    const rowH = px(34);
    const panelW = px(360);
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = px(300);
    const panelH = px(18) + stats.length * rowH + px(14);
    this.add.rectangle(panelX, panelY, panelW, panelH, hexColor(PALETTE.bg2)).setOrigin(0)
      .setStrokeStyle(1, hexColor(PALETTE.divider));

    let sy = panelY + px(18);
    for (const [label, value, color] of stats) {
      this.add.text(panelX + px(24), sy, label, {
        fontFamily: 'sans-serif', fontSize: '14px', color: PALETTE.textDim,
      });
      this.add.text(panelX + panelW - px(24), sy, value, {
        fontFamily: 'sans-serif', fontSize: '15px', color, fontStyle: 'bold',
      }).setOrigin(1, 0);
      sy += rowH;
    }

    // Buttons — anchor to the bottom of the (variable-height) stats panel
    // so a stardust row never causes overlap. Falls back to a safe-area
    // clamp if the panel ever grows too tall.
    const btnW = px(200);
    const btnH = px(48);
    const btnY = Math.min(
      panelY + panelH + px(36),
      GAME_HEIGHT - btnH / 2 - px(24),
    );
    if (p.victory && nextChapterId) {
      this.button(GAME_WIDTH / 2 - px(220), btnY, '下一章 →', btnW, btnH, PALETTE.btnStart, () => {
        this.registry.set(REGISTRY_KEYS.currentChapterId, nextChapterId);
        this.scene.start(SCENES.Game);
      });
      this.button(GAME_WIDTH / 2, btnY, '重玩本关', btnW, btnH, PALETTE.btnUpgrade, () => {
        this.scene.start(SCENES.Game);
      });
      this.button(GAME_WIDTH / 2 + px(220), btnY, '章节列表', btnW, btnH, PALETTE.bg3, () => {
        this.scene.start(SCENES.Chapter);
      });
    } else if (p.victory) {
      // Victory but no next level — last in game
      this.button(GAME_WIDTH / 2 - px(110), btnY, '重玩本章', btnW, btnH, PALETTE.btnUpgrade, () => {
        this.scene.start(SCENES.Game);
      });
      this.button(GAME_WIDTH / 2 + px(110), btnY, '章节列表', btnW, btnH, PALETTE.bg3, () => {
        this.scene.start(SCENES.Chapter);
      });
    } else {
      this.button(GAME_WIDTH / 2 - px(110), btnY, '重试', btnW, btnH, PALETTE.btnUpgrade, () => {
        this.scene.start(SCENES.Game);
      });
      this.button(GAME_WIDTH / 2 + px(110), btnY, '章节列表', btnW, btnH, PALETTE.bg3, () => {
        this.scene.start(SCENES.Chapter);
      });
    }
  }

  private drawStars(cx: number, cy: number, count: number) {
    const size = px(56);
    const gap = px(14);
    const total = 3;
    const startX = cx - (size * total + gap * (total - 1)) / 2 + size / 2;
    for (let i = 0; i < total; i++) {
      const filled = i < count;
      this.add.text(startX + i * (size + gap), cy, '★', {
        // fontSize is auto-multiplied by DPR in main.ts; size here is already
        // px-scaled, so divide back to logical pixels for the literal fontSize.
        fontFamily: 'sans-serif', fontSize: `${56}px`,
      }).setOrigin(0.5)
        .setColor(filled ? PALETTE.accentHot : PALETTE.divider)
        .setShadow(0, 0, filled ? PALETTE.accentHot : '#000000', filled ? 16 : 0, true, true);
    }
  }

  private button(x: number, y: number, label: string, w: number, h: number, color: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, w, h, hexColor(color)).setOrigin(0.5);
    bg.setStrokeStyle(1, hexColor(PALETTE.divider));
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '15px', color: PALETTE.textBright, fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(hexColor(brighten(color))));
    bg.on('pointerout', () => bg.setFillStyle(hexColor(color)));
    bg.on('pointerdown', () => {
      audio.playSfx('sfx_click');
      onClick();
    });
  }
}
