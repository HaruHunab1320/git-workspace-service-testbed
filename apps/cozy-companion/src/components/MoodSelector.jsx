import { PastelButton, PastelTooltip } from '@cozy-village/ui';

const MOODS = [
  { id: 'happy', label: 'Happy', icon: '^_^', variant: 'peach', description: 'Feeling cheerful and bright' },
  { id: 'calm', label: 'Calm', icon: '-.-', variant: 'mint', description: 'Peaceful and relaxed' },
  { id: 'tired', label: 'Tired', icon: 'u.u', variant: 'lavender', description: 'Low energy, need rest' },
  { id: 'excited', label: 'Excited', icon: '*.*', variant: 'sky', description: 'Full of energy!' },
  { id: 'anxious', label: 'Anxious', icon: 'o.o', variant: 'blush', description: 'Feeling uneasy' },
];

export default function MoodSelector({ selected, onSelect }) {
  return (
    <div className="mood-selector">
      <div className="mood-grid">
        {MOODS.map((mood) => {
          const isActive = selected === mood.id;
          return (
            <PastelTooltip key={mood.id} text={mood.description} position="bottom">
              <button
                className={`mood-option ${isActive ? `mood-option--active mood-option--${mood.variant}` : ''}`}
                onClick={() => onSelect(mood.id)}
                aria-pressed={isActive}
              >
                <span className="mood-option__face">{mood.icon}</span>
                <span className="mood-option__label">{mood.label}</span>
              </button>
            </PastelTooltip>
          );
        })}
      </div>
      {selected && (
        <div className="mood-selector__current">
          <PastelButton variant="ghost" size="sm" onClick={() => onSelect(null)}>
            Clear mood
          </PastelButton>
        </div>
      )}
    </div>
  );
}
