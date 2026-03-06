import { useState } from 'react';
import {
  PastelCard,
  PastelToggle,
  PastelSelect,
  PastelInput,
  PastelButton,
  PastelDivider,
} from '@cozy-village/ui';

const THEME_OPTIONS = [
  { value: 'lavender', label: 'Lavender Dreams' },
  { value: 'mint', label: 'Mint Meadow' },
  { value: 'blush', label: 'Rose Garden' },
  { value: 'peach', label: 'Peach Sunset' },
  { value: 'sky', label: 'Cloud Nine' },
];

const INTERVAL_OPTIONS = [
  { value: '15000', label: 'Every 15 seconds' },
  { value: '30000', label: 'Every 30 seconds' },
  { value: '60000', label: 'Every minute' },
  { value: '300000', label: 'Every 5 minutes' },
];

export default function SettingsPanel({ showToast }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [theme, setTheme] = useState('lavender');
  const [companionName, setCompanionName] = useState('Mochi');

  const handleSave = () => {
    showToast?.('Settings saved', 'success');
  };

  return (
    <PastelCard title="Settings" icon="*" padding="lg">
      <PastelInput
        label="Companion Name"
        value={companionName}
        onChange={(e) => setCompanionName(e.target.value)}
        placeholder="Give your companion a name"
        hint="Your companion will remember this"
      />

      <PastelDivider label="Preferences" />

      <PastelSelect
        label="Color Theme"
        options={THEME_OPTIONS}
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
      />

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <PastelToggle
          label="Sound Effects"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
          variant="mint"
        />

        <PastelToggle
          label="Gentle Reminders"
          checked={remindersEnabled}
          onChange={(e) => setRemindersEnabled(e.target.checked)}
          variant="lavender"
        />
      </div>

      <PastelDivider />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PastelButton variant="mint" onClick={handleSave}>
          Save Settings
        </PastelButton>
      </div>
    </PastelCard>
  );
}
