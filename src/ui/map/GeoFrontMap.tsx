import React, { useMemo } from 'react';
import { useNervStore } from '../../store/useNervStore';
import type { EvaPosition } from '../../types/nerv.d';

const HEX_RADIUS = 24;
const COLS = 9;
const ROWS = 7;

/**
 * Generates SVG polygon point coordinates for a flat-top hexagon.
 * @param cx - Center x coordinate
 * @param cy - Center y coordinate
 * @param r - Hexagon radius
 * @returns Space-separated coordinate string for SVG polygon points
 */
export function eva_hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

/** Represents a single cell in the hexagonal grid. */
export interface HexCell {
  /** Hex coordinate in 'row-col' format (e.g., '3-4') */
  id: string;
  cx: number;
  cy: number;
  row: number;
  col: number;
}

/**
 * Constructs the full hexagonal grid of HexCell objects.
 * Uses flat-top hex layout with staggered rows.
 * @returns Array of HexCell objects for a 9x7 grid
 */
export function eva_buildGrid(): HexCell[] {
  const cells: HexCell[] = [];
  const hexW = HEX_RADIUS * Math.sqrt(3);
  const hexH = HEX_RADIUS * 2;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const offset = row % 2 === 1 ? hexW / 2 : 0;
      const cx = col * hexW + offset + HEX_RADIUS + 4;
      const cy = row * (hexH * 0.75) + HEX_RADIUS + 4;
      cells.push({ id: `${row}-${col}`, cx, cy, row, col });
    }
  }
  return cells;
}

/**
 * Determines whether a hex cell falls within the elliptical GeoFront dome region.
 * @param row - Row index of the hex cell
 * @param col - Column index of the hex cell
 * @returns true if the cell is inside the dome
 */
export function eva_isInDome(row: number, col: number): boolean {
  const centerRow = (ROWS - 1) / 2;
  const centerCol = (COLS - 1) / 2;
  const dr = (row - centerRow) / (ROWS / 2);
  const dc = (col - centerCol) / (COLS / 2);
  return dr * dr + dc * dc < 0.65;
}

/**
 * Returns the fill color for a hex cell based on dome membership and emergency level.
 * @param row - Row index
 * @param col - Column index
 * @param emergencyLevel - Current facility emergency level
 * @returns Hex color string
 */
export function eva_fillForHex(
  row: number,
  col: number,
  emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY'
): string {
  const dome = eva_isInDome(row, col);
  if (emergencyLevel === 'EMERGENCY') {
    return dome ? '#FF9900' : '#331800';
  }
  if (emergencyLevel === 'ALERT') {
    return dome ? '#FF9900' : '#1a0a00';
  }
  return dome ? '#FF3300' : '#1a0500';
}

/**
 * Returns the stroke color for a hex cell based on dome membership and emergency level.
 * @param row - Row index
 * @param col - Column index
 * @param emergencyLevel - Current facility emergency level
 * @returns Hex color string
 */
export function eva_strokeForHex(
  row: number,
  col: number,
  emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY'
): string {
  if (emergencyLevel === 'EMERGENCY') return '#FF9900';
  return eva_isInDome(row, col) ? '#FF3300' : '#330a00';
}

/**
 * SVG-based hexagonal grid visualization of the GeoFront underground facility.
 * Renders a 9x7 flat-top hexagonal grid with emergency-level-reactive colors,
 * elliptical dome masking, and real-time EVA position overlays.
 *
 * @remarks
 * Store dependencies: `emergencyLevel`, `syncRatios`, `evaPositions`
 */
const GeoFrontMap: React.FC = () => {
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);
  const evaPositions = useNervStore((s) => s.evaPositions);
  const systemAlerts = useNervStore((s) => s.systemAlerts);

  const grid = useMemo(() => eva_buildGrid(), []);

  const hexW = HEX_RADIUS * Math.sqrt(3);
  const hexH = HEX_RADIUS * 2;
  const svgWidth = COLS * hexW + hexW / 2 + 8;
  const svgHeight = ROWS * (hexH * 0.75) + hexH * 0.25 + 8;

  // Build a lookup of hex coordinate to EVA position for rendering markers
  const evaByHex = useMemo(() => {
    const map = new Map<string, EvaPosition>();
    for (const pos of evaPositions) {
      map.set(pos.hexCoordinate, pos);
    }
    return map;
  }, [evaPositions]);

  return (
    <div className="bg-[#050505] border border-[#FF9900] p-4 font-['Share-Tech-Mono']">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#FF3300] text-xs tracking-widest uppercase">
          GEOFRONT TOPOLOGY MAP
        </span>
        <span
          className={`text-xs tracking-wider ${
            emergencyLevel === 'EMERGENCY'
              ? 'text-[#FF3300] animate-pulse'
              : emergencyLevel === 'ALERT'
                ? 'text-[#FF9900]'
                : 'text-[#FF3300]'
          }`}
        >
          [{emergencyLevel}]
        </span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        role="img"
        aria-label="GeoFront hexagonal map"
      >
        <defs>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-orange">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {grid.map((cell) => {
          const dome = eva_isInDome(cell.row, cell.col);
          const glowFilter =
            emergencyLevel === 'EMERGENCY' && dome
              ? 'url(#glow-orange)'
              : dome
                ? 'url(#glow-red)'
                : undefined;

          return (
            <polygon
              key={cell.id}
              data-hex={cell.id}
              points={eva_hexPoints(cell.cx, cell.cy, HEX_RADIUS - 1)}
              fill={eva_fillForHex(cell.row, cell.col, emergencyLevel)}
              stroke={eva_strokeForHex(cell.row, cell.col, emergencyLevel)}
              strokeWidth={dome ? 1.5 : 0.5}
              opacity={dome ? 1 : 0.4}
              filter={glowFilter}
            >
              {emergencyLevel === 'EMERGENCY' && dome && (
                <animate
                  attributeName="opacity"
                  values="1;0.5;1"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              )}
            </polygon>
          );
        })}

        {/* EVA position markers */}
        {grid.map((cell) => {
          const evaPos = evaByHex.get(cell.id);
          if (!evaPos) return null;
          return (
            <g key={`eva-${cell.id}`}>
              <circle
                cx={cell.cx}
                cy={cell.cy}
                r={6}
                fill="#FF3300"
                stroke="#FF9900"
                strokeWidth={1.5}
                opacity={0.9}
              />
              <text
                x={cell.cx}
                y={cell.cy + 14}
                textAnchor="middle"
                fill="#FF9900"
                fontSize="6"
                fontFamily="monospace"
              >
                {evaPos.unitId}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={svgWidth / 2}
          y={svgHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={emergencyLevel === 'EMERGENCY' ? '#FF9900' : '#FF3300'}
          fontSize="10"
          fontFamily="monospace"
          opacity={0.8}
        >
          GEOFRONT
        </text>
      </svg>

      {/* Emergency overlay for Pattern Blue detection */}
      {systemAlerts.length > 0 && (
        <div
          className="mt-2 p-2 border border-[#FF3300] bg-[#050505] text-[#FF3300] text-xs animate-pulse"
          data-testid="emergency-overlay"
        >
          {systemAlerts.map((alert, i) => (
            <div key={typeof alert === 'string' ? `alert-${i}` : alert.id}>
              {typeof alert === 'string' ? alert : alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-4 text-[10px] text-[#FF3300] opacity-60">
        <span>
          <span className="inline-block w-2 h-2 mr-1 bg-[#FF3300]" /> ACTIVE
        </span>
        <span>
          <span className="inline-block w-2 h-2 mr-1 bg-[#FF9900]" /> ALERT
        </span>
        <span>SECTORS: {COLS * ROWS}</span>
        {evaPositions.length > 0 && (
          <span>EVA UNITS: {evaPositions.length}</span>
        )}
      </div>
    </div>
  );
};

export default GeoFrontMap;
