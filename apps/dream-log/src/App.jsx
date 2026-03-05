import { useState, useCallback } from 'react';
import { useDreamJournal } from './hooks/useDreamJournal';

const MOODS = [
  { emoji: '😴', label: 'Restful', value: 'restful' },
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😨', label: 'Scary', value: 'scary' },
  { emoji: '😕', label: 'Confusing', value: 'confusing' },
  { emoji: '🤩', label: 'Vivid', value: 'vivid' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '✨', label: 'Magical', value: 'magical' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
];

function App() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useDreamJournal();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMood('');
    setTags([]);
    setTagInput('');
    setEditingId(null);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (editingId) {
      await updateEntry(editingId, { title: title.trim(), content: content.trim(), mood, tags });
      showToast('Dream updated');
    } else {
      await addEntry({ title: title.trim(), content: content.trim(), mood, tags });
      showToast('Dream logged');
    }
    resetForm();
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setTitle(entry.title || '');
    setContent(entry.content);
    setMood(entry.mood || '');
    setTags(entry.tags || []);
  };

  const handleDelete = async (id) => {
    await deleteEntry(id);
    if (editingId === id) resetForm();
    showToast('Dream removed');
  };

  const moodLabel = (value) => {
    const m = MOODS.find((m) => m.value === value);
    return m ? `${m.emoji} ${m.label}` : '';
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Dream Log</h1>
        <p className="subtitle">Record your dreams, one night at a time</p>
      </header>

      <main>
        <section className="card">
          <h2 className="section-title">
            {editingId ? 'Edit Dream' : 'Log a Dream'}
          </h2>
          <div className="dream-form">
            <div className="form-row">
              <label className="form-label">Title</label>
              <input
                type="text"
                placeholder="Give your dream a name..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="form-label">What happened?</label>
              <textarea
                placeholder="Describe your dream..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div className="form-row">
              <label className="form-label">How did it feel?</label>
              <div className="mood-grid">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    className={`mood-btn${mood === m.value ? ' mood-btn--active' : ''}`}
                    onClick={() => setMood(mood === m.value ? '' : m.value)}
                    type="button"
                  >
                    <span className="mood-emoji">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Tags</label>
              <div className="tag-input-row">
                <input
                  type="text"
                  placeholder="e.g. flying, water, chase..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button className="btn btn-secondary btn-small" onClick={handleAddTag} type="button">
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="tag-list">
                  {tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                      <button onClick={() => handleRemoveTag(t)} type="button">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="actions">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!content.trim()}
              >
                {editingId ? 'Update' : 'Save Dream'}
              </button>
              {editingId && (
                <button className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Dream Journal</h2>
          {loading ? (
            <p className="empty-state">Loading dreams...</p>
          ) : entries.length === 0 ? (
            <p className="empty-state">No dreams recorded yet. Sweet dreams await!</p>
          ) : (
            <ul className="entry-list">
              {entries.map((entry) => (
                <li key={entry.id} className="entry-item">
                  <div className="entry-header">
                    <span className="entry-title">
                      {entry.mood && <span className="entry-mood">{moodLabel(entry.mood).split(' ')[0]}</span>}
                      {entry.title || 'Untitled Dream'}
                    </span>
                    <span className="entry-meta">
                      {entry.season && `${entry.season} `}Day {entry.day}
                    </span>
                  </div>
                  <p className="entry-content">{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="entry-tags tag-list">
                      {entry.tags.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="actions">
                    <button className="btn btn-secondary btn-small" onClick={() => handleEdit(entry)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(entry.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {toast && <div className="toast">{toast}</div>}

      <footer className="footer">
        <p>Part of the Cozy Village universe</p>
      </footer>
    </div>
  );
}

export default App;
