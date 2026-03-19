export interface Pilot {
  id: string;
  name: string;
  syncRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BERSERK';
}

/** Hex coordinate in 'row-col' string format (e.g., '3-4') */
export type HexCoordinate = string;

export interface EvaPosition {
  pilotId: string;
  unitId: string;
  hexCoordinate: HexCoordinate;
  timestamp: number;
}
