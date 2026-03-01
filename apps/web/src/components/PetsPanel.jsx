import { useState } from 'react';
import PetCard from './PetCard';
import AdoptModal from './AdoptModal';
import './PetsPanel.css';

export default function PetsPanel({ pets, onRefresh, showToast }) {
  const [showAdopt, setShowAdopt] = useState(false);
  const petList = Object.values(pets || {});

  return (
    <div className="pets-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="card-title" style={{ margin: 0 }}>🐾 Pet Companions</h3>
        <button className="btn btn-primary" onClick={() => setShowAdopt(true)}>
          🏠 Adopt
        </button>
      </div>

      {petList.length === 0 ? (
        <div className="card">
          <p>No pets yet! Adopt a companion to get started.</p>
        </div>
      ) : (
        <div className="pet-grid">
          {petList.map((p) => (
            <PetCard
              key={p.name}
              pet={p}
              onRefresh={onRefresh}
              showToast={showToast}
            />
          ))}
        </div>
      )}

      {showAdopt && (
        <AdoptModal
          onClose={() => setShowAdopt(false)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}
    </div>
  );
}
