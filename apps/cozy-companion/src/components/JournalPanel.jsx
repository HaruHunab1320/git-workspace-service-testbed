import { useState, useCallback } from 'react';
import {
  PastelCard,
  PastelTextarea,
  PastelButton,
  PastelDivider,
  PastelBadge,
} from '@cozy-village/ui';

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem('cozy-journal') || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem('cozy-journal', JSON.stringify(entries));
  } catch {
    // storage unavailable
  }
}

export default function JournalPanel({ showToast }) {
  const [entries, setEntries] = useState(loadEntries);
  const [draft, setDraft] = useState('');

  const addEntry = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    const entry = {
      id: Date.now(),
      text,
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setDraft('');
    showToast?.('Entry saved', 'success');
  }, [draft, entries, showToast]);

  const deleteEntry = useCallback((id) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }, [entries]);

  return (
    <PastelCard title="Journal" icon="#" glow="lavender" padding="lg">
      <PastelTextarea
        placeholder="What's on your mind? Write freely..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
      />
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <PastelButton variant="mint" onClick={addEntry} disabled={!draft.trim()}>
          Save Entry
        </PastelButton>
      </div>

      {entries.length > 0 && (
        <>
          <PastelDivider label="Past Entries" />
          <div className="journal-entries">
            {entries.map((entry) => (
              <div key={entry.id} className="journal-entry">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="journal-entry__date">{entry.date}</span>
                  <PastelButton variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                    x
                  </PastelButton>
                </div>
                <p className="journal-entry__text">{entry.text}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {entries.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--pastel-text-soft)', marginTop: '16px', fontSize: 'var(--font-size-sm)' }}>
          No entries yet. Start writing to capture your thoughts.
        </p>
      )}
    </PastelCard>
  );
}
