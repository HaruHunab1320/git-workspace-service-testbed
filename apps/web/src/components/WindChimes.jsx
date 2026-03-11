import { useState, useEffect, useRef, useCallback } from 'react';
import './WindChimes.css';

const STORAGE_KEY = 'windchimes-state';

// Pentatonic scale tuned for shimmery, high-register chime tones
const CHIME_NOTES = [
  523.3, 587.3, 659.3, 784.0, 880.0, 1046.5, 1174.7, 1318.5, 1568.0,
];

const PACE_LABELS = {
  gentle: 'Gentle',
  moderate: 'Moderate',
  lively: 'Lively',
};
const PACES = ['gentle', 'moderate', 'lively'];

// Interval ranges (ms) for each pace — [min, max]
const PACE_INTERVALS = {
  gentle: [6000, 14000],
  moderate: [3000, 8000],
  lively: [1500, 4500],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      active: saved?.active ?? false,
      volume: typeof saved?.volume === 'number' ? saved.volume : 0.3,
      pace: PACES.includes(saved?.pace) ? saved.pace : 'gentle',
    };
  } catch {
    return { active: false, volume: 0.3, pace: 'gentle' };
  }
}

/**
 * Plays a single wind chime strike — a shimmery sine tone
 * with a harmonic overtone and long, natural decay.
 */
function playChimeStrike(ctx, destination, volume, freq) {
  const t = ctx.currentTime;
  const duration = 2.5 + Math.random() * 1.5;

  // Fundamental tone
  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(volume * 0.18, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + duration);
  gain1.connect(destination);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, t);
  // Slight pitch drift for realism
  osc1.frequency.exponentialRampToValueAtTime(freq * 0.998, t + duration);
  osc1.connect(gain1);
  osc1.start(t);
  osc1.stop(t + duration);

  // First harmonic (octave + fifth, very quiet)
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(volume * 0.06, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);
  gain2.connect(destination);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.98, t); // ~3rd harmonic
  osc2.connect(gain2);
  osc2.start(t);
  osc2.stop(t + duration * 0.6);

  // Inharmonic shimmer (slightly detuned)
  const gain3 = ctx.createGain();
  gain3.gain.setValueAtTime(volume * 0.035, t);
  gain3.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.4);
  gain3.connect(destination);

  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 5.04, t); // slightly off 5th harmonic
  osc3.connect(gain3);
  osc3.start(t);
  osc3.stop(t + duration * 0.4);
}

/**
 * Plays a cluster of 2-4 chime strikes with slight random delays,
 * simulating a breeze brushing across hanging tubes.
 */
function playChimeCluster(ctx, destination, volume) {
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 strikes
  for (let i = 0; i < count; i++) {
    const delay = i * (80 + Math.random() * 200);
    const freq = pickRandom(CHIME_NOTES);
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        playChimeStrike(ctx, destination, volume, freq);
      }
    }, delay);
  }
}

export default function WindChimes() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, setState] = useState(loadState);
  const [swaying, setSwaying] = useState(false);

  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const timerRef = useRef(null);

  const { active, volume, pace } = state;

  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      gain.connect(ctx.destination);
      gainRef.current = gain;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [volume]);

  // Update gain node when volume changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  const triggerChime = useCallback(() => {
    const ctx = getCtx();
    playChimeCluster(ctx, gainRef.current, volume);
    // Animate the visual sway
    setSwaying(true);
    setTimeout(() => setSwaying(false), 1200);
  }, [getCtx, volume]);

  const scheduleNext = useCallback(() => {
    const [min, max] = PACE_INTERVALS[pace] || PACE_INTERVALS.gentle;
    const delay = randRange(min, max);
    timerRef.current = setTimeout(() => {
      triggerChime();
      scheduleNext();
    }, delay);
  }, [pace, triggerChime]);

  // Start/stop the chime loop
  useEffect(() => {
    if (active) {
      // Play one initial chime after a short random delay
      const initialDelay = 500 + Math.random() * 2000;
      timerRef.current = setTimeout(() => {
        triggerChime();
        scheduleNext();
      }, initialDelay);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, scheduleNext, triggerChime]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const toggleActive = () => update({ active: !active });

  const playPreview = () => {
    const ctx = getCtx();
    playChimeCluster(ctx, gainRef.current, volume);
    setSwaying(true);
    setTimeout(() => setSwaying(false), 1200);
  };

  return (
    <div
      className={`windchimes-widget ${isExpanded ? 'expanded' : 'collapsed'}`}
    >
      {isExpanded ? (
        <div className="windchimes-panel">
          <div className="windchimes-header">
            <span className="windchimes-title">wind chimes</span>
            <button
              className="windchimes-collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              &minus;
            </button>
          </div>

          {/* Chime Visualization */}
          <div
            className="windchimes-visual"
            onClick={playPreview}
            title="Click to preview"
          >
            <div className="windchimes-bar" />
            <div className={`windchimes-tubes ${swaying ? 'sway' : ''}`}>
              <div className="chime-tube tube-1" />
              <div className="chime-tube tube-2" />
              <div className="chime-tube tube-3" />
              <div className="chime-tube tube-4" />
              <div className="chime-tube tube-5" />
            </div>
            <div className={`windchimes-sail ${swaying ? 'sway' : ''}`} />
          </div>

          {/* Enable Toggle */}
          <div className="windchimes-toggle-row">
            <span className="windchimes-label">
              {active ? 'Chiming' : 'Silent'}
            </span>
            <button
              className={`windchimes-toggle ${active ? 'on' : 'off'}`}
              onClick={toggleActive}
            >
              <span className="windchimes-toggle-knob" />
            </button>
          </div>

          {/* Pace Controls */}
          {active && (
            <div className="windchimes-pace">
              {PACES.map((p) => (
                <button
                  key={p}
                  className={`windchimes-pace-btn ${pace === p ? 'active' : ''}`}
                  onClick={() => update({ pace: p })}
                >
                  {PACE_LABELS[p]}
                </button>
              ))}
            </div>
          )}

          {/* Volume */}
          <div className="windchimes-volume">
            <span className="windchimes-volume-icon">
              {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => update({ volume: parseFloat(e.target.value) })}
              className="windchimes-volume-slider"
            />
          </div>

          <div className="windchimes-hint">Click the chimes to preview</div>
        </div>
      ) : (
        <button
          className={`windchimes-fab ${active ? 'active' : ''}`}
          onClick={() => setIsExpanded(true)}
          title="Wind Chimes"
        >
          <span className="windchimes-fab-icon">{active ? '🎐' : '🎐'}</span>
          {active && <span className="windchimes-fab-ring" />}
        </button>
      )}
    </div>
  );
}
