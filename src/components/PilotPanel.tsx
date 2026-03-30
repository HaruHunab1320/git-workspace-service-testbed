import React, { useState } from 'react';
import { useNervStore } from '../store/useNervStore';
import type { PilotStatus, EvaUnitId, PilotRecord } from '../types/nerv.d';

const NERV_RED = '#FF3300';
const WARNING_ORANGE = '#FF9900';
const DEEP_BLACK = '#050505';
const NOMINAL_GREEN = '#39FF14';

const EVA_UNITS: EvaUnitId[] = ['EVA-00', 'EVA-01', 'EVA-02', 'EVA-03'];
const STATUS_OPTIONS: PilotStatus[] = ['ACTIVE', 'INACTIVE', 'BERSERK'];

function statusColor(status: PilotStatus): string {
  switch (status) {
    case 'ACTIVE':
      return NOMINAL_GREEN;
    case 'INACTIVE':
      return WARNING_ORANGE;
    case 'BERSERK':
      return NERV_RED;
  }
}

const PilotPanel: React.FC = () => {
  const pilots = useNervStore((s) => s.pilots);
  const syncRatios = useNervStore((s) => s.syncRatios);
  const addPilot = useNervStore((s) => s.addPilot);
  const removePilot = useNervStore((s) => s.removePilot);
  const setPilotStatus = useNervStore((s) => s.setPilotStatus);
  const assignEvaUnit = useNervStore((s) => s.assignEvaUnit);
  const setPilotSyncRatio = useNervStore((s) => s.setPilotSyncRatio);

  const [newPilotName, setNewPilotName] = useState('');

  const assignedUnits = new Set(pilots.map((p) => p.evaUnitId).filter(Boolean));

  const handleAddPilot = () => {
    const name = newPilotName.trim();
    if (!name) return;
    const id = `pilot-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const pilot: PilotRecord = {
      id,
      name,
      status: 'ACTIVE',
      evaUnitId: null,
      syncRatio: 75,
    };
    addPilot(pilot);
    setNewPilotName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddPilot();
  };

  const cycleStatus = (pilotId: string, current: PilotStatus) => {
    const idx = STATUS_OPTIONS.indexOf(current);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setPilotStatus(pilotId, next);
  };

  return (
    <div
      data-testid="pilot-panel"
      style={{
        backgroundColor: DEEP_BLACK,
        border: `1px solid ${WARNING_ORANGE}`,
        fontFamily: "'Share Tech Mono', monospace",
        color: NERV_RED,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', letterSpacing: '0.15em', color: WARNING_ORANGE }}>
        PILOT MANAGEMENT
      </div>

      {/* Add pilot form */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          data-testid="pilot-name-input"
          type="text"
          value={newPilotName}
          onChange={(e) => setNewPilotName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pilot name..."
          style={{
            flex: 1,
            backgroundColor: '#111',
            border: `1px solid ${WARNING_ORANGE}44`,
            color: NOMINAL_GREEN,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.75rem',
            padding: '0.3rem 0.5rem',
            outline: 'none',
          }}
        />
        <button
          data-testid="btn-add-pilot"
          onClick={handleAddPilot}
          style={{
            border: `1px solid ${WARNING_ORANGE}`,
            backgroundColor: 'transparent',
            color: WARNING_ORANGE,
            fontFamily: "'Share Tech Mono', monospace",
            padding: '0.3rem 0.75rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
        >
          + ADD
        </button>
      </div>

      {/* Pilot list */}
      {pilots.length === 0 && (
        <div data-testid="no-pilots" style={{ color: `${WARNING_ORANGE}80`, fontSize: '0.7rem', textAlign: 'center' }}>
          NO PILOTS REGISTERED
        </div>
      )}

      {pilots.map((pilot) => (
        <div
          key={pilot.id}
          data-testid={`pilot-row-${pilot.id}`}
          style={{
            border: `1px solid ${statusColor(pilot.status)}33`,
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          {/* Header row: name, status badge, remove */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ flex: 1, fontSize: '0.75rem', color: WARNING_ORANGE }}>
              {pilot.name.toUpperCase()}
            </span>
            <button
              data-testid={`btn-status-${pilot.id}`}
              onClick={() => cycleStatus(pilot.id, pilot.status)}
              style={{
                border: `1px solid ${statusColor(pilot.status)}`,
                backgroundColor: 'transparent',
                color: statusColor(pilot.status),
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.6rem',
                padding: '0.15rem 0.4rem',
                cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              {pilot.status}
            </button>
            <button
              data-testid={`btn-remove-${pilot.id}`}
              onClick={() => removePilot(pilot.id)}
              style={{
                border: `1px solid ${NERV_RED}66`,
                backgroundColor: 'transparent',
                color: NERV_RED,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.6rem',
                padding: '0.15rem 0.4rem',
                cursor: 'pointer',
              }}
            >
              REMOVE
            </button>
          </div>

          {/* EVA unit assignment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem' }}>
            <span style={{ color: `${WARNING_ORANGE}80` }}>EVA:</span>
            <select
              data-testid={`select-eva-${pilot.id}`}
              value={pilot.evaUnitId ?? ''}
              onChange={(e) => assignEvaUnit(pilot.id, (e.target.value || null) as EvaUnitId | null)}
              style={{
                backgroundColor: '#111',
                border: `1px solid ${WARNING_ORANGE}44`,
                color: NOMINAL_GREEN,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.65rem',
                padding: '0.15rem',
              }}
            >
              <option value="">UNASSIGNED</option>
              {EVA_UNITS.map((unit) => (
                <option
                  key={unit}
                  value={unit}
                  disabled={assignedUnits.has(unit) && pilot.evaUnitId !== unit}
                >
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Sync ratio slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem' }}>
            <span style={{ color: `${WARNING_ORANGE}80` }}>SYNC:</span>
            <input
              data-testid={`slider-sync-${pilot.id}`}
              type="range"
              min={0}
              max={100}
              value={syncRatios[pilot.id] ?? pilot.syncRatio}
              onChange={(e) => setPilotSyncRatio(pilot.id, Number(e.target.value))}
              style={{ flex: 1, accentColor: NOMINAL_GREEN }}
            />
            <span data-testid={`sync-display-${pilot.id}`} style={{ color: NOMINAL_GREEN, minWidth: '3rem', textAlign: 'right' }}>
              {Math.round(syncRatios[pilot.id] ?? pilot.syncRatio)}%
            </span>
          </div>
        </div>
      ))}

      {/* Pilot count */}
      <div style={{ fontSize: '0.6rem', color: `${WARNING_ORANGE}60`, textAlign: 'right' }}>
        REGISTERED: {pilots.length} PILOT{pilots.length !== 1 ? 'S' : ''}
      </div>
    </div>
  );
};

export default PilotPanel;
