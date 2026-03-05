const STORAGE_KEY = 'lofi-radio-state';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    const serializable = {
      radio: {
        stationIndex: state.radio.stationIndex,
        volume: state.radio.volume,
      },
      mixer: {
        channels: state.mixer.channels,
        masterVolume: state.mixer.masterVolume,
        activePreset: state.mixer.activePreset,
      },
      globalMuted: state.globalMuted,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // localStorage unavailable
  }
}
