import { useState, useEffect } from 'react';
import { PastelBadge, PastelTooltip } from '@cozy-village/ui';

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

const MOOD_BADGE_VARIANT = {
  happy: 'lemon',
  calm: 'mint',
  tired: 'lavender',
  excited: 'peach',
  anxious: 'sky',
};

const AMBIENT_PARTICLES = {
  happy: ['~', '*', '.'],
  calm: ['~', '.', '-'],
  tired: ['z', '.', '.'],
  excited: ['!', '*', '~'],
  anxious: ['~', '.', '~'],
  default: ['.', '~', '*'],
};

export default function CompanionDisplay({ mood }) {
  const [particleKey, setParticleKey] = useState(0);
  const [blinking, setBlinking] = useState(false);

  // Blink animation cycle
  useEffect(() => {
    let blinkTimeout;
    const interval = setInterval(() => {
      setBlinking(true);
      blinkTimeout = setTimeout(() => setBlinking(false), 200);
    }, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(blinkTimeout);
    };
  }, []);

  // Refresh particles on mood change
  useEffect(() => {
    setParticleKey((k) => k + 1);
  }, [mood]);

  const art = COMPANION_ART[mood] || COMPANION_ART.default;
  const message = mood ? MOOD_MESSAGES[mood] : "Hello! How are you today?";
  const badgeVariant = MOOD_BADGE_VARIANT[mood] || 'lavender';
  const particles = AMBIENT_PARTICLES[mood] || AMBIENT_PARTICLES.default;

  // Replace eyes during blink (patterns: o.o, ^.^, -.-, u.u, *.*)
  const displayArt = blinking
    ? art.replace(/[o^*u\-]\.[o^*u\-]/, '-.-')
    : art;

  return (
    <div className="companion-display">
      <div className="companion-scene">
        <div className="companion-particles" key={particleKey}>
          {particles.map((p, i) => (
            <span
              key={i}
              className="companion-particle"
              style={{
                '--delay': `${i * 1.2}s`,
                '--x-offset': `${(i - 1) * 30}px`,
                '--float-distance': `${20 + i * 8}px`,
              }}
            >
              {p}
            </span>
          ))}
        </div>

        <PastelTooltip text={message} position="top">
          <pre className="companion-ascii">{displayArt}</pre>
        </PastelTooltip>

        <div className="companion-shadow" />
      </div>

      <span className="companion-name">Mochi</span>

      {mood && (
        <PastelBadge variant={badgeVariant} size="md">
          {mood}
        </PastelBadge>
      )}

      <p className="companion-message">{message}</p>
    </div>
  );
}
