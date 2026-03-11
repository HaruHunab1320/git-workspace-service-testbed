import { useState, useEffect, useRef, useCallback } from 'react';
import './TeaBrewingStation.css';

/* delta */

const TEAS = [
  {
    id: 'green',
    name: 'Green Tea',
    emoji: '🍵',
    steepTime: 12,
    color: '#a8c5a0',
    darkColor: '#7a9e72',
    description: 'Light and grassy with a gentle sweetness',
    idealTemp: 175,
    tempLabel: 'Below boiling',
    pairsWith: 'A light rice cracker or a quiet moment in the garden',
    origin: 'Japanese highlands',
    caffeine: 'Medium',
  },
  {
    id: 'black',
    name: 'Black Tea',
    emoji: '🫖',
    steepTime: 16,
    color: '#8b4513',
    darkColor: '#5c2d0e',
    description: 'Bold and malty, a morning classic',
    idealTemp: 212,
    tempLabel: 'Full boil',
    pairsWith: 'A warm scone with clotted cream',
    origin: 'Assam valley',
    caffeine: 'High',
  },
  {
    id: 'chamomile',
    name: 'Chamomile',
    emoji: '🌼',
    steepTime: 20,
    color: '#e8d478',
    darkColor: '#c4a83a',
    description: 'Floral and calming, perfect for evening',
    idealTemp: 200,
    tempLabel: 'Just off boil',
    pairsWith: 'A good book and a soft blanket',
    origin: 'Meadow wildflowers',
    caffeine: 'None',
  },
  {
    id: 'earl_grey',
    name: 'Earl Grey',
    emoji: '🫖',
    steepTime: 14,
    color: '#6b5b95',
    darkColor: '#4a3d6b',
    description: 'Fragrant bergamot meets smooth black tea',
    idealTemp: 208,
    tempLabel: 'Near boil',
    pairsWith: 'A slice of lemon cake or a rainy afternoon',
    origin: 'English tradition',
    caffeine: 'Medium-High',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    emoji: '🍃',
    steepTime: 10,
    color: '#5a8a3c',
    darkColor: '#3d6128',
    description: 'Vibrant and earthy with umami depth',
    idealTemp: 170,
    tempLabel: 'Gentle heat',
    pairsWith: 'A small mochi or a mindful pause',
    origin: 'Uji, Japan',
    caffeine: 'High',
  },
  {
    id: 'oolong',
    name: 'Oolong',
    emoji: '🍂',
    steepTime: 18,
    color: '#c4823a',
    darkColor: '#96622a',
    description: 'Complex and toasty with a sweet finish',
    idealTemp: 195,
    tempLabel: 'Medium-high',
    pairsWith: 'A handful of roasted nuts or a sunset view',
    origin: 'Fujian mountains',
    caffeine: 'Medium',
  },
  {
    id: 'peppermint',
    name: 'Peppermint',
    emoji: '🌿',
    steepTime: 15,
    color: '#7ecba1',
    darkColor: '#4a9e6e',
    description: 'Cool and refreshing, clears the mind',
    idealTemp: 200,
    tempLabel: 'Just off boil',
    pairsWith: 'Dark chocolate or a crisp winter morning',
    origin: 'Herb garden',
    caffeine: 'None',
  },
  {
    id: 'rooibos',
    name: 'Rooibos',
    emoji: '🌺',
    steepTime: 22,
    color: '#c4564a',
    darkColor: '#963a32',
    description: 'Naturally sweet and nutty, caffeine-free warmth',
    idealTemp: 212,
    tempLabel: 'Full boil',
    pairsWith: 'Honeyed toast or a cozy fireside chat',
    origin: 'South African bush',
    caffeine: 'None',
  },
];

const ADDITIONS = [
  { id: 'none', label: 'Plain', emoji: '✨' },
  { id: 'honey', label: 'Honey', emoji: '🍯' },
  { id: 'milk', label: 'Milk', emoji: '🥛' },
  { id: 'lemon', label: 'Lemon', emoji: '🍋' },
  { id: 'sugar', label: 'Sugar', emoji: '🧂' },
];

const COZY_MESSAGES = [
  'Take a deep breath and let the warmth settle in...',
  'The kettle hums a gentle lullaby...',
  'Steam curls upward like a whispered secret...',
  'The aroma fills the room with quiet comfort...',
  'A perfect moment, held in a cup...',
  'Let the world slow down, one sip at a time...',
  'Warmth radiates from cup to soul...',
  'The tea leaves share their ancient stories...',
];

const JOURNAL_KEY = 'cozy-village-tea-journal';

function loadJournal() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJournal(entries) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}

export default function TeaBrewingStation({ showToast }) {
  const [selectedTea, setSelectedTea] = useState(null);
  const [addition, setAddition] = useState('none');
  const [brewing, setBrewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [cozyMessage, setCozyMessage] = useState('');
  const [journal, setJournal] = useState(loadJournal);
  const [showJournal, setShowJournal] = useState(false);
  const intervalRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (messageRef.current) clearInterval(messageRef.current);
    };
  }, []);

  const pickCozyMessage = useCallback(() => {
    setCozyMessage(
      COZY_MESSAGES[Math.floor(Math.random() * COZY_MESSAGES.length)]
    );
  }, []);

  const startBrewing = (tea) => {
    if (brewing) return;
    setSelectedTea(tea);
    setBrewing(true);
    setDone(false);
    setProgress(0);
    pickCozyMessage();

    messageRef.current = setInterval(pickCozyMessage, 4000);

    const step = 100 / (tea.steepTime * 10);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(intervalRef.current);
          clearInterval(messageRef.current);
          intervalRef.current = null;
          messageRef.current = null;
          setBrewing(false);
          setDone(true);
          if (showToast) showToast(`${tea.emoji} Your ${tea.name} is ready!`);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (messageRef.current) clearInterval(messageRef.current);
    intervalRef.current = null;
    messageRef.current = null;
    setBrewing(false);
    setDone(false);
    setProgress(0);
    setSelectedTea(null);
    setAddition('none');
    setCozyMessage('');
  };

  const saveToJournal = () => {
    if (!selectedTea) return;
    const entry = {
      id: Date.now(),
      tea: selectedTea.name,
      teaId: selectedTea.id,
      emoji: selectedTea.emoji,
      addition:
        addition !== 'none'
          ? ADDITIONS.find((a) => a.id === addition)?.label
          : null,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
    const updated = [entry, ...journal].slice(0, 50);
    setJournal(updated);
    saveJournal(updated);
    if (showToast) showToast('📝 Saved to your tea journal!');
  };

  const clearJournal = () => {
    setJournal([]);
    saveJournal([]);
    if (showToast) showToast('Tea journal cleared');
  };

  const additionObj = ADDITIONS.find((a) => a.id === addition);

  const teaColor = selectedTea
    ? `color-mix(in srgb, transparent ${100 - progress}%, ${selectedTea.color})`
    : 'transparent';

  const milkOverlay = addition === 'milk' && progress > 20;
  const steamOpacity = brewing ? 0.3 + (progress / 100) * 0.5 : done ? 0.6 : 0;

  const totalCups = journal.length;
  const favoriteTea =
    journal.length > 0
      ? Object.entries(
          journal.reduce((acc, e) => {
            acc[e.tea] = (acc[e.tea] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null;

  return (
    <div className="tea-station" data-agent="delta">
      <div className="card tea-header-card">
        <h2 className="card-title">🍵 Tea Brewing Station</h2>
        <p className="tea-subtitle">
          Select a tea, customize your cup, and watch it steep
        </p>
        {totalCups > 0 && (
          <div className="tea-stats-row">
            <span className="tea-stat">
              ☕ {totalCups} cup{totalCups !== 1 ? 's' : ''} brewed
            </span>
            {favoriteTea && (
              <span className="tea-stat">❤️ Favorite: {favoriteTea}</span>
            )}
          </div>
        )}
      </div>

      <div className="tea-selection">
        {TEAS.map((tea) => (
          <button
            key={tea.id}
            className={`tea-option ${selectedTea?.id === tea.id ? 'selected' : ''}`}
            onClick={() => startBrewing(tea)}
            disabled={brewing}
          >
            <span className="tea-option-emoji">{tea.emoji}</span>
            <span className="tea-option-name">{tea.name}</span>
            <span className="tea-option-time">{tea.steepTime}s</span>
            <span className="tea-option-temp">{tea.idealTemp}°F</span>
          </button>
        ))}
      </div>

      {selectedTea && !done && (
        <div className="tea-additions card">
          <h3 className="additions-title">Add something?</h3>
          <div className="additions-row">
            {ADDITIONS.map((a) => (
              <button
                key={a.id}
                className={`addition-btn ${addition === a.id ? 'active' : ''}`}
                onClick={() => setAddition(a.id)}
                disabled={done}
              >
                <span className="addition-emoji">{a.emoji}</span>
                <span className="addition-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tea-brewing-area card">
        <div className="teacup-scene">
          {(brewing || done) && (
            <div className="steam-container" style={{ opacity: steamOpacity }}>
              <div className="steam steam-1" />
              <div className="steam steam-2" />
              <div className="steam steam-3" />
              <div className="steam steam-4" />
              <div className="steam steam-5" />
            </div>
          )}

          <div className="teacup">
            <div className="teacup-body">
              <div className="tea-liquid" style={{ background: teaColor }}>
                {milkOverlay && <div className="tea-milk-swirl" />}
                {addition === 'lemon' && progress > 30 && (
                  <div className="tea-lemon-slice" />
                )}
              </div>
              {brewing && (
                <div className="tea-bag">
                  <div className="tea-bag-string" />
                  <div className="tea-bag-body" />
                  <div className="tea-bag-tag" />
                </div>
              )}
              {addition === 'honey' && progress > 15 && (
                <div className="tea-honey-drizzle" />
              )}
            </div>
            <div className="teacup-handle" />
            <div className="teacup-saucer" />
          </div>
        </div>

        {brewing && cozyMessage && (
          <div className="cozy-message">{cozyMessage}</div>
        )}

        {selectedTea && (
          <div className="brew-info">
            <div className="brew-tea-name">
              {selectedTea.emoji} {selectedTea.name}
              {addition !== 'none' && (
                <span className="brew-addition-tag">
                  {' '}
                  + {additionObj?.emoji} {additionObj?.label}
                </span>
              )}
            </div>
            <p className="brew-description">{selectedTea.description}</p>

            <div className="brew-details-row">
              <span className="brew-detail">🌡️ {selectedTea.idealTemp}°F</span>
              <span className="brew-detail">⏱️ {selectedTea.steepTime}s</span>
              <span className="brew-detail">☕ {selectedTea.caffeine}</span>
            </div>

            <div className="steep-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${selectedTea.color}, ${selectedTea.darkColor})`,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <div className="steep-label">
                {brewing
                  ? `Steeping... ${Math.round(progress)}%`
                  : done
                    ? 'Ready to enjoy!'
                    : 'Waiting...'}
              </div>
            </div>

            {done && (
              <div className="done-actions">
                <button className="btn btn-primary" onClick={reset}>
                  Brew Another
                </button>
                <button className="btn btn-secondary" onClick={saveToJournal}>
                  📝 Save to Journal
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedTea && (
          <div className="brew-placeholder">
            <span className="brew-placeholder-icon">🫖</span>
            <span>Choose a tea above to begin brewing</span>
          </div>
        )}
      </div>

      {selectedTea && done && (
        <div className="card tea-notes-card">
          <h3 className="card-title">Tasting Notes</h3>
          <div className="tasting-notes">
            <div className="note-item">
              <span className="note-label">Type</span>
              <span className="note-value">{selectedTea.name}</span>
            </div>
            <div className="note-item">
              <span className="note-label">Origin</span>
              <span className="note-value">{selectedTea.origin}</span>
            </div>
            <div className="note-item">
              <span className="note-label">Steep Time</span>
              <span className="note-value">
                {selectedTea.steepTime}s at {selectedTea.idealTemp}°F
              </span>
            </div>
            <div className="note-item">
              <span className="note-label">Caffeine</span>
              <span className="note-value">{selectedTea.caffeine}</span>
            </div>
            {addition !== 'none' && (
              <div className="note-item">
                <span className="note-label">Addition</span>
                <span className="note-value">
                  {additionObj?.emoji} {additionObj?.label}
                </span>
              </div>
            )}
            <div className="note-item">
              <span className="note-label">Character</span>
              <span className="note-value">{selectedTea.description}</span>
            </div>
            <div
              className="note-swatch"
              style={{
                background: `linear-gradient(90deg, ${selectedTea.color}, ${selectedTea.darkColor})`,
              }}
            />
          </div>

          <div className="tea-pairing">
            <span className="pairing-label">Pairs well with</span>
            <span className="pairing-value">{selectedTea.pairsWith}</span>
          </div>
        </div>
      )}

      <div className="card tea-journal-card">
        <button
          className="journal-toggle"
          onClick={() => setShowJournal(!showJournal)}
        >
          <h3 className="card-title">📓 Tea Journal</h3>
          <span className="journal-chevron">{showJournal ? '▲' : '▼'}</span>
        </button>

        {showJournal && (
          <div className="journal-content">
            {journal.length === 0 ? (
              <div className="journal-empty">
                <span>No brews recorded yet.</span>
                <span className="journal-empty-hint">
                  Brew a tea and save it to start your journal!
                </span>
              </div>
            ) : (
              <>
                <div className="journal-entries">
                  {journal.map((entry) => (
                    <div key={entry.id} className="journal-entry">
                      <span className="journal-entry-emoji">{entry.emoji}</span>
                      <div className="journal-entry-info">
                        <span className="journal-entry-name">
                          {entry.tea}
                          {entry.addition && (
                            <span className="journal-entry-addition">
                              {' '}
                              + {entry.addition}
                            </span>
                          )}
                        </span>
                        <span className="journal-entry-date">{entry.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-text journal-clear"
                  onClick={clearJournal}
                >
                  Clear journal
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
