import VillagerCard from './VillagerCard';
import './VillagersPanel.css';

export default function VillagersPanel({ villagers, onRefresh, showToast }) {
  const list = Object.values(villagers || {});

  if (list.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Villagers</h3>
        <p>No villagers found.</p>
      </div>
    );
  }

  return (
    <div className="villagers-panel">
      <div className="villager-grid">
        {list.map((v) => (
          <VillagerCard
            key={v.id}
            villager={v}
            onRefresh={onRefresh}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}
