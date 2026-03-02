import { useState } from 'react';
import './DailyEntry.css';

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '🥰', label: 'Loved', value: 'loved' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '✨', label: 'Inspired', value: 'inspired' },
];

const NOTE_MAX = 300;

export default function DailyEntry({ day, season, onSubmit, submitting }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');

  const canSubmit = selectedMood && note.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ mood: selectedMood, note: note.trim() });
    setSelectedMood(null);
    setNote('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="daily-entry" data-id="journal-entry">
      <div className="daily-entry-header">
        <h3 className="card-title">How are you feeling?</h3>
        <span className="daily-entry-date">Day {day} — {season}</span>
      </div>

      <div className="daily-entry-moods">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            className={`daily-entry-mood-btn ${selectedMood === mood.value ? 'selected' : ''}`}
            onClick={() => setSelectedMood(mood.value)}
            title={mood.label}
            disabled={submitting}
          >
            <span className="daily-entry-mood-emoji">{mood.emoji}</span>
            <span className="daily-entry-mood-label">{mood.label}</span>
          </button>
        ))}
      </div>

      <textarea
        className="daily-entry-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={selectedMood ? 'Write a short note about your day...' : 'Select a mood first...'}
        maxLength={NOTE_MAX}
        disabled={!selectedMood || submitting}
      />

      <div className="daily-entry-footer">
        <span className="daily-entry-char-count">{note.length}/{NOTE_MAX}</span>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}

export { MOODS };
