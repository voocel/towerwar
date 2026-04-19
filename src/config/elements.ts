import type { ElementId } from '@/types';
import { PALETTE } from '@/theme';

export interface ElementDef {
  id: ElementId;
  name: string;
  color: string;
  defaultMarkDuration: number;
}

export const ELEMENTS: Record<ElementId, ElementDef> = {
  fire:    { id: 'fire',    name: '火', color: PALETTE.fire,    defaultMarkDuration: 5 },
  ice:     { id: 'ice',     name: '冰', color: PALETTE.ice,     defaultMarkDuration: 4 },
  thunder: { id: 'thunder', name: '电', color: PALETTE.thunder, defaultMarkDuration: 4 },
  poison:  { id: 'poison',  name: '毒', color: PALETTE.poison,  defaultMarkDuration: 6 },
};
