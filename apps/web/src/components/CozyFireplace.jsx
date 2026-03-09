import { useState, useEffect, useRef, useCallback } from 'react';
import './CozyFireplace.css';

const STORAGE_KEY = 'fireplace-state';
const INTENSITIES = ['embers', 'low', 'medium', 'roaring'];
const INTENSITY_LABELS = {
  embers: 'Embers',
  low: 'Low',
  medium: 'Medium',
  roaring: 'Roaring',
};

const _MARSHMALLOW_STAGES = ['raw', 'warming', 'golden', 'perfect', 'burnt'];
const MARSHMALLOW_LABELS = {
  raw: 'Ready to toast',
  warming: 'Warming up...',
  golden: 'Getting golden...',
  perfect: 'Perfect!',
  burnt: 'Oh no, burnt!',
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      lit: saved?.lit ?? false,
      intensity: INTENSITIES.includes(saved?.intensity)
        ? saved.intensity
        : 'medium',
      volume: typeof saved?.volume === 'number' ? saved.volume : 0.3,
    };
  } catch {
    return { lit: false, intensity: 'medium', volume: 0.3 };
  }
}

function createCrackleNode(ctx, volume, intensity) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  const densityMap = {
    embers: 0.003,
    low: 0.008,
    medium: 0.015,
    roaring: 0.03,
  };
  const density = densityMap[intensity] || 0.015;

  for (let i = 0; i < bufferSize; i++) {
    if (Math.random() < density) {
      const crackleLen = Math.floor(Math.random() * 800) + 200;
      const crackleAmp = Math.random() * 0.4 + 0.1;
      for (let j = 0; j < crackleLen && i + j < bufferSize; j++) {
        const env = 1 - j / crackleLen;
        data[i + j] += (Math.random() * 2 - 1) * crackleAmp * env * env;
      }
      i += crackleLen;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const cutoffMap = { embers: 600, low: 900, medium: 1200, roaring: 2000 };
  filter.frequency.value = cutoffMap[intensity] || 1200;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return { source, gain, filter };
}

function createBaseRumble(ctx, volume, intensity) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const freqMap = { embers: 30, low: 40, medium: 55, roaring: 70 };
  osc.frequency.value = freqMap[intensity] || 55;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 100;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  const ampMap = { embers: 0.02, low: 0.04, medium: 0.06, roaring: 0.1 };
  gain.gain.value = volume * (ampMap[intensity] || 0.06);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();

  return { osc, gain };
}

export default function CozyFireplace() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, setState] = useState(loadState);
  const [marshmallow, setMarshmallow] = useState('raw');
  const [isToasting, setIsToasting] = useState(false);

  const audioCtxRef = useRef(null);
  const crackleRef = useRef(null);
  const rumbleRef = useRef(null);
  const toastTimerRef = useRef(null);

  const { lit, intensity, volume } = state;

  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const stopAudio = useCallback(() => {
    try {
      if (crackleRef.current) {
        crackleRef.current.source.stop();
        crackleRef.current = null;
      }
      if (rumbleRef.current) {
        rumbleRef.current.osc.stop();
        rumbleRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {
      // Audio cleanup failed silently
    }
  }, []);

  const startAudio = useCallback(() => {
    stopAudio();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      crackleRef.current = createCrackleNode(ctx, volume, intensity);
      rumbleRef.current = createBaseRumble(ctx, volume, intensity);
    } catch {
      // Web Audio not available
    }
  }, [volume, intensity, stopAudio]);

  useEffect(() => {
    if (lit) {
      startAudio();
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [lit, intensity, startAudio, stopAudio]);

  useEffect(() => {
    if (crackleRef.current) {
      crackleRef.current.gain.gain.value = volume;
    }
    if (rumbleRef.current) {
      const ampMap = { embers: 0.02, low: 0.04, medium: 0.06, roaring: 0.1 };
      rumbleRef.current.gain.gain.value = volume * (ampMap[intensity] || 0.06);
    }
  }, [volume, intensity]);

  const toggleFire = () => update({ lit: !lit });

  const startToasting = () => {
    if (isToasting || !lit) return;
    setMarshmallow('raw');
    setIsToasting(true);

    const stages = ['warming', 'golden', 'perfect', 'burnt'];
    const speedMap = { embers: 3000, low: 2200, medium: 1600, roaring: 1000 };
    const speed = speedMap[intensity] || 1600;
    let idx = 0;

    toastTimerRef.current = setInterval(() => {
      if (idx < stages.length) {
        setMarshmallow(stages[idx]);
        idx++;
      }
      if (idx >= stages.length) {
        clearInterval(toastTimerRef.current);
        toastTimerRef.current = null;
        setTimeout(() => setIsToasting(false), 1500);
      }
    }, speed);
  };

  const grabMarshmallow = () => {
    if (toastTimerRef.current) {
      clearInterval(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setIsToasting(false);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearInterval(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`fireplace-widget ${isExpanded ? 'expanded' : 'collapsed'}`}
    >
      {isExpanded ? (
        <div className="fireplace-panel">
          <div className="fireplace-header">
            <span className="fireplace-title">cozy fireplace</span>
            <button
              className="fireplace-collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              &minus;
            </button>
          </div>

          {/* Fire Visualization */}
          <div
            className={`fireplace-hearth ${lit ? `intensity-${intensity}` : ''}`}
            onClick={toggleFire}
            style={{ cursor: 'pointer' }}
            title={lit ? 'Click to extinguish' : 'Click to light'}
          >
            <div className="fireplace-logs">
              <div className="fireplace-log" />
              <div className="fireplace-log" />
              <div className="fireplace-log" />
            </div>

            {lit && (
              <>
                <div className="fireplace-glow" />
                <div className="fireplace-flames">
                  <div className="flame flame-outer-left" />
                  <div className="flame flame-mid-left" />
                  <div className="flame flame-core" />
                  <div className="flame flame-mid-right" />
                  <div className="flame flame-outer-right" />
                </div>
                <div className="fireplace-embers">
                  <div className="ember" />
                  <div className="ember" />
                  <div className="ember" />
                  <div className="ember" />
                  <div className="ember" />
                </div>
              </>
            )}
          </div>

          {/* Intensity Controls */}
          {lit && (
            <div className="fireplace-intensity">
              {INTENSITIES.map((level) => (
                <button
                  key={level}
                  className={`fireplace-intensity-btn ${intensity === level ? 'active' : ''}`}
                  onClick={() => update({ intensity: level })}
                >
                  {INTENSITY_LABELS[level]}
                </button>
              ))}
            </div>
          )}

          {/* Volume Control */}
          {lit && (
            <div className="fireplace-volume">
              <span className="fireplace-volume-icon">
                {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => update({ volume: parseFloat(e.target.value) })}
                className="fireplace-volume-slider"
              />
            </div>
          )}

          {/* Marshmallow Toasting */}
          {lit && (
            <div className="fireplace-marshmallow-area">
              <span className="fireplace-marshmallow-label">
                marshmallow toasting
              </span>

              <div className="marshmallow-stick">
                <div className="marshmallow-skewer" />
                <div className={`marshmallow ${marshmallow}`} />
              </div>

              <span className={`marshmallow-status ${marshmallow}`}>
                {MARSHMALLOW_LABELS[marshmallow]}
              </span>

              {!isToasting ? (
                <button className="fireplace-toast-btn" onClick={startToasting}>
                  {marshmallow === 'raw'
                    ? 'Toast Marshmallow'
                    : 'Toast Another'}
                </button>
              ) : (
                <button
                  className="fireplace-toast-btn"
                  onClick={grabMarshmallow}
                  disabled={marshmallow === 'raw'}
                >
                  Grab It!
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          className={`fireplace-fab ${lit ? 'lit' : ''}`}
          onClick={() => setIsExpanded(true)}
          title="Cozy Fireplace"
        >
          <span className="fireplace-fab-icon">{lit ? '🔥' : '🪵'}</span>
          {lit && <span className="fireplace-fab-glow" />}
        </button>
      )}
    </div>
  );
}
