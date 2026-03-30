import React, { useEffect } from 'react';
import { useNervStore } from '../store/useNervStore';
import { PHASE_DURATIONS } from '../simulation/engine';
import type { SimulationPhase } from '../types/nerv.d';

const NERV_RED = '#FF3300';
const WARNING_ORANGE = '#FF9900';
const DEEP_BLACK = '#050505';
const NOMINAL_GREEN = '#39FF14';

function phaseColor(phase: SimulationPhase): string {
  switch (phase) {
    case 'DETECTION':
      return NOMINAL_GREEN;
    case 'APPROACH':
      return WARNING_ORANGE;
    case 'CONTACT':
      return NERV_RED;
    case 'RESOLUTION':
      return '#FFD700';
    default:
      return WARNING_ORANGE;
  }
}

export default function SimulationController() {
  const simulation = useNervStore((s) => s.simulation);
  const startSimulation = useNervStore((s) => s.startSimulation);
  const pauseSimulation = useNervStore((s) => s.pauseSimulation);
  const resumeSimulation = useNervStore((s) => s.resumeSimulation);
  const resetSimulation = useNervStore((s) => s.resetSimulation);
  const tickSimulation = useNervStore((s) => s.tickSimulation);

  useEffect(() => {
    if (simulation.phase === 'IDLE' || simulation.isPaused) return;
    const id = setInterval(() => tickSimulation(), 1000);
    return () => clearInterval(id);
  }, [simulation.phase, simulation.isPaused, tickSimulation]);

  const isRunning = simulation.phase !== 'IDLE';
  const hasRun = simulation.outcome !== 'PENDING' || isRunning;
  const totalDuration = PHASE_DURATIONS[simulation.phase] || 1;
  const timerPercent = isRunning ? (simulation.phaseTimeRemaining / totalDuration) * 100 : 0;

  return (
    <div
      data-testid="simulation-controller"
      style={{
        backgroundColor: DEEP_BLACK,
        fontFamily: "'Share Tech Mono', monospace",
        border: `1px solid ${isRunning ? NERV_RED : WARNING_ORANGE}`,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          color: WARNING_ORANGE,
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          borderBottom: `1px solid ${WARNING_ORANGE}40`,
          paddingBottom: '0.5rem',
        }}
      >
        [NERV] ANGEL ATTACK SIMULATION
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: WARNING_ORANGE, fontSize: '0.625rem', letterSpacing: '0.1em' }}>
          PHASE:
        </span>
        <span
          data-testid="simulation-phase"
          style={{
            backgroundColor: isRunning ? phaseColor(simulation.phase) : `${WARNING_ORANGE}30`,
            color: isRunning ? DEEP_BLACK : WARNING_ORANGE,
            fontSize: '0.625rem',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            padding: '0.15rem 0.5rem',
          }}
        >
          {isRunning ? simulation.phase : 'STANDBY'}
        </span>
      </div>

      {/* Angel name */}
      {isRunning && (
        <div
          data-testid="simulation-angel-name"
          style={{ color: NERV_RED, fontSize: '0.875rem', letterSpacing: '0.15em' }}
        >
          TARGET: {simulation.currentAngelName}
        </div>
      )}

      {/* Timer bar */}
      {isRunning && (
        <div data-testid="simulation-timer" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: WARNING_ORANGE, fontSize: '0.625rem' }}>TIME REMAINING</span>
            <span style={{ color: WARNING_ORANGE, fontSize: '0.625rem' }}>
              {simulation.phaseTimeRemaining}s
            </span>
          </div>
          <div
            style={{
              height: 6,
              backgroundColor: `${WARNING_ORANGE}20`,
              border: `1px solid ${WARNING_ORANGE}40`,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${timerPercent}%`,
                backgroundColor: phaseColor(simulation.phase),
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {/* Health bars */}
      {isRunning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Angel HP */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: NERV_RED, fontSize: '0.625rem', letterSpacing: '0.1em' }}>
                ANGEL INTEGRITY
              </span>
              <span data-testid="simulation-angel-hp" style={{ color: NERV_RED, fontSize: '0.625rem' }}>
                {Math.round(simulation.angelHp)}%
              </span>
            </div>
            <div style={{ height: 8, backgroundColor: `${NERV_RED}20`, border: `1px solid ${NERV_RED}40` }}>
              <div
                style={{
                  height: '100%',
                  width: `${simulation.angelHp}%`,
                  backgroundColor: NERV_RED,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>

          {/* NERV Defense */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: NOMINAL_GREEN, fontSize: '0.625rem', letterSpacing: '0.1em' }}>
                NERV DEFENSE
              </span>
              <span data-testid="simulation-nerv-defense" style={{ color: NOMINAL_GREEN, fontSize: '0.625rem' }}>
                {Math.round(simulation.nervDefense)}%
              </span>
            </div>
            <div style={{ height: 8, backgroundColor: `${NOMINAL_GREEN}20`, border: `1px solid ${NOMINAL_GREEN}40` }}>
              <div
                style={{
                  height: '100%',
                  width: `${simulation.nervDefense}%`,
                  backgroundColor: NOMINAL_GREEN,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Outcome display */}
      {simulation.outcome !== 'PENDING' && (
        <div
          data-testid="simulation-outcome"
          style={{
            textAlign: 'center',
            padding: '0.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            color: simulation.outcome === 'VICTORY' ? NOMINAL_GREEN : NERV_RED,
            backgroundColor:
              simulation.outcome === 'VICTORY' ? `${NOMINAL_GREEN}15` : `${NERV_RED}15`,
            border: `1px solid ${simulation.outcome === 'VICTORY' ? NOMINAL_GREEN : NERV_RED}`,
          }}
        >
          {simulation.outcome === 'VICTORY' ? 'ANGEL NEUTRALIZED' : 'DEFENSE BREACH'}
        </div>
      )}

      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        {!isRunning && (
          <button
            data-testid="simulation-btn-start"
            onClick={startSimulation}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: `1px solid ${NOMINAL_GREEN}`,
              color: NOMINAL_GREEN,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            START
          </button>
        )}

        {isRunning && (
          <button
            data-testid="simulation-btn-pause"
            onClick={simulation.isPaused ? resumeSimulation : pauseSimulation}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: `1px solid ${WARNING_ORANGE}`,
              color: WARNING_ORANGE,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            {simulation.isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        )}

        {hasRun && (
          <button
            data-testid="simulation-btn-reset"
            onClick={resetSimulation}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: `1px solid ${NERV_RED}`,
              color: NERV_RED,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            RESET
          </button>
        )}
      </div>
    </div>
  );
}
