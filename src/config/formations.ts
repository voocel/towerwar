import type { FormationId } from '@/types';

export type FormationCondition = 'two-fire' | 'two-ice' | 'two-thunder' | 'poison-thunder';

export interface FormationDef {
  id: FormationId;
  name: string;
  condition: FormationCondition;
  effectDescription: string;
}

export const FORMATIONS: Record<FormationId, FormationDef> = {
  inferno: { id: 'inferno', name: '燎原阵', condition: 'two-fire',
    effectDescription: '火印记持续 +50%' },
  glacier: { id: 'glacier', name: '寒冰领域', condition: 'two-ice',
    effectDescription: '冰印记率 +25%，印记自带 10% 减速' },
  grid:    { id: 'grid',    name: '电网',     condition: 'two-thunder',
    effectDescription: '电弧塔 +1 跳、磁暴塔 +0.8 格 AOE' },
  reactor: { id: 'reactor', name: '剧毒反应堆', condition: 'poison-thunder',
    effectDescription: '毒塔攻击额外附加电印记' },
};
