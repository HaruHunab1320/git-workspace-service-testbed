import { useState, useRef, useCallback, useEffect } from 'react';
import './AmbientLofiMixer.css';

const CHANNELS = [
  { id: 'rain', name: 'Rain', emoji: '🌧️', color: '#7a9ec8', description: 'Gentle rainfall on a window' },
  { id: 'vinyl', name: 'Vinyl Crackle', emoji: '💿', color: '#b8956a', description: 'Warm record player hiss' },
  { id: 'keys', name: 'Piano Keys', emoji: '🎹', color: '#c8848a', description: 'Soft Rhodes chords' },
  { id: 'bass', name: 'Lo-fi Bass', emoji: '🎸', color: '#7a9e7e', description: 'Mellow sub-bass hum' },
  { id: 'fire', name: 'Fireplace', emoji: '🔥', color: '#c8a04a', description: 'Crackling embers' },
  { id: 'wind', name: 'Night Wind', emoji: '🍃', color: '#8faabe', description: 'Soft breeze through trees' },
  { id: 'birds', name: 'Morning Birds', emoji: '🐦', color: '#a8c5a0', description: 'Distant birdsong' },
  { id: 'cafe', name: 'Cafe Murmur', emoji: '☕', color: '#9e8a7a', description: 'Quiet coffeeshop bustle' },
];

const PRESETS = [
  { id: 'rainy_study', name: 'Rainy Study', emoji: '📚', levels: { rain: 0.7, vinyl: 0.4, keys: 0.5, bass: 0.3, fire: 0, wind: 0, birds: 0, cafe: 0.2 } },
  { id: 'cozy_night', name: 'Cozy Night', emoji: '🌙', levels: { rain: 0, vinyl: 0.3, keys: 0.4, bass: 0.4, fire: 0.6, wind: 0.2, birds: 0, cafe: 0 } },
  { id: 'morning_cafe', name: 'Morning Cafe', emoji: '☀️', levels: { rain: 0, vinyl: 0.2, keys: 0.3, bass: 0.2, fire: 0, wind: 0, birds: 0.5, cafe: 0.6 } },
  { id: 'deep_focus', name: 'Deep Focus', emoji: '🧠', levels: { rain: 0.5, vinyl: 0.1, keys: 0, bass: 0.5, fire: 0, wind: 0.3, birds: 0, cafe: 0 } },
];

const DEFAULT_LEVELS = Object.fromEntries(CHANNELS.map((ch) => [ch.id, 0]));

export default function AmbientLofiMixer({ showToast }) {
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const channelNodesRef = useRef({});

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = masterVolume;
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [masterVolume]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Synthesized Channel Generators ─────────────────────────

  const createNoise = useCallback((ctx, seconds = 2) => {
    const sr = ctx.sampleRate;
    const len = sr * seconds;
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }, []);

  const buildChannel = useCallback((ctx, channelId) => {
    const gain = ctx.createGain();
    gain.gain.value = levels[channelId] || 0;
    gain.connect(masterGainRef.current);

    const nodes = [];

    switch (channelId) {
      case 'rain': {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoise(ctx, 4);
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 8000;
        bp.Q.value = 0.5;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;
        noise.connect(bp);
        bp.connect(hp);
        hp.connect(gain);
        noise.start();
        nodes.push(noise, bp, hp);
        break;
      }
      case 'vinyl': {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoise(ctx, 4);
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1200;
        bp.Q.value = 0.3;
        // Pop/crackle LFO
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.5;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 400;
        lfo.connect(lfoGain);
        lfoGain.connect(bp.frequency);
        lfo.start();
        noise.connect(bp);
        bp.connect(gain);
        noise.start();
        nodes.push(noise, bp, lfo, lfoGain);
        break;
      }
      case 'keys': {
        // Soft chord pad using detuned oscillators
        const chordFreqs = [261.6, 329.6, 392.0, 523.3];
        chordFreqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          // Gentle detune for warmth
          osc.detune.value = (Math.random() - 0.5) * 10;
          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.15;
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start();
          nodes.push(osc, oscGain);
        });
        // Tremolo LFO for movement
        const trem = ctx.createOscillator();
        trem.type = 'sine';
        trem.frequency.value = 0.3;
        const tremGain = ctx.createGain();
        tremGain.gain.value = 0.1;
        trem.connect(tremGain);
        tremGain.connect(gain.gain);
        trem.start();
        nodes.push(trem, tremGain);
        break;
      }
      case 'bass': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 55;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 120;
        lp.Q.value = 1;
        // Sub-bass LFO drift
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        osc.connect(lp);
        lp.connect(gain);
        osc.start();
        nodes.push(osc, lp, lfo, lfoGain);
        break;
      }
      case 'fire': {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoise(ctx, 4);
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 600;
        bp.Q.value = 1;
        const lfo = ctx.createOscillator();
        lfo.type = 'sawtooth';
        lfo.frequency.value = 3;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(bp.frequency);
        lfo.start();
        noise.connect(bp);
        bp.connect(gain);
        noise.start();
        nodes.push(noise, bp, lfo, lfoGain);
        break;
      }
      case 'wind': {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoise(ctx, 4);
        noise.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;
        lp.Q.value = 2;
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 250;
        lfo.connect(lfoGain);
        lfoGain.connect(lp.frequency);
        lfo.start();
        noise.connect(lp);
        lp.connect(gain);
        noise.start();
        nodes.push(noise, lp, lfo, lfoGain);
        break;
      }
      case 'birds': {
        const chirp = () => {
          if (!ctxRef.current || ctxRef.current.state === 'closed') return;
          const t = ctx.currentTime;
          const cGain = ctx.createGain();
          cGain.gain.setValueAtTime(0.12, t);
          cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          cGain.connect(gain);
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          const base = 2000 + Math.random() * 2000;
          osc.frequency.setValueAtTime(base, t);
          osc.frequency.exponentialRampToValueAtTime(base * (0.8 + Math.random() * 0.4), t + 0.1);
          osc.connect(cGain);
          osc.start(t);
          osc.stop(t + 0.15);
        };
        const interval = setInterval(() => {
          if (Math.random() < 0.35) chirp();
        }, 1800 + Math.random() * 2200);
        setTimeout(chirp, 400);
        const cleanup = { stop: () => clearInterval(interval), disconnect: () => {} };
        nodes.push(cleanup);
        break;
      }
      case 'cafe': {
        // Brownian noise (muffled) for distant murmur
        const noise = ctx.createBufferSource();
        noise.buffer = createNoise(ctx, 4);
        noise.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 800;
        lp.Q.value = 0.5;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 200;
        // Subtle modulation for natural feel
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 150;
        lfo.connect(lfoGain);
        lfoGain.connect(lp.frequency);
        lfo.start();
        noise.connect(lp);
        lp.connect(hp);
        hp.connect(gain);
        noise.start();
        nodes.push(noise, lp, hp, lfo, lfoGain);
        break;
      }
      default:
        break;
    }

    return { gain, nodes };
  }, [createNoise, levels]);

  // ─── Playback Controls ──────────────────────────────────────

  const startAll = useCallback(() => {
    const ctx = getCtx();
    const built = {};
    CHANNELS.forEach((ch) => {
      built[ch.id] = buildChannel(ctx, ch.id);
    });
    channelNodesRef.current = built;
    setPlaying(true);
    if (showToast) showToast('🎧 Mixer is playing');
  }, [getCtx, buildChannel, showToast]);

  const stopAll = useCallback(() => {
    Object.values(channelNodesRef.current).forEach(({ gain, nodes }) => {
      nodes.forEach((n) => {
        try {
          if (n.stop) n.stop();
          if (n.disconnect) n.disconnect();
        } catch { /* already stopped */ }
      });
      try { gain.disconnect(); } catch { /* noop */ }
    });
    channelNodesRef.current = {};
    setPlaying(false);
  }, []);

  const togglePlay = () => {
    if (playing) {
      stopAll();
    } else {
      startAll();
    }
  };

  // Update individual channel gain in real time
  const setChannelLevel = (channelId, value) => {
    setLevels((prev) => ({ ...prev, [channelId]: value }));
    setActivePreset(null);
    const channelData = channelNodesRef.current[channelId];
    if (channelData?.gain) {
      channelData.gain.gain.value = value;
    }
  };

  const applyPreset = (preset) => {
    setLevels(preset.levels);
    setActivePreset(preset.id);
    // Update live gain nodes
    CHANNELS.forEach((ch) => {
      const channelData = channelNodesRef.current[ch.id];
      if (channelData?.gain) {
        channelData.gain.gain.value = preset.levels[ch.id] || 0;
      }
    });
    if (!playing) {
      startAll();
    }
    if (showToast) showToast(`${preset.emoji} ${preset.name} loaded`);
  };

  const resetAll = () => {
    setLevels(DEFAULT_LEVELS);
    setActivePreset(null);
    CHANNELS.forEach((ch) => {
      const channelData = channelNodesRef.current[ch.id];
      if (channelData?.gain) {
        channelData.gain.gain.value = 0;
      }
    });
  };

  const activeCount = CHANNELS.filter((ch) => levels[ch.id] > 0).length;

  return (
    <div className="mixer">
      <div className="card mixer-header-card">
        <h2 className="card-title">🎧 Ambient Lo-fi Mixer</h2>
        <p className="mixer-subtitle">Layer sounds to craft your perfect atmosphere</p>
      </div>

      <div className="mixer-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`mixer-preset-btn ${activePreset === preset.id ? 'active' : ''}`}
            onClick={() => applyPreset(preset)}
          >
            <span className="mixer-preset-emoji">{preset.emoji}</span>
            <span className="mixer-preset-name">{preset.name}</span>
          </button>
        ))}
      </div>

      <div className="card mixer-board">
        <div className="mixer-channels">
          {CHANNELS.map((ch) => {
            const level = levels[ch.id];
            const isActive = level > 0;
            return (
              <div key={ch.id} className={`mixer-channel ${isActive ? 'active' : ''}`}>
                <div className="mixer-channel-header">
                  <span className="mixer-channel-emoji">{ch.emoji}</span>
                  <span className="mixer-channel-name">{ch.name}</span>
                </div>
                <div className="mixer-fader-track">
                  <div
                    className="mixer-fader-fill"
                    style={{
                      height: `${level * 100}%`,
                      background: ch.color,
                      opacity: playing ? 1 : 0.5,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={level}
                    onChange={(e) => setChannelLevel(ch.id, parseFloat(e.target.value))}
                    className="mixer-fader"
                    title={ch.description}
                  />
                </div>
                <span className="mixer-channel-value">{Math.round(level * 100)}%</span>
              </div>
            );
          })}
        </div>

        <div className="mixer-visualizer">
          {playing && (
            <div className="mixer-wave-container">
              {CHANNELS.map((ch) => {
                const level = levels[ch.id];
                if (level === 0) return null;
                return (
                  <div
                    key={ch.id}
                    className="mixer-wave-ring"
                    style={{
                      borderColor: ch.color,
                      opacity: 0.3 + level * 0.5,
                      animationDuration: `${3 + (1 - level) * 4}s`,
                    }}
                  />
                );
              })}
            </div>
          )}
          {!playing && (
            <div className="mixer-idle-icon">🎧</div>
          )}
        </div>
      </div>

      <div className="card mixer-controls-card">
        <div className="mixer-transport">
          <button
            className={`btn ${playing ? 'btn-rose' : 'btn-primary'} mixer-play-btn`}
            onClick={togglePlay}
          >
            {playing ? '⏹ Stop' : '▶ Play'}
          </button>
          <button className="btn btn-secondary" onClick={resetAll}>
            Reset
          </button>
        </div>

        <div className="mixer-master">
          <span className="mixer-master-label">Master</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="mixer-master-slider"
          />
          <span className="mixer-master-value">
            {masterVolume === 0 ? '🔇' : masterVolume < 0.5 ? '🔉' : '🔊'}
          </span>
        </div>

        <div className="mixer-status">
          {activeCount} layer{activeCount !== 1 ? 's' : ''} active
        </div>
      </div>
    </div>
  );
}
