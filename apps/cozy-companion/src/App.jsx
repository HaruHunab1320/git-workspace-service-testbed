import { useState, useCallback } from 'react';
import {
  PastelCard,
  PastelTabs,
  PastelToast,
  PastelDivider,
  PastelAvatar,
  PastelBadge,
  PastelTooltip,
} from '@cozy-village/ui';
import CompanionDisplay from './components/CompanionDisplay';
import MoodSelector from './components/MoodSelector';
import GentleReminders from './components/GentleReminders';
import FocusTimer from './components/FocusTimer';
import JournalPanel from './components/JournalPanel';
import SettingsPanel from './components/SettingsPanel';

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
  'A small break now can help you focus later.',
  'Notice three things you can see right now.',
];

const GREETING_MESSAGES = {
  morning: 'Good morning! Ready for a cozy start?',
  afternoon: 'Good afternoon! How is your day going?',
  evening: 'Good evening! Time to wind down gently.',
  night: 'Late night? Take it easy on yourself.',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return GREETING_MESSAGES.morning;
  if (hour < 17) return GREETING_MESSAGES.afternoon;
  if (hour < 21) return GREETING_MESSAGES.evening;
  return GREETING_MESSAGES.night;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mood, setMood] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, variant = 'info') => {
    setToast({ message, variant });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleMoodSelect = useCallback(
    (m) => {
      setMood(m);
      if (m) {
        showToast(`Mood set to ${m}`, 'success');
      }
    },
    [showToast]
  );

  return (
    <div className="companion-app">
      <header className="companion-header">
        <div className="companion-header__avatar">
          <PastelAvatar name="Cozy Companion" emoji="~" size="xl" />
          <div className="companion-header__pulse" />
        </div>
        <h1 className="companion-header__title">Cozy Companion</h1>
        <p className="companion-header__subtitle">{getGreeting()}</p>
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
            <PastelCard
              title="Your Companion"
              icon=">"
              glow="lavender"
              padding="lg"
            >
              <CompanionDisplay mood={mood} />
            </PastelCard>

            <div className="companion-row">
              <PastelCard title="How are you feeling?" icon="?" hoverable>
                <MoodSelector selected={mood} onSelect={handleMoodSelect} />
              </PastelCard>

              <PastelCard title="Focus Timer" icon="@" hoverable>
                <FocusTimer showToast={showToast} />
              </PastelCard>
            </div>

            <PastelCard title="Gentle Reminders" icon="*" glow="mint">
              <GentleReminders
                reminders={DEFAULT_REMINDERS}
                intervalMs={30000}
              />
            </PastelCard>

            <div className="companion-footer-tip">
              <PastelTooltip
                text="Visit the Journal tab to write about your day"
                position="top"
              >
                <PastelBadge variant="lavender" size="sm">
                  Tip: Use the journal to reflect on your day
                </PastelBadge>
              </PastelTooltip>
            </div>
          </>
        )}

        {activeTab === 'journal' && <JournalPanel showToast={showToast} />}

        {activeTab === 'settings' && <SettingsPanel showToast={showToast} />}
      </main>

      <footer className="companion-app-footer">
        <PastelDivider />
        <p className="companion-app-footer__text">
          A gentle space for focus and calm
        </p>
      </footer>

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
