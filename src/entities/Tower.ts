import * as Phaser from 'phaser';
import type { TowerId, GridPos, TargetStrategy, FormationId } from '@/types';
import { TOWERS, type TowerDef, UPGRADE_SCALES, UPGRADE_ATTACK_SPEED_SCALES, UPGRADE_RANGE_BONUS, UPGRADE_COST_RATIO, SELL_RATIO } from '@/config/towers';
import { gridToPixel, hexColor } from '@/utils/Grid';
import { CELL_SIZE } from '@/constants';

export class Tower extends Phaser.GameObjects.Container {
  static nextId = 0;
  towerEntityId: number;
  towerId: TowerId;
  def: TowerDef;
  grid: GridPos;
  level: 1 | 2 | 3 = 1;
  totalInvestment: number;
  attackTimer: number = 0;
  aimAngle: number = 0;
  strategy: TargetStrategy;
  formations: Set<FormationId> = new Set();

  private barrel: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, towerId: TowerId, grid: GridPos) {
    const pos = gridToPixel(grid.gx, grid.gy);
    super(scene, pos.x, pos.y);
    this.towerEntityId = Tower.nextId++;
    this.towerId = towerId;
    this.def = TOWERS[towerId];
    this.grid = grid;
    this.totalInvestment = this.def.cost;
    this.strategy = this.def.defaultStrategy;

    const r = CELL_SIZE * 0.4;
    const spriteKey = `tower_${towerId}`;
    if (scene.textures.exists(spriteKey)) {
      // Real sprite (placeholder SVG or AI art) replaces base + body.
      // 0.82 leaves a small gap to neighboring cells / the path edge.
      const sprite = scene.add.image(0, 0, spriteKey);
      sprite.setDisplaySize(CELL_SIZE * 0.82, CELL_SIZE * 0.82);
      this.add(sprite);
    } else {
      const base = scene.add.circle(0, 0, r, 0x2a303a);
      base.setStrokeStyle(2, 0x4a5362);
      const bodyArc = scene.add.circle(0, 0, r * 0.65, hexColor(this.def.color));
      bodyArc.setStrokeStyle(2, 0xffffff, 0.45);
      this.add([base, bodyArc]);
    }
    // Barrel that rotates toward target — always drawn on top.
    this.barrel = scene.add.rectangle(0, 0, r * 0.9, r * 0.22, 0xe4e8ef);
    this.barrel.setOrigin(0, 0.5);
    this.add(this.barrel);

    scene.add.existing(this);
    this.setDepth(15);
  }

  get levelScale(): number { return UPGRADE_SCALES[this.level - 1]; }
  get attackSpeedScale(): number { return UPGRADE_ATTACK_SPEED_SCALES[this.level - 1]; }
  get attackSpeed(): number { return this.def.attackSpeed * this.attackSpeedScale; }
  get damage(): number { return this.def.damage * this.levelScale; }
  get range(): number { return this.def.range + UPGRADE_RANGE_BONUS[this.level - 1]; }
  get rangePx(): number { return this.range * CELL_SIZE; }
  get attackPeriod(): number { return 1 / this.attackSpeed; }
  get markChance(): number { return this.def.markChance; }
  get aoeRadius(): number | undefined { return this.def.aoeRadius; }
  get dotDamage(): number { return (this.def.dotDamage ?? 0) * this.levelScale; }

  setAimAngle(angle: number) {
    this.aimAngle = angle;
    this.barrel.rotation = angle;
  }

  /**
   * Default ratio comes from config; talents may override per-run via
   * `ctx.sellRatio`, in which case callers pass it explicitly.
   */
  sellValue(ratio: number = SELL_RATIO): number {
    return Math.round(this.totalInvestment * ratio);
  }

  /** Cost to advance from current level to next (or null when maxed). */
  nextUpgradeCost(): number | null {
    if (this.level >= 3) return null;
    return Math.round(this.def.cost * UPGRADE_COST_RATIO[this.level]);
  }

  /** Bumps level + investment + barrel/sprite scale. Caller pays the gold. */
  upgrade(): boolean {
    if (this.level >= 3) return false;
    const cost = this.nextUpgradeCost();
    if (cost == null) return false;
    this.level = (this.level + 1) as 1 | 2 | 3;
    this.totalInvestment += cost;
    this.refreshScale();
    return true;
  }

  /** Apply current level's scale to barrel + sprite. */
  refreshScale() {
    const s = 1 + (this.levelScale - 1) * 0.5;  // gentle visual bump per level
    this.barrel.scaleY = s;
    this.barrel.scaleX = 0.9 + (this.levelScale - 1) * 0.3;
  }
}
