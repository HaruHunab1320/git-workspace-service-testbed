export interface Pilot {
  id: string;
  name: string;
  syncRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BERSERK';
}

export interface HexCoordinate {
  row: number;
  col: number;
}

export interface EvaPosition {
  pilotId: string;
  hex: HexCoordinate;
  label: string;
}
