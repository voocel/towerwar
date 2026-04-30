import * as Phaser from 'phaser';
import { hexColor } from '@/utils/Grid';
import { px } from '@/constants';

/**
 * Lightweight scene-side FX. No preloaded textures — uses Arc + Tween.
 * Stage 6 will replace these with real particle emitters once art assets exist.
 */

/** Radial burst of N small dots that fly out and fade. */
export function spawnReactionBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: string,
  count: number = 14,
  radius: number = 60,
  duration: number = 450,
) {
  const c = hexColor(color);
  const radiusPx = px(radius);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = radiusPx * (0.6 + Math.random() * 0.7);
    const dot = scene.add.circle(x, y, px(3 + Math.random() * 2), c, 1).setDepth(40);
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist,
      alpha: 0,
      scale: 0.4,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => dot.destroy(),
    });
  }
  // Bright flash ring
  const ring = scene.add.circle(x, y, px(10), c, 0.55).setDepth(40);
  scene.tweens.add({
    targets: ring,
    scale: 4,
    alpha: 0,
    duration,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });
}

/** Short-lived beam connecting two points, used for chains and spreads. */
export function spawnBeam(
  scene: Phaser.Scene,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  duration: number = 250,
) {
  const c = hexColor(color);
  const line = scene.add.graphics().setDepth(35);
  line.lineStyle(3, c, 0.95);
  line.lineBetween(x1, y1, x2, y2);
  scene.tweens.add({
    targets: line,
    alpha: 0,
    duration,
    ease: 'Cubic.easeOut',
    onComplete: () => line.destroy(),
  });
}
