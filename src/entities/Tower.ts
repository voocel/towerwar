import type { TowerId, GridPos, Vec2 } from '@/types';
import {
  TOWERS, type TowerDef,
  UPGRADE_SCALES, UPGRADE_ATTACK_SPEED_SCALES, UPGRADE_COST_RATIO, UPGRADE_RANGE_BONUS,
  FROST_MARK_CHANCE_BY_LEVEL, SELL_RATIO,
} from '@/config/towers';
import { gridToPixel, CELL_SIZE } from '@/utils/Grid';
import type { FormationId } from '@/types';

export class Tower {
  static nextId = 0;
  id: number;
  towerId: TowerId;
  def: TowerDef;
  grid: GridPos;
  pos: Vec2;
  level: 1 | 2 | 3 = 1;
  totalInvestment: number;
  attackTimer: number = 0;
  aimAngle: number = 0;
  formations: Set<FormationId> = new Set();

  constructor(towerId: TowerId, grid: GridPos) {
    this.id = Tower.nextId++;
    this.towerId = towerId;
    this.def = TOWERS[towerId];
    this.grid = grid;
    this.pos = gridToPixel(grid.gx, grid.gy);
    this.totalInvestment = this.def.cost;
  }

  get scale(): number { return UPGRADE_SCALES[this.level - 1]; }
  get attackSpeedScale(): number { return UPGRADE_ATTACK_SPEED_SCALES[this.level - 1]; }
  get attackSpeed(): number { return this.def.attackSpeed * this.attackSpeedScale; }
  get damage(): number { return this.def.damage * this.scale; }
  get dotDamage(): number { return (this.def.dotDamage ?? 0) * this.scale; }
  get aoeRadius(): number | undefined {
    return this.def.aoeRadius !== undefined ? this.def.aoeRadius * (1 + 0.15 * (this.level - 1)) : undefined;
  }
  get range(): number { return this.def.range + UPGRADE_RANGE_BONUS[this.level - 1]; }
  get rangePx(): number { return this.range * CELL_SIZE; }
  get attackPeriod(): number { return 1 / this.attackSpeed; }
  get markChance(): number {
    if (this.towerId === 'frost') return FROST_MARK_CHANCE_BY_LEVEL[this.level - 1];
    return this.def.markChance;
  }
  get chainCount(): number {
    let c = this.def.chainCount ?? 0;
    if (this.towerId === 'arc' && this.formations.has('grid')) c += 1;
    return c;
  }
  get magstormGridAoe(): number {
    return (this.towerId === 'magstorm' && this.formations.has('grid')) ? 0.8 : 0;
  }

  upgradeCost(): number | null {
    if (this.level >= 3) return null;
    const ratio = UPGRADE_COST_RATIO[this.level];  // L1→L2 uses index 1 (0.8); L2→L3 uses index 2 (1.2)
    return Math.round(this.def.cost * ratio);
  }

  statsAtLevel(level: 1 | 2 | 3) {
    const idx = level - 1;
    const scale = UPGRADE_SCALES[idx];
    return {
      level,
      damage: this.def.damage * scale,
      attackSpeed: this.def.attackSpeed * UPGRADE_ATTACK_SPEED_SCALES[idx],
      range: this.def.range + UPGRADE_RANGE_BONUS[idx],
      aoeRadius: this.def.aoeRadius !== undefined ? this.def.aoeRadius * (1 + 0.15 * idx) : undefined,
      dotDamage: this.def.dotDamage !== undefined ? this.def.dotDamage * scale : undefined,
      markChance: this.towerId === 'frost' ? FROST_MARK_CHANCE_BY_LEVEL[idx] : this.def.markChance,
    };
  }

  upgrade(free: boolean = false) {
    const cost = this.upgradeCost();
    if (cost === null) return;
    if (!free) this.totalInvestment += cost;
    this.level = (this.level + 1) as 1 | 2 | 3;
  }

  sellValue(): number {
    return Math.round(this.totalInvestment * SELL_RATIO);
  }
}
