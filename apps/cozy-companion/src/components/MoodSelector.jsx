const MOODS = [
  { label: 'Happy', emoji: '(^ v ^)' },
  { label: 'Calm', emoji: '(- _ -)' },
  { label: 'Tired', emoji: '(= _ =)' },
  { label: 'Stressed', emoji: '(> _ <)' },
];

function MoodSelector({ selectedMood, onSelect }) {
  return (
    <div className="mood-selector">
      <h2 className="section-title">How are you feeling?</h2>
      <div className="mood-grid">
        {MOODS.map((mood) => (
          <button
            key={mood.label}
            className={`mood-btn${selectedMood === mood.label ? ' mood-btn--active' : ''}`}
            onClick={() => onSelect(mood.label)}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MoodSelector;
