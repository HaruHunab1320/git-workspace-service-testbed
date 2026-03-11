import { useState } from 'react';
import { api } from '../api';
import DailyEntry, { MOODS } from './DailyEntry';
import './JournalPanel.css';

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.value, m.emoji]));

export default function JournalPanel({
  entries,
  day,
  season,
  onRefresh,
  showToast,
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async ({ mood, note }) => {
    setSubmitting(true);
    try {
      await api.addJournalEntry(note, mood);
      await onRefresh();
      showToast('Journal entry saved!');
    } catch (_err) {
      showToast('Failed to save entry');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteJournalEntry(id);
      await onRefresh();
    } catch (_err) {
      showToast('Failed to delete entry');
    }
  };

  // Group entries by day (newest first)
  const grouped = {};
  for (const entry of entries) {
    const key = `Day ${entry.day} — ${entry.season}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }
  const dayKeys = Object.keys(grouped).reverse();

  return (
    <div className="journal-panel">
      <DailyEntry
        day={day}
        season={season}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {entries.length === 0 ? (
        <div className="card journal-empty">
          <span className="journal-empty-icon">📓</span>
          <p>Your journal is empty.</p>
          <p>Pick a mood and write your first entry above!</p>
        </div>
      ) : (
        <div className="journal-entries">
          {dayKeys.map((dayLabel) => (
            <div key={dayLabel} className="journal-day-group">
              <div className="journal-day-label">{dayLabel}</div>
              {grouped[dayLabel].map((entry) => (
                <div key={entry.id} className="journal-entry">
                  <div className="journal-entry-header">
                    <span>
                      {entry.mood && MOOD_MAP[entry.mood] ? (
                        <span className="journal-entry-mood">
                          {MOOD_MAP[entry.mood]}
                        </span>
                      ) : null}
                      Entry #{entry.id}
                    </span>
                    <button
                      className="journal-delete-btn"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="journal-entry-text">{entry.text}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
