import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import './EconomyPanel.css';

const CATEGORY_EMOJI = {
  baked_good: '🍞',
  potion: '🧪',
};

function Sparkles({ active }) {
  if (!active) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const distance = 30 + Math.random() * 40;
    const dx = Math.cos((angle * Math.PI) / 180) * distance;
    const dy = Math.sin((angle * Math.PI) / 180) * distance;
    const size = 4 + Math.random() * 6;
    const delay = Math.random() * 0.15;
    const hue = 35 + Math.random() * 30; // warm gold range
    return (
      <span
        key={i}
        className="sparkle-particle"
        style={{
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          '--size': `${size}px`,
          '--delay': `${delay}s`,
          '--hue': hue,
        }}
      />
    );
  });
  return <span className="sparkles-container">{particles}</span>;
}

function Receipt({ purchase, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="receipt-overlay">
      <div className="receipt-card">
        <div className="receipt-header">
          <span className="receipt-icon">{'\u{1F9FE}'}</span>
          <span className="receipt-title">Purchase Complete!</span>
        </div>
        <div className="receipt-divider" />
        <div className="receipt-line">
          <span>{purchase.item_name || purchase.message} x{purchase.quantity || 1}</span>
          <span>{(purchase.total || 0).toFixed(2)}</span>
        </div>
        <div className="receipt-divider" />
        <div className="receipt-line receipt-total">
          <span>Total</span>
          <span>{(purchase.total || 0).toFixed(2)} coins</span>
        </div>
        <div className="receipt-line receipt-remaining">
          <span>Wallet</span>
          <span>{(purchase.remaining_coins ?? purchase.coins ?? 0).toFixed(2)} coins</span>
        </div>
        <div className="receipt-footer">
          {'\u2728'} Thank you for shopping! {'\u2728'}
        </div>
      </div>
    </div>
  );
}

export default function EconomyPanel({ economy, season, onRefresh, showToast }) {
  const prices = economy?.prices || [];
  const summary = economy?.summary || {};
  const playerCoins = economy?.player_coins ?? 0;
  const [buying, setBuying] = useState(null);
  const [sparkleKey, setSparkleKey] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const handleBuy = async (item) => {
    if (buying) return;
    setBuying(item.key);
    try {
      const result = await api.buyItem(item.key, 1);
      setSparkleKey(item.key);
      setReceipt(result);
      if (onRefresh) await onRefresh();
      setTimeout(() => setSparkleKey(null), 800);
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    setBuying(null);
  };

  const dismissReceipt = useCallback(() => setReceipt(null), []);

  return (
    <div className="economy-panel">
      <div className="card">
        <div className="store-header">
          <h3 className="card-title">{'\u{1F6D2}'} Village Store</h3>
          <div className="wallet-badge">
            <span className="wallet-icon">{'\u{1FA99}'}</span>
            <span className="wallet-amount">{playerCoins.toFixed(2)}</span>
          </div>
        </div>
        <p className="economy-season">Season: {season}</p>
        <table className="price-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Base</th>
              <th>Price</th>
              <th>Trend</th>
              <th>Shelf Life</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prices.map((item) => {
              const diff = item.price - item.base_price;
              const trend = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable';
              const canAfford = playerCoins >= item.price;
              return (
                <tr key={item.key} className={sparkleKey === item.key ? 'row-purchased' : ''}>
                  <td>
                    <span className="item-emoji">
                      {CATEGORY_EMOJI[item.category] || '📦'}
                    </span>
                    {item.name}
                  </td>
                  <td className="cat-cell">{item.category.replace('_', ' ')}</td>
                  <td>{item.base_price.toFixed(2)}</td>
                  <td className="price-cell">{item.price.toFixed(2)}</td>
                  <td>
                    <span className={`trend trend-${trend}`}>
                      {trend === 'up' ? '⬆️' : trend === 'down' ? '⬇️' : '➖'}
                    </span>
                  </td>
                  <td>{item.shelf_life === 'infinite' ? '∞' : `${item.shelf_life}d`}</td>
                  <td className="buy-cell">
                    <button
                      className={`btn-buy ${!canAfford ? 'btn-buy-disabled' : ''}`}
                      onClick={() => handleBuy(item)}
                      disabled={buying === item.key || !canAfford}
                    >
                      {buying === item.key ? '\u23F3' : '\u{1F6D2}'} Buy
                      <Sparkles active={sparkleKey === item.key} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="card-title">📊 Trade Summary</h3>
        <div className="summary-grid">
          <div className="summary-stat">
            <div className="summary-val">{summary.total_trades || 0}</div>
            <div className="summary-label">Total Trades</div>
          </div>
          <div className="summary-stat">
            <div className="summary-val">{summary.total_volume || 0}</div>
            <div className="summary-label">Items Traded</div>
          </div>
          <div className="summary-stat">
            <div className="summary-val">{(summary.coins_exchanged || 0).toFixed(2)}</div>
            <div className="summary-label">Coins Exchanged</div>
          </div>
          <div className="summary-stat">
            <div className="summary-val">{summary.top_item || 'None'}</div>
            <div className="summary-label">Top Item</div>
          </div>
        </div>
      </div>

      {receipt && <Receipt purchase={receipt} onDone={dismissReceipt} />}
    </div>
  );
}
