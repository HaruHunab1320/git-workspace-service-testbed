import { useState, useCallback } from 'react';
import {
  PastelCard,
  PastelTextarea,
  PastelButton,
  PastelDivider,
  PastelBadge,
  PastelModal,
} from '@cozy-village/ui';

const MOOD_TAGS = [
  { id: 'grateful', label: 'Grateful', variant: 'mint' },
  { id: 'reflective', label: 'Reflective', variant: 'lavender' },
  { id: 'hopeful', label: 'Hopeful', variant: 'lemon' },
  { id: 'peaceful', label: 'Peaceful', variant: 'sky' },
  { id: 'challenged', label: 'Challenged', variant: 'peach' },
];

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
  const [selectedTags, setSelectedTags] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const addEntry = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    const entry = {
      id: Date.now(),
      text,
      tags: selectedTags,
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
    setSelectedTags([]);
    showToast?.('Entry saved', 'success');
  }, [draft, entries, selectedTags, showToast]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const updated = entries.filter((e) => e.id !== deleteTarget);
    setEntries(updated);
    saveEntries(updated);
    setDeleteTarget(null);
    showToast?.('Entry removed', 'info');
  }, [deleteTarget, entries, showToast]);

  const filteredEntries = searchQuery
    ? entries.filter((e) =>
        e.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.tags || []).some((t) => t.includes(searchQuery.toLowerCase()))
      )
    : entries;

  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;

  return (
    <PastelCard title="Journal" icon="#" glow="lavender" padding="lg">
      <PastelTextarea
        placeholder="What's on your mind? Write freely..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
      />

      <div className="journal-meta-row">
        <div className="journal-tags">
          {MOOD_TAGS.map((tag) => (
            <PastelBadge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? tag.variant : 'peach'}
              size="sm"
              className={`journal-tag ${selectedTags.includes(tag.id) ? 'journal-tag--selected' : ''}`}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.label}
            </PastelBadge>
          ))}
        </div>
        {draft.trim() && (
          <span className="journal-word-count">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="journal-save-row">
        <PastelButton variant="mint" onClick={addEntry} disabled={!draft.trim()}>
          Save Entry
        </PastelButton>
      </div>

      {entries.length > 0 && (
        <>
          <PastelDivider label="Past Entries" />

          {entries.length > 3 && (
            <div className="journal-search">
              <input
                className="journal-search__input"
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="journal-entries">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="journal-entry">
                <div className="journal-entry__header">
                  <span className="journal-entry__date">{entry.date}</span>
                  <PastelButton variant="ghost" size="sm" onClick={() => setDeleteTarget(entry.id)}>
                    x
                  </PastelButton>
                </div>
                <p className="journal-entry__text">{entry.text}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="journal-entry__tags">
                    {entry.tags.map((tagId) => {
                      const tag = MOOD_TAGS.find((t) => t.id === tagId);
                      return tag ? (
                        <PastelBadge key={tagId} variant={tag.variant} size="sm">
                          {tag.label}
                        </PastelBadge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}

            {filteredEntries.length === 0 && searchQuery && (
              <p className="journal-empty">No entries match your search.</p>
            )}
          </div>
        </>
      )}

      {entries.length === 0 && (
        <p className="journal-empty">
          No entries yet. Start writing to capture your thoughts.
        </p>
      )}

      <PastelModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Entry?"
        icon="?"
        size="sm"
        actions={
          <>
            <PastelButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </PastelButton>
            <PastelButton variant="blush" onClick={confirmDelete}>
              Delete
            </PastelButton>
          </>
        }
      >
        <p>This entry will be removed permanently.</p>
      </PastelModal>
    </PastelCard>
  );
}
