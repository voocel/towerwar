import * as Phaser from 'phaser';
import { REGISTRY_KEYS } from '@/constants';
import type { Settings } from '@/systems/SaveSystem';

/**
 * Thin wrapper around Phaser.Sound that respects the player's settings.sfx /
 * settings.bgm toggles. Missing audio keys are tolerated — they no-op silently
 * so the game stays playable while real audio is being produced.
 *
 * Stage 6 contract:
 *   - PreloadScene loads keys following `assets/MANIFEST.md` naming.
 *   - Anything else just calls `audio.playSfx('foo')` / `audio.playBgm('foo')`.
 *   - Toggling settings in SettingsScene takes effect immediately because we
 *     subscribe to `changedata-settings` on the global registry.
 */
class AudioManager {
  private game!: Phaser.Game;
  private registry!: Phaser.Data.DataManager;
  private currentBgm?: Phaser.Sound.BaseSound;
  private currentBgmKey?: string;
  private initialized = false;

  init(game: Phaser.Game) {
    if (this.initialized) return;
    this.game = game;
    this.registry = game.registry;
    this.initialized = true;

    // Re-apply mute on settings change. DataManager fires `changedata-<key>`.
    this.registry.events.on('changedata-' + REGISTRY_KEYS.settings, () => {
      this.syncMuteFromSettings();
    });
    this.syncMuteFromSettings();
  }

  /** Pull current settings from registry. Falls back to all-on. */
  private settings(): Settings {
    const s = this.registry?.get(REGISTRY_KEYS.settings) as Settings | undefined;
    return s ?? { sfx: true, bgm: true, shake: true };
  }

  private syncMuteFromSettings() {
    const { bgm } = this.settings();
    if (this.currentBgm) {
      // Phaser sound mute is a property on the sound instance.
      (this.currentBgm as unknown as { mute: boolean }).mute = !bgm;
    }
  }

  /** Whether a key is loaded into the audio cache. */
  hasAudio(key: string): boolean {
    if (!this.initialized) return false;
    return this.game.cache.audio.has(key);
  }

  /**
   * Play a one-shot SFX. No-op when sfx is off or the key isn't loaded.
   * `config.volume` defaults to 0.7.
   */
  playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (!this.initialized) return;
    if (!this.settings().sfx) return;
    if (!this.hasAudio(key)) return;
    this.game.sound.play(key, { volume: 0.7, ...config });
  }

  /**
   * Switch BGM to `key`. If it's already playing, no-op. Stops the previous
   * track. Honors `settings.bgm` (still loads + creates the sound, but starts
   * muted so the player can hear it instantly when they re-enable BGM).
   */
  playBgm(key: string) {
    if (!this.initialized) return;
    if (this.currentBgmKey === key && this.currentBgm?.isPlaying) return;
    this.stopBgm();
    if (!this.hasAudio(key)) {
      // Remember intent so a later cache load could resume; for now just record.
      this.currentBgmKey = key;
      return;
    }
    const snd = this.game.sound.add(key, { loop: true, volume: 0.5 });
    snd.play();
    (snd as unknown as { mute: boolean }).mute = !this.settings().bgm;
    this.currentBgm = snd;
    this.currentBgmKey = key;
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = undefined;
    }
    this.currentBgmKey = undefined;
  }
}

export const audio = new AudioManager();
