import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { STATIONS, CHANNELS, DEFAULT_CHANNEL_LEVELS } from './constants';
import { loadState, saveState } from './persistence';

// ─── Context ────────────────────────────────────────────────

const AudioPlaybackContext = createContext(null);

export function useAudioPlayback() {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) {
    throw new Error(
      'useAudioPlayback must be used within an AudioPlaybackProvider'
    );
  }
  return ctx;
}

// ─── Reducer ────────────────────────────────────────────────

const INITIAL_STATE = {
  radio: {
    isPlaying: false,
    stationIndex: 0,
    volume: 0.4,
    hasError: false,
  },
  mixer: {
    isPlaying: false,
    channels: { ...DEFAULT_CHANNEL_LEVELS },
    masterVolume: 0.5,
    activePreset: null,
  },
  globalMuted: false,
};

function initState() {
  const saved = loadState();
  if (!saved) return INITIAL_STATE;
  return {
    radio: {
      ...INITIAL_STATE.radio,
      stationIndex: saved.radio?.stationIndex ?? 0,
      volume: saved.radio?.volume ?? 0.4,
    },
    mixer: {
      ...INITIAL_STATE.mixer,
      channels: saved.mixer?.channels
        ? { ...DEFAULT_CHANNEL_LEVELS, ...saved.mixer.channels }
        : { ...DEFAULT_CHANNEL_LEVELS },
      masterVolume: saved.mixer?.masterVolume ?? 0.5,
      activePreset: saved.mixer?.activePreset ?? null,
    },
    globalMuted: saved.globalMuted ?? false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'RADIO_PLAY':
      return {
        ...state,
        radio: { ...state.radio, isPlaying: true, hasError: false },
      };
    case 'RADIO_PAUSE':
      return {
        ...state,
        radio: { ...state.radio, isPlaying: false },
      };
    case 'RADIO_SET_STATION':
      return {
        ...state,
        radio: {
          ...state.radio,
          stationIndex: action.payload,
          hasError: false,
        },
      };
    case 'RADIO_SET_VOLUME':
      return {
        ...state,
        radio: { ...state.radio, volume: action.payload },
      };
    case 'RADIO_ERROR':
      return {
        ...state,
        radio: { ...state.radio, hasError: true, isPlaying: false },
      };
    case 'MIXER_PLAY':
      return {
        ...state,
        mixer: { ...state.mixer, isPlaying: true },
      };
    case 'MIXER_STOP':
      return {
        ...state,
        mixer: { ...state.mixer, isPlaying: false },
      };
    case 'MIXER_SET_CHANNEL':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          channels: {
            ...state.mixer.channels,
            [action.payload.id]: action.payload.level,
          },
          activePreset: null,
        },
      };
    case 'MIXER_SET_MASTER_VOLUME':
      return {
        ...state,
        mixer: { ...state.mixer, masterVolume: action.payload },
      };
    case 'MIXER_APPLY_PRESET':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          channels: { ...DEFAULT_CHANNEL_LEVELS, ...action.payload.levels },
          activePreset: action.payload.id,
        },
      };
    case 'MIXER_RESET':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          channels: { ...DEFAULT_CHANNEL_LEVELS },
          activePreset: null,
        },
      };
    case 'TOGGLE_MUTE':
      return { ...state, globalMuted: !state.globalMuted };
    default:
      return state;
  }
}

// ─── Audio Engine Helpers ───────────────────────────────────

function createNoiseBuffer(ctx, seconds = 4) {
  const sr = ctx.sampleRate;
  const len = sr * seconds;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function buildChannel(ctx, channelId, gainNode) {
  const nodes = [];

  switch (channelId) {
    case 'rain': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
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
      hp.connect(gainNode);
      noise.start();
      nodes.push(noise, bp, hp);
      break;
    }
    case 'vinyl': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
      noise.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 0.3;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);
      lfo.start();
      noise.connect(bp);
      bp.connect(gainNode);
      noise.start();
      nodes.push(noise, bp, lfo, lfoGain);
      break;
    }
    case 'keys': {
      const chordFreqs = [261.6, 329.6, 392.0, 523.3];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 10;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.15;
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        nodes.push(osc, oscGain);
      });
      const trem = ctx.createOscillator();
      trem.type = 'sine';
      trem.frequency.value = 0.3;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 0.1;
      trem.connect(tremGain);
      tremGain.connect(gainNode.gain);
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
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      osc.connect(lp);
      lp.connect(gainNode);
      osc.start();
      nodes.push(osc, lp, lfo, lfoGain);
      break;
    }
    case 'fire': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
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
      bp.connect(gainNode);
      noise.start();
      nodes.push(noise, bp, lfo, lfoGain);
      break;
    }
    case 'wind': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
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
      lp.connect(gainNode);
      noise.start();
      nodes.push(noise, lp, lfo, lfoGain);
      break;
    }
    case 'birds': {
      const chirp = () => {
        if (ctx.state === 'closed') return;
        const t = ctx.currentTime;
        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.12, t);
        cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        cGain.connect(gainNode);
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const base = 2000 + Math.random() * 2000;
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(
          base * (0.8 + Math.random() * 0.4),
          t + 0.1
        );
        osc.connect(cGain);
        osc.start(t);
        osc.stop(t + 0.15);
      };
      const interval = setInterval(() => {
        if (Math.random() < 0.35) chirp();
      }, 1800 + Math.random() * 2200);
      setTimeout(chirp, 400);
      const cleanup = {
        stop: () => clearInterval(interval),
        disconnect: () => {},
      };
      nodes.push(cleanup);
      break;
    }
    case 'cafe': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
      noise.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 800;
      lp.Q.value = 0.5;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 200;
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
      hp.connect(gainNode);
      noise.start();
      nodes.push(noise, lp, hp, lfo, lfoGain);
      break;
    }
    default:
      break;
  }

  return nodes;
}

function teardownNodes(nodes) {
  nodes.forEach((n) => {
    try {
      if (n.stop) n.stop();
      if (n.disconnect) n.disconnect();
    } catch {
      /* already stopped */
    }
  });
}

// ─── Provider ───────────────────────────────────────────────

export default function AudioPlaybackProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  // Audio engine refs
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const mixerGainRef = useRef(null);
  const channelGainsRef = useRef({});
  const channelNodesRef = useRef({});
  const audioElRef = useRef(null);

  // ─── Audio context management ───────────────────────────

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AC();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = state.globalMuted ? 0 : 1;
      masterGainRef.current.connect(audioCtxRef.current.destination);
      mixerGainRef.current = audioCtxRef.current.createGain();
      mixerGainRef.current.gain.value = state.mixer.masterVolume;
      mixerGainRef.current.connect(masterGainRef.current);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Persist state changes ──────────────────────────────

  useEffect(() => {
    saveState(state);
  }, [state]);

  // ─── Global mute sync ──────────────────────────────────

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = state.globalMuted ? 0 : 1;
    }
    if (audioElRef.current) {
      audioElRef.current.muted = state.globalMuted;
    }
  }, [state.globalMuted]);

  // ─── Radio stream engine ───────────────────────────────

  const radioPlay = useCallback(() => {
    const el = audioElRef.current;
    if (!el) return;
    const station = STATIONS[state.radio.stationIndex];
    if (el.src !== station.url) {
      el.src = station.url;
      el.load();
    }
    el.volume = state.radio.volume;
    el.muted = state.globalMuted;
    el.play()
      .then(() => dispatch({ type: 'RADIO_PLAY' }))
      .catch(() => dispatch({ type: 'RADIO_ERROR' }));
  }, [state.radio.stationIndex, state.radio.volume, state.globalMuted]);

  const radioPause = useCallback(() => {
    const el = audioElRef.current;
    if (el) el.pause();
    dispatch({ type: 'RADIO_PAUSE' });
  }, []);

  const radioToggle = useCallback(() => {
    if (state.radio.isPlaying) {
      radioPause();
    } else {
      radioPlay();
    }
  }, [state.radio.isPlaying, radioPlay, radioPause]);

  const radioSetStation = useCallback(
    (index) => {
      const wasPlaying = state.radio.isPlaying;
      if (wasPlaying) {
        const el = audioElRef.current;
        if (el) el.pause();
      }
      dispatch({ type: 'RADIO_SET_STATION', payload: index });
      if (wasPlaying) {
        // Allow state to update, then play the new station
        setTimeout(() => {
          const el = audioElRef.current;
          if (!el) return;
          el.src = STATIONS[index].url;
          el.load();
          el.volume = state.radio.volume;
          el.muted = state.globalMuted;
          el.play()
            .then(() => dispatch({ type: 'RADIO_PLAY' }))
            .catch(() => dispatch({ type: 'RADIO_ERROR' }));
        }, 50);
      }
    },
    [state.radio.isPlaying, state.radio.volume, state.globalMuted]
  );

  const radioNextStation = useCallback(() => {
    const next = (state.radio.stationIndex + 1) % STATIONS.length;
    radioSetStation(next);
  }, [state.radio.stationIndex, radioSetStation]);

  const radioPrevStation = useCallback(() => {
    const prev =
      (state.radio.stationIndex - 1 + STATIONS.length) % STATIONS.length;
    radioSetStation(prev);
  }, [state.radio.stationIndex, radioSetStation]);

  const radioSetVolume = useCallback((vol) => {
    dispatch({ type: 'RADIO_SET_VOLUME', payload: vol });
  }, []);

  // Sync radio volume to audio element
  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = state.radio.volume;
    }
  }, [state.radio.volume]);

  // ─── Mixer engine ─────────────────────────────────────

  const teardownMixer = useCallback(() => {
    Object.entries(channelNodesRef.current).forEach(([, nodes]) => {
      teardownNodes(nodes);
    });
    Object.values(channelGainsRef.current).forEach((g) => {
      try {
        g.disconnect();
      } catch {
        /* noop */
      }
    });
    channelNodesRef.current = {};
    channelGainsRef.current = {};
  }, []);

  const mixerPlay = useCallback(() => {
    const ctx = getAudioCtx();
    teardownMixer();

    CHANNELS.forEach((ch) => {
      const gain = ctx.createGain();
      gain.gain.value = state.mixer.channels[ch.id] || 0;
      gain.connect(mixerGainRef.current);
      channelGainsRef.current[ch.id] = gain;
      channelNodesRef.current[ch.id] = buildChannel(ctx, ch.id, gain);
    });

    dispatch({ type: 'MIXER_PLAY' });
  }, [getAudioCtx, teardownMixer, state.mixer.channels]);

  const mixerStop = useCallback(() => {
    teardownMixer();
    dispatch({ type: 'MIXER_STOP' });
  }, [teardownMixer]);

  const mixerToggle = useCallback(() => {
    if (state.mixer.isPlaying) {
      mixerStop();
    } else {
      mixerPlay();
    }
  }, [state.mixer.isPlaying, mixerPlay, mixerStop]);

  const mixerSetChannel = useCallback((id, level) => {
    dispatch({ type: 'MIXER_SET_CHANNEL', payload: { id, level } });
    const gainNode = channelGainsRef.current[id];
    if (gainNode) {
      gainNode.gain.value = level;
    }
  }, []);

  const mixerSetMasterVolume = useCallback((vol) => {
    dispatch({ type: 'MIXER_SET_MASTER_VOLUME', payload: vol });
    if (mixerGainRef.current) {
      mixerGainRef.current.gain.value = vol;
    }
  }, []);

  const mixerApplyPreset = useCallback(
    (preset) => {
      dispatch({
        type: 'MIXER_APPLY_PRESET',
        payload: { id: preset.id, levels: preset.levels },
      });
      // Sync gain nodes
      CHANNELS.forEach((ch) => {
        const gainNode = channelGainsRef.current[ch.id];
        if (gainNode) {
          gainNode.gain.value = preset.levels[ch.id] || 0;
        }
      });
      // Auto-start if not playing
      if (!state.mixer.isPlaying) {
        const ctx = getAudioCtx();
        teardownMixer();
        CHANNELS.forEach((ch) => {
          const gain = ctx.createGain();
          gain.gain.value = preset.levels[ch.id] || 0;
          gain.connect(mixerGainRef.current);
          channelGainsRef.current[ch.id] = gain;
          channelNodesRef.current[ch.id] = buildChannel(ctx, ch.id, gain);
        });
        dispatch({ type: 'MIXER_PLAY' });
      }
    },
    [state.mixer.isPlaying, getAudioCtx, teardownMixer]
  );

  const mixerReset = useCallback(() => {
    dispatch({ type: 'MIXER_RESET' });
    CHANNELS.forEach((ch) => {
      const gainNode = channelGainsRef.current[ch.id];
      if (gainNode) {
        gainNode.gain.value = 0;
      }
    });
  }, []);

  // ─── Cleanup on unmount ────────────────────────────────

  useEffect(() => {
    return () => {
      teardownMixer();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [teardownMixer]);

  // ─── Context value ────────────────────────────────────

  const value = useMemo(
    () => ({
      state,
      // Radio actions
      radioPlay,
      radioPause,
      radioToggle,
      radioSetStation,
      radioNextStation,
      radioPrevStation,
      radioSetVolume,
      // Mixer actions
      mixerPlay,
      mixerStop,
      mixerToggle,
      mixerSetChannel,
      mixerSetMasterVolume,
      mixerApplyPreset,
      mixerReset,
      // Global
      toggleMute: () => dispatch({ type: 'TOGGLE_MUTE' }),
    }),
    [
      state,
      radioPlay,
      radioPause,
      radioToggle,
      radioSetStation,
      radioNextStation,
      radioPrevStation,
      radioSetVolume,
      mixerPlay,
      mixerStop,
      mixerToggle,
      mixerSetChannel,
      mixerSetMasterVolume,
      mixerApplyPreset,
      mixerReset,
    ]
  );

  return (
    <AudioPlaybackContext.Provider value={value}>
      <audio ref={audioElRef} crossOrigin="anonymous" preload="none" />
      {children}
    </AudioPlaybackContext.Provider>
  );
}
