import { useState, useEffect } from 'react';
import { api } from '../api';

export default function RockModal({ row, col, onClose, onRefresh, showToast }) {
  const [rocks, setRocks] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAvailableRocks();
        setRocks(data);
        if (data.length > 0) setSelected(data[0].name);
      } catch (err) {
        showToast('Failed to load rocks');
      }
      setLoading(false);
    })();
  }, [showToast]);

  const handlePlace = async () => {
    if (!selected) return;
    try {
      const result = await api.placeRock(row, col, selected);
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
        <h2>🪨 Place a Rock</h2>
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
          <p>Loading rocks...</p>
        ) : rocks.length === 0 ? (
          <p>No rocks available.</p>
        ) : (
          <>
            <div className="form-group">
              <label>Select Rock</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {rocks.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.emoji} {r.is_special ? '✨ ' : ''}
                    {r.name} — {r.size}
                  </option>
                ))}
              </select>
            </div>

            {selected &&
              (() => {
                const rock = rocks.find((r) => r.name === selected);
                if (!rock) return null;
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
                        {rock.emoji} {rock.name}
                      </strong>
                      {rock.is_special && (
                        <span style={{ marginLeft: 8, color: 'var(--rose)' }}>
                          Special
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--brown-light)', marginTop: 4 }}>
                      {rock.description}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>📏 Size: {rock.size}</span>
                      <span>⚖️ Weight: {rock.weight}</span>
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
            🪨 Place
          </button>
        </div>
      </div>
    </div>
  );
}
