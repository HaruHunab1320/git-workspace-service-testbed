import { useState } from 'react';
import { api } from '../api';
import './JournalPanel.css';

const PROMPTS = [
  'What made you smile today in the village?',
  'What are you grateful for this season?',
  'A small moment of joy from today...',
  'Something beautiful you noticed...',
  'A villager interaction that warmed your heart...',
  'What made today special?',
];

export default function JournalPanel({ entries, day, season, onRefresh, showToast }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const placeholder = PROMPTS[day % PROMPTS.length];

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.addJournalEntry(text.trim());
      setText('');
      await onRefresh();
      showToast('Journal entry saved!');
    } catch (err) {
      showToast('Failed to save entry');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteJournalEntry(id);
      await onRefresh();
    } catch (err) {
      showToast('Failed to delete entry');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
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
      <div className="card journal-compose">
        <h3 className="card-title">Today&apos;s Gratitude</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={500}
          disabled={submitting}
        />
        <div className="journal-compose-footer">
          <span className="journal-char-count">{text.length}/500</span>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card journal-empty">
          <span className="journal-empty-icon">📓</span>
          <p>Your journal is empty.</p>
          <p>Write your first gratitude entry above!</p>
        </div>
      ) : (
        <div className="journal-entries">
          {dayKeys.map((dayLabel) => (
            <div key={dayLabel} className="journal-day-group">
              <div className="journal-day-label">{dayLabel}</div>
              {grouped[dayLabel].map((entry) => (
                <div key={entry.id} className="journal-entry">
                  <div className="journal-entry-header">
                    <span>Entry #{entry.id}</span>
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
