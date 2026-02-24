import { api } from '../api';

const SPECIES_EMOJI = {
  cat: '🐱', dog: '🐶', rabbit: '🐰',
  owl: '🦉', fox: '🦊', hedgehog: '🦔',
};

const MOOD_EMOJI = {
  ecstatic: '🤩', happy: '😄', content: '😊',
  restless: '😟', lonely: '😢',
};

const BOND_MAX = 150;

export default function PetCard({ pet, onRefresh, showToast }) {
  const bondPercent = Math.min(100, Math.round((pet.bond_points / BOND_MAX) * 100));

  const handleAction = async (action) => {
    try {
      let result;
      if (action === 'pet') result = await api.petInteraction(pet.name);
      else if (action === 'feed') result = await api.feedPet(pet.name);
      else if (action === 'play') result = await api.playWithPet(pet.name);
      showToast(result.message);
      await onRefresh();
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="card pet-card">
      <div className="pet-header">
        <span className="pet-species-emoji">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
        <div>
          <div className="pet-name">{pet.name}</div>
          <div className="pet-subtitle">
            {pet.species} &middot; {pet.personality}
          </div>
        </div>
        <span className="pet-mood">{MOOD_EMOJI[pet.mood] || '😊'}</span>
      </div>

      <div className="pet-stat">
        <span className="pet-stat-label">Bond ({pet.bond_tier})</span>
        <div className="progress-bar">
          <div className="progress-fill rose" style={{ width: `${bondPercent}%` }} />
        </div>
        <span className="pet-stat-val">{pet.bond_points} pts</span>
      </div>

      <div className="pet-stat">
        <span className="pet-stat-label">Energy</span>
        <div className="progress-bar">
          <div className="progress-fill sage" style={{ width: `${pet.energy}%` }} />
        </div>
        <span className="pet-stat-val">{pet.energy}/100</span>
      </div>

      <div className="pet-detail">
        🎯 {pet.activity}
      </div>

      <div className="pet-detail">
        📅 {pet.days_owned} days together
      </div>

      {pet.found_items.length > 0 && (
        <div className="pet-items">
          <strong>Found Items ({pet.found_items.length}):</strong>
          <div className="pet-items-list">
            {pet.found_items.slice(-5).map((item, i) => (
              <span key={i} className={`pet-item rarity-${item.rarity}`} title={item.description}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pet-actions">
        <button className="btn btn-sm btn-primary" onClick={() => handleAction('pet')}>
          ❤️ Pet
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => handleAction('feed')}>
          🍖 Feed
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => handleAction('play')}>
          🎾 Play
        </button>
      </div>
    </div>
  );
}
