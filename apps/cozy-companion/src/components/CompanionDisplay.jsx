import { PastelBadge } from '@cozy-village/ui';

const COMPANION_ART = {
  default: `
    /\\_/\\
   ( o.o )
    > ^ <
   /|   |\\
  (_|   |_)`,
  happy: `
    /\\_/\\
   ( ^.^ )
    > ~ <
   /|   |\\
  (_|   |_)`,
  calm: `
    /\\_/\\
   ( -.- )
    > ~ <
   /|   |\\
  (_|   |_)`,
  tired: `
    /\\_/\\
   ( u.u )
    > . <
  z/|   |\\
  (_|   |_)`,
  excited: `
    /\\_/\\
   ( *.* )
    > w <
   /|   |\\!
  (_|   |_)`,
  anxious: `
    /\\_/\\
   ( o.o )
    > ~ <
   /| ~ |\\
  (_|   |_)`,
};

const MOOD_MESSAGES = {
  happy: "Your companion is purring contentedly!",
  calm: "A peaceful moment together...",
  tired: "Let's take it easy today.",
  excited: "So much energy! What an adventure!",
  anxious: "It's okay. Deep breaths together.",
};

export default function CompanionDisplay({ mood }) {
  const art = COMPANION_ART[mood] || COMPANION_ART.default;
  const message = mood ? MOOD_MESSAGES[mood] : "Hello! How are you today?";
  const badgeVariant = {
    happy: 'lemon',
    calm: 'mint',
    tired: 'lavender',
    excited: 'peach',
    anxious: 'sky',
  }[mood] || 'lavender';

  return (
    <div className="companion-display">
      <pre className="companion-ascii">{art}</pre>
      <span className="companion-name">Mochi</span>
      {mood && <PastelBadge variant={badgeVariant}>{mood}</PastelBadge>}
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pastel-text-muted)', textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
}
