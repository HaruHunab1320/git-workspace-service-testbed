import './EconomyPanel.css';

const CATEGORY_EMOJI = {
  baked_good: '🍞',
  potion: '🧪',
};

export default function EconomyPanel({ economy, season }) {
  const prices = economy?.prices || [];
  const summary = economy?.summary || {};

  return (
    <div className="economy-panel">
      <div className="card">
        <h3 className="card-title">💰 Market Price Board</h3>
        <p className="economy-season">Season: {season}</p>
        <table className="price-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Base</th>
              <th>Current</th>
              <th>Trend</th>
              <th>Shelf Life</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((item) => {
              const diff = item.price - item.base_price;
              const trend = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable';
              return (
                <tr key={item.key}>
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
    </div>
  );
}
