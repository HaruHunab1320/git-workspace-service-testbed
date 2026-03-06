import { PastelButton } from '@cozy-village/ui';

const MOODS = [
  { id: 'happy', label: 'Happy', variant: 'peach' },
  { id: 'calm', label: 'Calm', variant: 'mint' },
  { id: 'tired', label: 'Tired', variant: 'lavender' },
  { id: 'excited', label: 'Excited', variant: 'sky' },
  { id: 'anxious', label: 'Anxious', variant: 'blush' },
];

export default function MoodSelector({ selected, onSelect }) {
  return (
    <div className="mood-grid">
      {MOODS.map((mood) => (
        <PastelButton
          key={mood.id}
          variant={selected === mood.id ? mood.variant : 'ghost'}
          size="sm"
          onClick={() => onSelect(mood.id)}
        >
          {mood.label}
        </PastelButton>
      ))}
    </div>
  );
}
