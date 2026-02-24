import { useState, useEffect } from 'react';
import { api } from '../api';

const SPECIES_EMOJI = {
  cat: '🐱', dog: '🐶', rabbit: '🐰',
  owl: '🦉', fox: '🦊', hedgehog: '🦔',
};

export default function AdoptModal({ onClose, onRefresh, showToast }) {
  const [adoptable, setAdoptable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdoptable();
        setAdoptable(data);
      } catch (err) {
        showToast('Failed to load adoptable pets');
      }
      setLoading(false);
    })();
  }, [showToast]);

  const handleAdopt = async (pet) => {
    try {
      await api.adoptPet(pet.name, pet.species, pet.personality);
      showToast(`Welcome home, ${pet.name}!`);
      await onRefresh();
      onClose();
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🏠 Adopt a Pet</h2>

        {loading ? (
          <p>Loading...</p>
        ) : adoptable.length === 0 ? (
          <p>All pets have been adopted!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {adoptable.map((pet) => (
              <div key={pet.name} style={{
                padding: 12, background: 'var(--cream)', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: '2rem' }}>
                  {SPECIES_EMOJI[pet.species] || '🐾'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{pet.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--brown-light)', textTransform: 'capitalize' }}>
                    {pet.species} &middot; {pet.personality}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: 2 }}>
                    {pet.bio}
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => handleAdopt(pet)}>
                  Adopt
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
