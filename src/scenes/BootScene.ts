import * as Phaser from 'phaser';
import { SCENES, REGISTRY_KEYS } from '@/constants';
import { readSave } from '@/systems/SaveSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  preload() {
    // Tiny pre-preload assets only — handled in PreloadScene.
  }

  create() {
    // Hydrate registry from localStorage so other scenes can use it directly.
    const reg = this.registry;
    const saved = readSave();
    // chapter-grain progress (stage 11)
    reg.set(REGISTRY_KEYS.unlockedChapters, saved.unlockedChapters);
    reg.set(REGISTRY_KEYS.starsByChapter, saved.starsByChapter);
    // meta-progression
    reg.set(REGISTRY_KEYS.stardust, saved.stardust);
    reg.set(REGISTRY_KEYS.unlockedTowers, saved.unlockedTowers);
    reg.set(REGISTRY_KEYS.ownedTalents, saved.ownedTalents);
    reg.set(REGISTRY_KEYS.equippedTalents, saved.equippedTalents);
    // settings
    reg.set(REGISTRY_KEYS.settings, saved.settings);

    this.scene.start(SCENES.Preload);
  }
}
