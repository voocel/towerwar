import type { TalentId, TalentDef } from '@/types';

/**
 * Account-bound talents purchased with stardust. The player equips at most
 * MAX_EQUIPPED_TALENTS per run, applied at GameContext construction.
 *
 * Naming + numbers chosen so that any single talent feels useful but combos
 * become powerful only once 2~3 are owned (so the meta-progression has runway).
 */
export const TALENTS: Record<TalentId, TalentDef> = {
  pioneer: {
    id: 'pioneer',
    name: '先锋',
    description: '开局额外 +50 金币。',
    icon: '🎒',
    cost: 50,
  },
  harvest: {
    id: 'harvest',
    name: '丰收',
    description: '击杀获得的金币提升 20%。',
    icon: '🌾',
    cost: 80,
  },
  delay: {
    id: 'delay',
    name: '时之沙',
    description: '第 1 波延迟 5 秒,争取建塔时间。',
    icon: '⏳',
    cost: 30,
  },
  reforge: {
    id: 'reforge',
    name: '重铸',
    description: '出售返还从 70% 提升到 85%。',
    icon: '🔁',
    cost: 100,
  },
  extra_relic: {
    id: 'extra_relic',
    name: '援军',
    description: '遗物三选一变成四选一,多 1 张可选。',
    icon: '✨',
    cost: 60,
  },
};

export const TALENT_ORDER: TalentId[] =
  ['delay', 'pioneer', 'extra_relic', 'harvest', 'reforge'];

export const MAX_EQUIPPED_TALENTS = 2;
