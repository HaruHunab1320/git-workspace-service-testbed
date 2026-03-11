import { useState } from 'react';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤩', label: 'Excited' },
];

function App() {
  const [selectedMood, setSelectedMood] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Mood Journal</h1>
        <p className="subtitle">Track how you feel, one day at a time</p>
      </header>

      <main className="main">
        <section className="mood-picker">
          <h2 className="section-title">How are you feeling today?</h2>
          <div className="mood-grid">
            {MOODS.map((mood) => (
              <button
                key={mood.label}
                className={`mood-btn${selectedMood === mood.label ? ' mood-btn--active' : ''}`}
                onClick={() => setSelectedMood(mood.label)}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-label">{mood.label}</span>
              </button>
            ))}
          </div>
          {selectedMood && (
            <p className="mood-confirmation">
              You're feeling <strong>{selectedMood.toLowerCase()}</strong>{' '}
              today.
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Part of the Cozy Village universe</p>
      </footer>
    </div>
  );
}

export default App;
