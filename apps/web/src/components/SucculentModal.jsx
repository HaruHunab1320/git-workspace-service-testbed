import { useState, useEffect } from 'react';
import { api } from '../api';

export default function SucculentModal({
  row,
  col,
  onClose,
  onRefresh,
  showToast,
}) {
  const [succulents, setSucculents] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAvailableSucculents();
        setSucculents(data);
        if (data.length > 0) setSelected(data[0].name);
      } catch (err) {
        showToast('Failed to load succulents');
      }
      setLoading(false);
    })();
  }, [showToast]);

  const handlePlace = async () => {
    if (!selected) return;
    try {
      const result = await api.placeSucculent(row, col, selected);
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
        <h2>🪴 Plant a Succulent</h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--brown-light)',
            marginBottom: 12,
          }}
        >
          Tile ({row}, {col})
        </p>

        {loading ? (
          <p>Loading succulents...</p>
        ) : succulents.length === 0 ? (
          <p>No succulents available.</p>
        ) : (
          <>
            <div className="form-group">
              <label>Select Succulent</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {succulents.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.emoji} {s.is_rare ? '✨ ' : ''}
                    {s.name} — {s.days_to_mature} days
                  </option>
                ))}
              </select>
            </div>

            {selected &&
              (() => {
                const succulent = succulents.find((s) => s.name === selected);
                if (!succulent) return null;
                return (
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--cream)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <strong>
                        {succulent.emoji} {succulent.name}
                      </strong>
                      {succulent.is_rare && (
                        <span style={{ marginLeft: 8, color: 'var(--rose)' }}>
                          Rare
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--brown-light)', marginTop: 4 }}>
                      {succulent.description}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>⏱ {succulent.days_to_mature} days to mature</span>
                      <span>💧 Tolerance: {succulent.water_tolerance}/3</span>
                      {succulent.bloom_color && (
                        <span>🌸 Bloom: {succulent.bloom_color}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePlace}
            disabled={!selected || loading}
          >
            🪴 Plant
          </button>
        </div>
      </div>
    </div>
  );
}
