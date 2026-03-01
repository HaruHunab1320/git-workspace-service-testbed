import { useState } from 'react';
import { api } from '../api';

const CATEGORIES = [
  { value: 'flower', label: '🌸 Flower' },
  { value: 'food', label: '🍔 Food' },
  { value: 'book', label: '📚 Book' },
  { value: 'tool', label: '🔧 Tool' },
  { value: 'gemstone', label: '💎 Gemstone' },
  { value: 'handmade', label: '🧶 Handmade' },
  { value: 'fish', label: '🐟 Fish' },
  { value: 'foraged', label: '🌿 Foraged' },
];

export default function GiftModal({ villagerId, villagerName, onClose, onRefresh, showToast }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('flower');
  const [quality, setQuality] = useState(1);

  const handleGift = async () => {
    if (!name.trim()) {
      showToast('Please enter a gift name');
      return;
    }
    try {
      const result = await api.giveGift(villagerId, {
        name: name.trim(),
        category,
        quality,
      });
      showToast(result.reaction);
      await onRefresh();
      onClose();
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎁 Gift for {villagerName}</h2>

        <div className="form-group">
          <label>Gift Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunflower Bouquet"
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quality ({'⭐'.repeat(quality)})</label>
          <input
            type="range"
            min="1"
            max="5"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleGift}>
            🎁 Give Gift
          </button>
        </div>
      </div>
    </div>
  );
}
