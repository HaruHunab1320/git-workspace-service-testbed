import React, { useMemo } from 'react';
import { useNervStore } from '../store/useNervStore';

const HEX_RADIUS = 24;
const COLS = 9;
const ROWS = 7;

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

/** Hex-coordinate key used as the primary identifier for state updates */
function hexKey(row: number, col: number): string {
  return `${row}-${col}`;
}

interface HexCell {
  id: string;
  cx: number;
  cy: number;
  row: number;
  col: number;
}

function buildGrid(): HexCell[] {
  const cells: HexCell[] = [];
  const hexW = HEX_RADIUS * Math.sqrt(3);
  const hexH = HEX_RADIUS * 2;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const offset = row % 2 === 1 ? hexW / 2 : 0;
      const cx = col * hexW + offset + HEX_RADIUS + 4;
      const cy = row * (hexH * 0.75) + HEX_RADIUS + 4;
      cells.push({ id: hexKey(row, col), cx, cy, row, col });
    }
  }
  return cells;
}

function isInDome(row: number, col: number): boolean {
  const centerRow = (ROWS - 1) / 2;
  const centerCol = (COLS - 1) / 2;
  const dr = (row - centerRow) / (ROWS / 2);
  const dc = (col - centerCol) / (COLS / 2);
  return dr * dr + dc * dc < 0.65;
}

const GeoFrontMap: React.FC = () => {
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);
  const systemAlerts = useNervStore((s) => s.systemAlerts);
  const evaPositions = useNervStore((s) => s.evaPositions);

  const hasAlerts = systemAlerts.length > 0;

  const evaHexMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const pos of evaPositions) {
      map.set(hexKey(pos.hex.row, pos.hex.col), pos.label);
    }
    return map;
  }, [evaPositions]);

  const grid = useMemo(() => buildGrid(), []);

  const hexW = HEX_RADIUS * Math.sqrt(3);
  const hexH = HEX_RADIUS * 2;
  const svgWidth = COLS * hexW + hexW / 2 + 8;
  const svgHeight = ROWS * (hexH * 0.75) + hexH * 0.25 + 8;

  const isEmergency = emergencyLevel === 'EMERGENCY' || hasAlerts;
  const isAlert = emergencyLevel === 'ALERT';

  const fillForHex = (row: number, col: number): string => {
    const dome = isInDome(row, col);
    const hasEva = evaHexMap.has(hexKey(row, col));

    if (hasEva) return '#FF3300';

    if (isEmergency) return dome ? '#FF9900' : '#1a0800';
    if (isAlert) return dome ? '#FF9900' : '#1a1a00';
    return dome ? '#39FF14' : '#0a1a00';
  };

  const strokeForHex = (row: number, col: number): string => {
    if (evaHexMap.has(hexKey(row, col))) return '#FF3300';
    if (isEmergency) return '#FF9900';
    return isInDome(row, col) ? '#39FF14' : '#1a3a00';
  };

  return (
    <div
      className="border border-[#FF9900] p-4"
      style={{ backgroundColor: '#050505', fontFamily: "'Share Tech Mono', monospace" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#39FF14] text-xs tracking-widest uppercase">
          [SYSTEM_REPORT] GeoFront Topology Map
        </span>
        <span
          className={`text-xs tracking-wider ${
            isEmergency
              ? 'text-[#FF3300] animate-pulse'
              : isAlert
                ? 'text-[#FF9900]'
                : 'text-[#39FF14]'
          }`}
        >
          [{emergencyLevel}]
        </span>
      </div>

      {hasAlerts && (
        <div className="mb-2 text-[10px] text-[#FF3300] animate-pulse">
          {systemAlerts.map((alert, i) => (
            <div key={i}>[SYSTEM_REPORT] {alert}</div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        role="img"
        aria-label="GeoFront hexagonal map"
      >
        <defs>
          <filter id="glow-green">
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
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {grid.map((cell) => {
          const dome = isInDome(cell.row, cell.col);
          const hasEva = evaHexMap.has(cell.id);
          const glowFilter = hasEva
            ? 'url(#glow-red)'
            : isEmergency && dome
              ? 'url(#glow-orange)'
              : dome
                ? 'url(#glow-green)'
                : undefined;

          return (
            <g key={cell.id} data-hex={cell.id}>
              <polygon
                points={hexPoints(cell.cx, cell.cy, HEX_RADIUS - 1)}
                fill={fillForHex(cell.row, cell.col)}
                stroke={strokeForHex(cell.row, cell.col)}
                strokeWidth={hasEva ? 2 : dome ? 1.5 : 0.5}
                opacity={dome || hasEva ? 1 : 0.4}
                filter={glowFilter}
              >
                {isEmergency && dome && (
                  <animate
                    attributeName="opacity"
                    values="1;0.5;1"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                )}
              </polygon>
              {hasEva && (
                <text
                  x={cell.cx}
                  y={cell.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize="7"
                  fontFamily="'Share Tech Mono', monospace"
                >
                  {evaHexMap.get(cell.id)}
                </text>
              )}
            </g>
          );
        })}

        <text
          x={svgWidth / 2}
          y={svgHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isEmergency ? '#FF3300' : '#39FF14'}
          fontSize="10"
          fontFamily="'Share Tech Mono', monospace"
          opacity={0.8}
        >
          GEOFRONT
        </text>
      </svg>

      <div
        className="mt-2 flex gap-4 text-[10px] text-[#39FF14] opacity-60"
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
      >
        <span>
          <span className="inline-block w-2 h-2 mr-1 bg-[#39FF14]" /> ACTIVE
        </span>
        <span>
          <span className="inline-block w-2 h-2 mr-1 bg-[#FF9900]" /> ALERT
        </span>
        <span>
          <span className="inline-block w-2 h-2 mr-1 bg-[#FF3300]" /> EVA UNIT
        </span>
        <span>SECTORS: {COLS * ROWS}</span>
      </div>
    </div>
  );
};

export default GeoFrontMap;
