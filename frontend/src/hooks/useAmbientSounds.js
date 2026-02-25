import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Gentle ambient UI sound engine using Web Audio API.
 * All sounds are synthesized — no external audio files needed.
 */

// Musical scale (pentatonic in C) for pleasing random tones
const PENTATONIC = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3];

// Seasonal mood → base frequencies
const SEASON_TUNING = {
  spring: { base: 523.3, warmth: 0.3 },
  summer: { base: 440.0, warmth: 0.5 },
  autumn: { base: 349.2, warmth: 0.4 },
  winter: { base: 293.7, warmth: 0.2 },
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function useAmbientSounds() {
  const ctxRef = useRef(null);
  const ambientNodesRef = useRef([]);
  const ambientGainRef = useRef(null);
  const masterGainRef = useRef(null);
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('ambient-sounds') !== 'off'; }
    catch { return true; }
  });
  const [ambientVolume, setAmbientVolume] = useState(() => {
    try { return parseFloat(localStorage.getItem('ambient-volume') || '0.3'); }
    catch { return 0.3; }
  });
  const [uiVolume, setUiVolume] = useState(() => {
    try { return parseFloat(localStorage.getItem('ui-volume') || '0.25'); }
    catch { return 0.25; }
  });

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem('ambient-sounds', enabled ? 'on' : 'off'); }
    catch { /* noop */ }
  }, [enabled]);

  useEffect(() => {
    try { localStorage.setItem('ambient-volume', String(ambientVolume)); }
    catch { /* noop */ }
  }, [ambientVolume]);

  useEffect(() => {
    try { localStorage.setItem('ui-volume', String(uiVolume)); }
    catch { /* noop */ }
  }, [uiVolume]);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = 1;
      masterGainRef.current.connect(ctxRef.current.destination);
      ambientGainRef.current = ctxRef.current.createGain();
      ambientGainRef.current.gain.value = ambientVolume;
      ambientGainRef.current.connect(masterGainRef.current);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [ambientVolume]);

  // Update ambient gain when volume changes
  useEffect(() => {
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  // ─── UI Sound Primitives ────────────────────────────────────

  const softPing = useCallback((freq = 880, duration = 0.12, vol = 1) => {
    if (!enabled) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(uiVolume * vol * 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    gain.connect(masterGainRef.current);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + duration);
  }, [enabled, getCtx, uiVolume]);

  const softClick = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    const t = ctx.currentTime;

    // Subtle wooden knock
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(uiVolume * 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    gain.connect(masterGainRef.current);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.06);
  }, [enabled, getCtx, uiVolume]);

  const tabSwitch = useCallback(() => {
    if (!enabled) return;
    // Two-note gentle chime
    softPing(698.5, 0.15, 0.7);
    setTimeout(() => softPing(880, 0.2, 0.5), 60);
  }, [enabled, softPing]);

  const success = useCallback(() => {
    if (!enabled) return;
    // Ascending three-note chime
    softPing(523.3, 0.2, 0.6);
    setTimeout(() => softPing(659.3, 0.2, 0.5), 100);
    setTimeout(() => softPing(784.0, 0.3, 0.4), 200);
  }, [enabled, softPing]);

  const notify = useCallback(() => {
    if (!enabled) return;
    // Soft bell-like tone
    const ctx = getCtx();
    const t = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(uiVolume * 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    gain.connect(masterGainRef.current);

    // Bell = sine + harmonic
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 830;
    osc1.connect(gain);
    osc1.start(t);
    osc1.stop(t + 0.5);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(uiVolume * 0.04, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    gain2.connect(masterGainRef.current);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1245;
    osc2.connect(gain2);
    osc2.start(t);
    osc2.stop(t + 0.3);
  }, [enabled, getCtx, uiVolume]);

  const dayAdvance = useCallback(() => {
    if (!enabled) return;
    // Gentle harp-like ascending arpeggio
    const notes = [392, 440, 523.3, 587.3, 659.3];
    notes.forEach((freq, i) => {
      setTimeout(() => softPing(freq, 0.3, 0.4 - i * 0.05), i * 80);
    });
  }, [enabled, softPing]);

  const windChime = useCallback(() => {
    if (!enabled) return;
    // Random wind chime — 3 random pentatonic tones
    for (let i = 0; i < 3; i++) {
      const delay = Math.random() * 300;
      const freq = pickRandom(PENTATONIC);
      setTimeout(() => softPing(freq, 0.4 + Math.random() * 0.3, 0.3), delay);
    }
  }, [enabled, softPing]);

  // ─── Ambient Soundscapes ────────────────────────────────────

  const stopAmbient = useCallback(() => {
    ambientNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch { /* already stopped */ }
    });
    ambientNodesRef.current = [];
  }, []);

  const createNoise = useCallback((ctx, durationSec = 2) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }, []);

  const startRain = useCallback((ctx) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoise(ctx, 4);
    noise.loop = true;

    // Bandpass filter for rain-like texture
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 8000;
    bp.Q.value = 0.5;

    // Gentle highpass to remove rumble
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    noise.connect(bp);
    bp.connect(hp);
    hp.connect(gain);
    gain.connect(ambientGainRef.current);
    noise.start();

    ambientNodesRef.current.push(noise, bp, hp, gain);
    return noise;
  }, [createNoise]);

  const startWind = useCallback((ctx) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoise(ctx, 4);
    noise.loop = true;

    // Low-frequency filter for wind
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    lp.Q.value = 2;

    // LFO to modulate wind filter for swaying effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    noise.connect(lp);
    lp.connect(gain);
    gain.connect(ambientGainRef.current);
    noise.start();

    ambientNodesRef.current.push(noise, lp, lfo, lfoGain, gain);
    return noise;
  }, [createNoise]);

  const startBirds = useCallback((ctx) => {
    // Periodic chirps using oscillators
    const nodes = [];
    const chirp = () => {
      if (!enabled) return;
      const t = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      gain.connect(ambientGainRef.current);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const baseFreq = 2000 + Math.random() * 2000;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (0.8 + Math.random() * 0.4), t + 0.1);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.15);
      nodes.push(osc, gain);
    };

    // Schedule random chirps
    const interval = setInterval(() => {
      if (Math.random() < 0.4) chirp();
    }, 1500 + Math.random() * 2000);

    // Store cleanup handle
    const cleanup = { stop: () => clearInterval(interval), disconnect: () => {} };
    ambientNodesRef.current.push(cleanup);
    // Initial chirp
    setTimeout(chirp, 500);
    return cleanup;
  }, [enabled]);

  const startCrickets = useCallback((ctx) => {
    // High-pitched rhythmic oscillation
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 4200;

    // Amplitude modulation for cricket-like pulsing
    const am = ctx.createOscillator();
    am.type = 'square';
    am.frequency.value = 18;
    const amGain = ctx.createGain();
    amGain.gain.value = 0.5;
    am.connect(amGain);

    const masterAm = ctx.createGain();
    masterAm.gain.value = 0;
    amGain.connect(masterAm.gain);

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    osc.connect(masterAm);
    masterAm.connect(gain);
    gain.connect(ambientGainRef.current);

    osc.start();
    am.start();

    ambientNodesRef.current.push(osc, am, amGain, masterAm, gain);
    return osc;
  }, []);

  const startFireplace = useCallback((ctx) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoise(ctx, 4);
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 1;

    // Crackle LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(ambientGainRef.current);
    noise.start();

    ambientNodesRef.current.push(noise, bp, lfo, lfoGain, gain);
    return noise;
  }, [createNoise]);

  const setAmbientScene = useCallback((weather, season) => {
    if (!enabled) {
      stopAmbient();
      return;
    }
    stopAmbient();
    const ctx = getCtx();
    const w = (weather?.current_weather || '').toLowerCase();

    // Weather-based layers
    if (w.includes('rain') || w.includes('storm') || w.includes('drizzle')) {
      startRain(ctx);
      if (w.includes('storm') || w.includes('wind')) {
        startWind(ctx);
      }
    } else if (w.includes('snow') || w.includes('blizzard')) {
      startWind(ctx);
    } else if (w.includes('wind') || w.includes('breezy')) {
      startWind(ctx);
    }

    // Season-based layers
    if (season === 'spring' || season === 'summer') {
      if (!w.includes('storm') && !w.includes('blizzard')) {
        startBirds(ctx);
      }
    }
    if (season === 'summer') {
      startCrickets(ctx);
    }
    if (season === 'winter' || season === 'autumn') {
      // Cozy fireplace crackling in cold seasons
      if (!w.includes('rain') && !w.includes('storm')) {
        startFireplace(ctx);
      }
    }
  }, [enabled, getCtx, stopAmbient, startRain, startWind, startBirds, startCrickets, startFireplace]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, [stopAmbient]);

  return {
    enabled,
    setEnabled,
    ambientVolume,
    setAmbientVolume,
    uiVolume,
    setUiVolume,
    // UI sounds
    softClick,
    tabSwitch,
    success,
    notify,
    dayAdvance,
    windChime,
    // Ambient
    setAmbientScene,
    stopAmbient,
  };
}
