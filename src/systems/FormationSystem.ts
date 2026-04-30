import type { GameContext } from '@/game/GameContext';
import type { Tower } from '@/entities/Tower';

function isAdjacent(a: Tower, b: Tower): boolean {
  const dx = Math.abs(a.grid.gx - b.grid.gx);
  const dy = Math.abs(a.grid.gy - b.grid.gy);
  return (dx + dy) > 0 && dx <= 1 && dy <= 1;
}

/**
 * Recompute formation membership for all towers. Call after any
 * placement / sale / upgrade.
 */
export function recomputeFormations(ctx: GameContext) {
  for (const t of ctx.towers) t.formations.clear();

  const towers = ctx.towers;
  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      const a = towers[i];
      const b = towers[j];
      if (!isAdjacent(a, b)) continue;
      const ea = a.def.element;
      const eb = b.def.element;
      if (ea === 'fire' && eb === 'fire') {
        a.formations.add('inferno'); b.formations.add('inferno');
      }
      if (ea === 'ice' && eb === 'ice') {
        a.formations.add('glacier'); b.formations.add('glacier');
      }
      if (ea === 'thunder' && eb === 'thunder') {
        a.formations.add('grid'); b.formations.add('grid');
      }
      if ((ea === 'poison' && eb === 'thunder') || (ea === 'thunder' && eb === 'poison')) {
        a.formations.add('reactor'); b.formations.add('reactor');
      }
    }
  }
}
