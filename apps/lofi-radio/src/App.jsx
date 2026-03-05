import { useState } from 'react';
import AudioPlaybackProvider, {
  useAudioPlayback,
} from './state/AudioPlaybackProvider';
import RadioPlayer from './components/RadioPlayer';
import MixerBoard from './components/MixerBoard';

function AppContent() {
  const { state, toggleMute } = useAudioPlayback();
  const [activeTab, setActiveTab] = useState('radio');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-logo">lo-fi radio</h1>
        <button
          className="mute-btn"
          onClick={toggleMute}
          title={state.globalMuted ? 'Unmute' : 'Mute'}
        >
          {state.globalMuted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
      </header>

      <nav className="app-tabs">
        <button
          className={`tab-btn ${activeTab === 'radio' ? 'active' : ''}`}
          onClick={() => setActiveTab('radio')}
        >
          &#x1F4FB; Radio
        </button>
        <button
          className={`tab-btn ${activeTab === 'mixer' ? 'active' : ''}`}
          onClick={() => setActiveTab('mixer')}
        >
          &#x1F3A7; Mixer
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'radio' && <RadioPlayer />}
        {activeTab === 'mixer' && <MixerBoard />}
      </main>

      <footer className="app-status">
        {state.radio.isPlaying && (
          <span className="status-dot radio-dot" title="Radio playing" />
        )}
        {state.mixer.isPlaying && (
          <span className="status-dot mixer-dot" title="Mixer playing" />
        )}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AudioPlaybackProvider>
      <AppContent />
    </AudioPlaybackProvider>
  );
}
