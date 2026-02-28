import { useState, useEffect } from 'react';
import './SwarmBadge.css';

const SWARM_TYPES = {
  fireflies: { emoji: '\u{1FAB2}', label: 'Fireflies', color: 'golden' },
  butterflies: { emoji: '\u{1F98B}', label: 'Butterflies', color: 'rose' },
  birds: { emoji: '\u{1F426}', label: 'Songbirds', color: 'sky' },
  bees: { emoji: '\u{1F41D}', label: 'Bees', color: 'amber' },
  dragonflies: { emoji: '\u{1FAB0}', label: 'Dragonflies', color: 'teal' },
};

export default function SwarmBadge({ type = 'fireflies', count = 0, active = false }) {
  const swarm = SWARM_TYPES[type] || SWARM_TYPES.fireflies;
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (active) {
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(id);
    }
  }, [count, active]);

  return (
    <div className={`swarm-badge swarm-badge--${swarm.color} ${active ? 'swarm-badge--active' : ''} ${pulse ? 'swarm-badge--pulse' : ''}`}>
      <span className="swarm-badge__icon">{swarm.emoji}</span>
      <span className="swarm-badge__label">{swarm.label}</span>
      {count > 0 && <span className="swarm-badge__count">{count}</span>}
    </div>
  );
}
