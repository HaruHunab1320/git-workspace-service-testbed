import { useState } from 'react';
import { api } from '../api';
import './EconomyPanel.css';

const CATEGORY_EMOJI = {
  baked_good: '🍞',
  potion: '🧪',
};

export default function EconomyPanel({ economy, season, onRefresh, showToast }) {
  const prices = economy?.prices || [];
  const summary = economy?.summary || {};
  const wallet = economy?.wallet || { coins: 0, inventory: {} };
  const [buying, setBuying] = useState(null); // item_key being purchased
  const [selling, setSelling] = useState(null); // item_key being sold
  const [quantities, setQuantities] = useState({}); // item_key -> qty for buy
  const [sellQuantities, setSellQuantities] = useState({});

  const getQty = (key) => quantities[key] || 1;
  const getSellQty = (key) => sellQuantities[key] || 1;

  const handleBuy = async (itemKey) => {
    const qty = getQty(itemKey);
    setBuying(itemKey);
    try {
      const result = await api.buyItem(itemKey, qty);
      showToast(result.message);
      setQuantities((prev) => ({ ...prev, [itemKey]: 1 }));
      await onRefresh();
    } catch (err) {
      showToast(err.message);
    }
    setBuying(null);
  };

  const handleSell = async (itemKey) => {
    const qty = getSellQty(itemKey);
    setSelling(itemKey);
    try {
      const result = await api.sellItem(itemKey, qty);
      showToast(result.message);
      setSellQuantities((prev) => ({ ...prev, [itemKey]: 1 }));
      await onRefresh();
    } catch (err) {
      showToast(err.message);
    }
    setSelling(null);
  };

  const inventoryEntries = Object.entries(wallet.inventory || {});

  return (
    <div className="economy-panel">
      {/* Wallet */}
      <div className="card wallet-card">
        <h3 className="card-title">👛 Your Wallet</h3>
        <div className="wallet-balance">
          <span className="coin-icon">🪙</span>
          <span className="coin-amount">{wallet.coins.toFixed(2)}</span>
          <span className="coin-label">coins</span>
        </div>
      </div>

      {/* Market Store */}
      <div className="card">
        <h3 className="card-title">🏪 Village Market</h3>
        <p className="economy-season">Season: {season}</p>
        <table className="price-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Trend</th>
              <th>Shelf Life</th>
              <th>Qty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prices.map((item) => {
              const diff = item.price - item.base_price;
              const trend = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable';
              const qty = getQty(item.key);
              const total = (item.price * qty).toFixed(2);
              const canAfford = wallet.coins >= item.price * qty;
              return (
                <tr key={item.key}>
                  <td>
                    <span className="item-emoji">
                      {CATEGORY_EMOJI[item.category] || '📦'}
                    </span>
                    {item.name}
                  </td>
                  <td className="cat-cell">{item.category.replace('_', ' ')}</td>
                  <td className="price-cell">{item.price.toFixed(2)}</td>
                  <td>
                    <span className={`trend trend-${trend}`}>
                      {trend === 'up' ? '⬆️' : trend === 'down' ? '⬇️' : '➖'}
                    </span>
                  </td>
                  <td>{item.shelf_life === 'infinite' ? '∞' : `${item.shelf_life}d`}</td>
                  <td>
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        disabled={qty <= 1}
                        onClick={() => setQuantities((p) => ({ ...p, [item.key]: Math.max(1, qty - 1) }))}
                      >
                        -
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        className="qty-btn"
                        onClick={() => setQuantities((p) => ({ ...p, [item.key]: qty + 1 }))}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="buy-btn"
                      disabled={!canAfford || buying === item.key}
                      onClick={() => handleBuy(item.key)}
                    >
                      {buying === item.key ? '...' : `Buy (${total})`}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Player Inventory */}
      <div className="card">
        <h3 className="card-title">🎒 Your Inventory</h3>
        {inventoryEntries.length === 0 ? (
          <p className="empty-inventory">No items yet. Visit the market above to buy something!</p>
        ) : (
          <table className="price-table inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Owned</th>
                <th>Sell Price</th>
                <th>Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventoryEntries.map(([key, info]) => {
                const priceRow = prices.find((p) => p.key === key);
                const sellUnitPrice = priceRow ? (priceRow.price * 0.80).toFixed(2) : '?';
                const qty = getSellQty(key);
                const sellTotal = priceRow ? (priceRow.price * 0.80 * qty).toFixed(2) : '?';
                return (
                  <tr key={key}>
                    <td>
                      <span className="item-emoji">
                        {CATEGORY_EMOJI[info.category] || '📦'}
                      </span>
                      {info.name}
                    </td>
                    <td className="price-cell">{info.quantity}</td>
                    <td>{sellUnitPrice}/ea</td>
                    <td>
                      <div className="qty-control">
                        <button
                          className="qty-btn"
                          disabled={qty <= 1}
                          onClick={() => setSellQuantities((p) => ({ ...p, [key]: Math.max(1, qty - 1) }))}
                        >
                          -
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          disabled={qty >= info.quantity}
                          onClick={() => setSellQuantities((p) => ({ ...p, [key]: Math.min(info.quantity, qty + 1) }))}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="sell-btn"
                        disabled={selling === key}
                        onClick={() => handleSell(key)}
                      >
                        {selling === key ? '...' : `Sell (${sellTotal})`}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Trade Summary */}
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
    </div>
  );
}
