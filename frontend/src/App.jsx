import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Header from './components/Header';
import ActionBar from './components/ActionBar';
import EventLog from './components/EventLog';
import WeatherPanel from './components/WeatherPanel';
import VillagersPanel from './components/VillagersPanel';
import GardenPanel from './components/GardenPanel';
import PetsPanel from './components/PetsPanel';
import EconomyPanel from './components/EconomyPanel';
import InventoryShelf from './components/InventoryShelf';
import JournalPanel from './components/JournalPanel';
import TeaBrewingStation from './components/TeaBrewingStation';
import AmbientLofiMixer from './components/AmbientLofiMixer';
import LofiPlayer from './components/LofiPlayer';
import FocusTimer from './components/FocusTimer';
import AmbientSounds from './components/AmbientSounds';
import StarryNight from './components/StarryNight';
import useAmbientSounds from './hooks/useAmbientSounds';

const TABS = [
  { id: 'weather', label: 'Weather', emoji: '☀️' },
  { id: 'villagers', label: 'Villagers', emoji: '👤' },
  { id: 'garden', label: 'Garden', emoji: '🌱' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'economy', label: 'Economy', emoji: '💰' },
  { id: 'inventory', label: 'Shelf', emoji: '🪵' },
  { id: 'journal', label: 'Journal', emoji: '📓' },
  { id: 'tea', label: 'Tea', emoji: '🍵' },
  { id: 'mixer', label: 'Mixer', emoji: '🎧' },
];

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [activeTab, setActiveTab] = useState('weather');
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [forecast, setForecast] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [toast, setToast] = useState(null);
  const sounds = useAmbientSounds();

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setGameState(data);
      document.body.className = `season-${data.season}`;
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    try {
      const data = await api.getForecast(5);
      setForecast(data);
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    }
  }, []);

  const fetchJournal = useCallback(async () => {
    try {
      const data = await api.getJournal();
      setJournalEntries(data);
    } catch (err) {
      console.error('Failed to fetch journal:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchStatus();
      await fetchForecast();
      await fetchJournal();
      setLoading(false);
    })();
  }, [fetchStatus, fetchForecast, fetchJournal]);

  const showToast = (msg) => {
    setToast(msg);
    sounds.notify();
    setTimeout(() => setToast(null), 3000);
  };

  const advanceDay = async () => {
    setAdvancing(true);
    sounds.dayAdvance();
    try {
      await api.advanceDay();
      await fetchStatus();
      await fetchForecast();
    } catch (err) {
      showToast('Failed to advance day');
    }
    setAdvancing(false);
  };

  const advanceWeek = async () => {
    setAdvancing(true);
    sounds.windChime();
    try {
      for (let i = 0; i < 7; i++) {
        await api.advanceDay();
      }
      await fetchStatus();
      await fetchForecast();
    } catch (err) {
      showToast('Failed to advance week');
    }
    setAdvancing(false);
  };

  const newGame = async () => {
    setLoading(true);
    sounds.windChime();
    try {
      const seed = Math.floor(Math.random() * 10000);
      await api.newGame(seed);
      await fetchStatus();
      await fetchForecast();
      sounds.success();
    } catch (err) {
      showToast('Failed to start new game');
    }
    setLoading(false);
  };

  const refresh = async () => {
    await fetchStatus();
    await fetchForecast();
    await fetchJournal();
  };

  if (loading) {
    return <div className="loading">Loading village...</div>;
  }

  if (!gameState) {
    return <div className="loading">Could not connect to server. Start the backend with: uvicorn server:app --reload</div>;
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'weather':
        return <WeatherPanel weather={gameState.weather} forecast={forecast} />;
      case 'villagers':
        return <VillagersPanel villagers={gameState.villagers} onRefresh={refresh} showToast={showToast} />;
      case 'garden':
        return <GardenPanel garden={gameState.garden} season={gameState.season} onRefresh={refresh} showToast={showToast} />;
      case 'pets':
        return <PetsPanel pets={gameState.pets} onRefresh={refresh} showToast={showToast} />;
      case 'economy':
        return <EconomyPanel economy={gameState.economy} season={gameState.season} onRefresh={refresh} showToast={showToast} />;
      case 'inventory':
        return <InventoryShelf economy={gameState.economy} onRefresh={refresh} showToast={showToast} />;
      case 'journal':
        return <JournalPanel entries={journalEntries} day={gameState.day} season={gameState.season} onRefresh={fetchJournal} showToast={showToast} />;
      case 'tea':
        return <TeaBrewingStation showToast={showToast} />;
      case 'mixer':
        return <AmbientLofiMixer showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Header
        day={gameState.day}
        season={gameState.season}
        weather={gameState.weather}
        villageMood={gameState.recent_reports?.[gameState.recent_reports.length - 1]?.village_mood}
      />

      <div className="main-content">
        <div className="panel-area">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  if (tab.id !== activeTab) sounds.tabSwitch();
                  setActiveTab(tab.id);
                }}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
          {renderPanel()}
        </div>

        <div className="sidebar">
          <EventLog reports={gameState.recent_reports || []} />
        </div>
      </div>

      <ActionBar
        advancing={advancing}
        onAdvanceDay={advanceDay}
        onAdvanceWeek={advanceWeek}
        onNewGame={newGame}
      />

      <LofiPlayer />
      <FocusTimer />
      <AmbientSounds sounds={sounds} weather={gameState.weather} season={gameState.season} />
      <StarryNight />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--brown)', color: 'var(--white)', padding: '10px 20px',
          borderRadius: 'var(--radius)', fontWeight: 600, zIndex: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
