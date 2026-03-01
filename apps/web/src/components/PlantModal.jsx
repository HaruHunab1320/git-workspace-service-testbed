import { useState, useEffect } from 'react';
import { api } from '../api';

export default function PlantModal({ row, col, season, onClose, onRefresh, showToast }) {
  const [crops, setCrops] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAvailableCrops();
        setCrops(data);
        if (data.length > 0) setSelected(data[0].name);
      } catch (err) {
        showToast('Failed to load crops');
      }
      setLoading(false);
    })();
  }, [showToast]);

  const handlePlant = async () => {
    if (!selected) return;
    try {
      const result = await api.plantCrop(row, col, selected);
      showToast(result.message);
      await onRefresh();
      onClose();
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🌱 Plant a Crop</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--brown-light)', marginBottom: 12 }}>
          Plot ({row}, {col}) &middot; Season: {season}
        </p>

        {loading ? (
          <p>Loading available crops...</p>
        ) : crops.length === 0 ? (
          <p>No crops available this season.</p>
        ) : (
          <>
            <div className="form-group">
              <label>Select Crop</label>
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {crops.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.is_magical ? '✨ ' : ''}{c.name} — {c.days_to_grow} days, {c.base_sell_price} coins
                  </option>
                ))}
              </select>
            </div>

            {selected && (() => {
              const crop = crops.find((c) => c.name === selected);
              if (!crop) return null;
              return (
                <div style={{
                  padding: 12, background: 'var(--cream)', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem', marginBottom: 8,
                }}>
                  <div><strong>{crop.name}</strong> {crop.is_magical ? '✨ Magical' : ''}</div>
                  <div style={{ color: 'var(--brown-light)', marginTop: 4 }}>{crop.description}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>⏱ {crop.days_to_grow} days</span>
                    <span>💧 Water: {crop.water_needs}/3</span>
                    <span>💰 {crop.base_sell_price} coins</span>
                    {crop.regrows && <span>🔄 Regrows ({crop.regrow_days}d)</span>}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handlePlant}
            disabled={!selected || loading}
          >
            🌱 Plant
          </button>
        </div>
      </div>
    </div>
  );
}
