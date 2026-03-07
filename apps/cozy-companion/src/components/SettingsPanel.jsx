import { useState, useCallback } from 'react';
import {
  PastelCard,
  PastelToggle,
  PastelSelect,
  PastelInput,
  PastelButton,
  PastelDivider,
  PastelBadge,
  PastelModal,
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

const THEME_PREVIEW = {
  lavender: '--pastel-lavender',
  mint: '--pastel-mint',
  blush: '--pastel-blush',
  peach: '--pastel-peach',
  sky: '--pastel-sky',
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('cozy-settings') || 'null');
  } catch {
    return null;
  }
}

function persistSettings(settings) {
  try {
    localStorage.setItem('cozy-settings', JSON.stringify(settings));
  } catch {
    // storage unavailable
  }
}

export default function SettingsPanel({ showToast }) {
  const [saved] = useState(loadSettings);
  const [soundEnabled, setSoundEnabled] = useState(saved?.soundEnabled ?? true);
  const [remindersEnabled, setRemindersEnabled] = useState(
    saved?.remindersEnabled ?? true
  );
  const [theme, setTheme] = useState(saved?.theme ?? 'lavender');
  const [companionName, setCompanionName] = useState(
    saved?.companionName ?? 'Mochi'
  );
  const [reminderInterval, setReminderInterval] = useState(
    saved?.reminderInterval ?? '30000'
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const markDirty = () => setHasUnsaved(true);

  const handleSave = useCallback(() => {
    persistSettings({
      soundEnabled,
      remindersEnabled,
      theme,
      companionName,
      reminderInterval,
    });
    setHasUnsaved(false);
    showToast?.('Settings saved', 'success');
  }, [
    soundEnabled,
    remindersEnabled,
    theme,
    companionName,
    reminderInterval,
    showToast,
  ]);

  const handleReset = useCallback(() => {
    setSoundEnabled(true);
    setRemindersEnabled(true);
    setTheme('lavender');
    setCompanionName('Mochi');
    setReminderInterval('30000');
    localStorage.removeItem('cozy-settings');
    setConfirmReset(false);
    setHasUnsaved(false);
    showToast?.('Settings reset to defaults', 'info');
  }, [showToast]);

  return (
    <PastelCard title="Settings" icon="*" padding="lg">
      <div className="settings-section">
        <PastelInput
          label="Companion Name"
          value={companionName}
          onChange={(e) => {
            setCompanionName(e.target.value);
            markDirty();
          }}
          placeholder="Give your companion a name"
          hint="Your companion will remember this"
        />
      </div>

      <PastelDivider label="Appearance" />

      <div className="settings-section">
        <PastelSelect
          label="Color Theme"
          options={THEME_OPTIONS}
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value);
            markDirty();
          }}
        />

        <div className="theme-preview">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`theme-swatch ${theme === opt.value ? 'theme-swatch--active' : ''}`}
              style={{ background: `var(${THEME_PREVIEW[opt.value]})` }}
              onClick={() => {
                setTheme(opt.value);
                markDirty();
              }}
              aria-label={opt.label}
              title={opt.label}
            />
          ))}
        </div>
      </div>

      <PastelDivider label="Preferences" />

      <div className="settings-section settings-toggles">
        <PastelToggle
          label="Sound Effects"
          checked={soundEnabled}
          onChange={(e) => {
            setSoundEnabled(e.target.checked);
            markDirty();
          }}
          variant="mint"
        />

        <PastelToggle
          label="Gentle Reminders"
          checked={remindersEnabled}
          onChange={(e) => {
            setRemindersEnabled(e.target.checked);
            markDirty();
          }}
          variant="lavender"
        />
      </div>

      {remindersEnabled && (
        <div className="settings-section">
          <PastelSelect
            label="Reminder Frequency"
            options={INTERVAL_OPTIONS}
            value={reminderInterval}
            onChange={(e) => {
              setReminderInterval(e.target.value);
              markDirty();
            }}
          />
        </div>
      )}

      <PastelDivider />

      <div className="settings-actions">
        <PastelButton
          variant="ghost"
          size="sm"
          onClick={() => setConfirmReset(true)}
        >
          Reset to Defaults
        </PastelButton>
        <PastelButton variant="mint" onClick={handleSave}>
          Save Settings
          {hasUnsaved && (
            <PastelBadge variant="peach" size="sm" className="unsaved-dot">
              *
            </PastelBadge>
          )}
        </PastelButton>
      </div>

      <PastelModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Settings?"
        icon="!"
        size="sm"
        actions={
          <>
            <PastelButton
              variant="ghost"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </PastelButton>
            <PastelButton variant="blush" onClick={handleReset}>
              Reset
            </PastelButton>
          </>
        }
      >
        <p>All settings will return to their default values.</p>
      </PastelModal>
    </PastelCard>
  );
}
