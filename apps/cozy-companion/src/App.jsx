import { useState, useCallback } from 'react';
import {
  PastelCard,
  PastelButton,
  PastelTabs,
  PastelToast,
  PastelDivider,
  PastelAvatar,
  PastelBadge,
} from '@cozy-village/ui';
import CompanionDisplay from './components/CompanionDisplay';
import MoodSelector from './components/MoodSelector';
import GentleReminders from './components/GentleReminders';
import FocusTimer from './components/FocusTimer';
import JournalPanel from './components/JournalPanel';
import SettingsPanel from './components/SettingsPanel';
import DailyCheckIn from './components/DailyCheckIn';
import useDailyCheckIn from './hooks/useDailyCheckIn';

const TABS = [
  { id: 'home', label: 'Home', icon: '~' },
  { id: 'journal', label: 'Journal', icon: '#' },
  { id: 'settings', label: 'Settings', icon: '*' },
];

const DEFAULT_REMINDERS = [
  'Take a deep breath and relax your shoulders.',
  'Have you had a glass of water recently?',
  'Stretch your arms above your head for a moment.',
  'Look away from the screen at something distant.',
  'You are doing great today.',
  'Remember to check in with how you feel.',
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mood, setMood] = useState(null);
  const [toast, setToast] = useState(null);
  const checkIn = useDailyCheckIn();

  const showToast = useCallback((message, variant = 'info') => {
    setToast({ message, variant });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <div className="companion-app">
      <header className="companion-header">
        <PastelAvatar name="Cozy Companion" emoji="~" size="xl" />
        <h1 className="companion-header__title">Cozy Companion</h1>
        <p className="companion-header__subtitle">Your gentle space for focus and calm</p>
      </header>

      <PastelTabs
        tabs={TABS}
        activeId={activeTab}
        onChange={setActiveTab}
        variant="pill"
      />

      <PastelDivider />

      <main className="companion-main">
        {activeTab === 'home' && (
          <>
            <PastelCard title="Your Companion" icon=">" glow="lavender" padding="lg">
              <CompanionDisplay mood={mood} />
            </PastelCard>

            <DailyCheckIn
              todayCheckIn={checkIn.todayCheckIn}
              hasCheckedInToday={checkIn.hasCheckedInToday}
              streak={checkIn.streak}
              recentCheckIns={checkIn.recentCheckIns}
              onSubmit={(data) => {
                const response = checkIn.submitCheckIn(data);
                setMood(data.mood);
                return response;
              }}
              showToast={showToast}
            />

            <div className="companion-row">
              <PastelCard title="How are you feeling?" icon="?" hoverable>
                <MoodSelector selected={mood} onSelect={(m) => {
                  setMood(m);
                  showToast(`Mood set to ${m}`, 'success');
                }} />
              </PastelCard>

              <PastelCard title="Focus Timer" icon="@" hoverable>
                <FocusTimer showToast={showToast} />
              </PastelCard>
            </div>

            <PastelCard title="Gentle Reminders" icon="*" glow="mint">
              <GentleReminders reminders={DEFAULT_REMINDERS} intervalMs={30000} />
            </PastelCard>
          </>
        )}

        {activeTab === 'journal' && (
          <JournalPanel showToast={showToast} />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel showToast={showToast} />
        )}
      </main>

      <PastelToast
        message={toast?.message}
        variant={toast?.variant}
        visible={!!toast}
        onDismiss={dismissToast}
        duration={3000}
      />
    </div>
  );
}
