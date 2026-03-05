import { useState } from 'react';

function App() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEntry = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      date: new Date().toLocaleDateString(),
    };

    setEntries([newEntry, ...entries]);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Dream Log</h1>
        <p className="subtitle">Record your dreams, one night at a time</p>
      </header>

      <main className="main">
        <form className="dream-form" onSubmit={handleSubmit}>
          <input
            className="dream-input"
            type="text"
            placeholder="Dream title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="dream-textarea"
            placeholder="Describe your dream..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <button className="dream-submit" type="submit">
            Log Dream
          </button>
        </form>

        <section className="dream-list">
          {entries.map((entry) => (
            <div key={entry.id} className="dream-card">
              <div className="dream-card-header">
                <h3 className="dream-card-title">{entry.title}</h3>
                <span className="dream-card-date">{entry.date}</span>
              </div>
              {entry.description && (
                <p className="dream-card-description">{entry.description}</p>
              )}
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        <p>Part of the Cozy Village universe</p>
      </footer>
    </div>
  );
}

export default App;
