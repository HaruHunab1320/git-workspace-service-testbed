import { useState, useCallback } from 'react';
import {
  PastelCard,
  PastelButton,
  PastelBadge,
  PastelTextarea,
  PastelDivider,
} from '@cozy-village/ui';

const MOODS = [
  { id: 'happy', label: 'Happy', variant: 'peach' },
  { id: 'calm', label: 'Calm', variant: 'mint' },
  { id: 'tired', label: 'Tired', variant: 'lavender' },
  { id: 'excited', label: 'Excited', variant: 'sky' },
  { id: 'anxious', label: 'Anxious', variant: 'blush' },
];

const ENERGY_LEVELS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

function CheckInForm({ onSubmit }) {
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState('');

  const handleSubmit = useCallback(() => {
    if (!mood) return;
    onSubmit({ mood, energy, note });
  }, [mood, energy, note, onSubmit]);

  return (
    <div className="checkin-form">
      <p className="checkin-prompt">Good to see you! How are you feeling today?</p>

      <div className="checkin-section">
        <span className="checkin-label">Mood</span>
        <div className="checkin-options">
          {MOODS.map((m) => (
            <PastelButton
              key={m.id}
              variant={mood === m.id ? m.variant : 'ghost'}
              size="sm"
              onClick={() => setMood(m.id)}
            >
              {m.label}
            </PastelButton>
          ))}
        </div>
      </div>

      <div className="checkin-section">
        <span className="checkin-label">Energy</span>
        <div className="checkin-options">
          {ENERGY_LEVELS.map((e) => (
            <PastelButton
              key={e.id}
              variant={energy === e.id ? 'mint' : 'ghost'}
              size="sm"
              onClick={() => setEnergy(e.id)}
            >
              {e.label}
            </PastelButton>
          ))}
        </div>
      </div>

      <PastelTextarea
        placeholder="Anything on your mind? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <PastelButton variant="mint" onClick={handleSubmit} disabled={!mood}>
          Check In
        </PastelButton>
      </div>
    </div>
  );
}

function CheckInSummary({ checkIn, streak }) {
  const moodInfo = MOODS.find((m) => m.id === checkIn.mood);

  return (
    <div className="checkin-summary">
      <div className="checkin-summary__header">
        <span>Today's check-in</span>
        {streak > 1 && (
          <PastelBadge variant="peach">{streak}-day streak</PastelBadge>
        )}
      </div>

      <div className="checkin-summary__details">
        {moodInfo && <PastelBadge variant={moodInfo.variant}>{moodInfo.label}</PastelBadge>}
        {checkIn.energy && <PastelBadge variant="mint">{checkIn.energy} energy</PastelBadge>}
      </div>

      {checkIn.note && (
        <p className="checkin-summary__note">{checkIn.note}</p>
      )}

      <div className="checkin-companion-response">
        <span className="checkin-companion-response__label">Mochi says:</span>
        <p className="checkin-companion-response__text">{checkIn.companionResponse}</p>
      </div>
    </div>
  );
}

function CheckInHistory({ checkIns }) {
  if (checkIns.length <= 1) return null;

  const past = checkIns.slice(1);

  return (
    <>
      <PastelDivider label="Recent Check-ins" />
      <div className="checkin-history">
        {past.map((entry) => {
          const moodInfo = MOODS.find((m) => m.id === entry.mood);
          const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          return (
            <div key={entry.id} className="checkin-history__item">
              <span className="checkin-history__date">{dateStr}</span>
              {moodInfo && <PastelBadge variant={moodInfo.variant} size="sm">{moodInfo.label}</PastelBadge>}
              {entry.energy && <PastelBadge variant="mint" size="sm">{entry.energy}</PastelBadge>}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function DailyCheckIn({ todayCheckIn, hasCheckedInToday, streak, recentCheckIns, onSubmit, showToast }) {
  const handleSubmit = useCallback((data) => {
    const response = onSubmit(data);
    showToast?.('Check-in complete!', 'success');
    return response;
  }, [onSubmit, showToast]);

  return (
    <PastelCard title="Daily Check-in" icon=">" glow="peach" padding="lg">
      {!hasCheckedInToday && <CheckInForm onSubmit={handleSubmit} />}
      {hasCheckedInToday && <CheckInSummary checkIn={todayCheckIn} streak={streak} />}
      <CheckInHistory checkIns={recentCheckIns} />
    </PastelCard>
  );
}
