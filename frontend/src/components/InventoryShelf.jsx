import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import './InventoryShelf.css';

const CATEGORY_EMOJI = {
  baked_good: '🍞',
  potion: '🧪',
};

const ITEM_EMOJI = {
  sourdough_loaf: '🍞',
  honey_cake: '🍰',
  cinnamon_roll: '🥐',
  lavender_scone: '🧁',
  berry_tart: '🥧',
  healing_potion: '💗',
  energy_elixir: '⚡',
  sleep_draught: '💤',
  frost_tonic: '❄️',
  sunshine_brew: '☀️',
};

function freshnessClass(freshness) {
  if (freshness > 0.5) return 'freshness-good';
  if (freshness > 0.2) return 'freshness-warning';
  return 'freshness-danger';
}

export default function InventoryShelf({ economy, onRefresh, showToast }) {
  const [inventory, setInventory] = useState({ coins: 0, items: [] });
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    try {
      const data = await api.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleBuy = async (itemKey) => {
    try {
      const result = await api.buyItem(itemKey);
      setInventory({ coins: result.coins, items: result.inventory });
      showToast(result.message);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleSell = async (itemKey) => {
    try {
      const result = await api.sellItem(itemKey);
      setInventory({ coins: result.coins, items: result.inventory });
      showToast(result.message);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message);
    }
  };

  const prices = economy?.prices || [];
  const bakedGoods = inventory.items.filter((i) => i.category === 'baked_good');
  const potions = inventory.items.filter((i) => i.category === 'potion');
  const totalItems = inventory.items.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) {
    return <div className="loading">Loading shelf...</div>;
  }

  return (
    <div className="inventory-shelf">
      {/* Coin purse */}
      <div className="coin-purse">
        <div className="coin-purse-left">
          <span className="coin-icon">👛</span>
          <span className="coin-amount">{inventory.coins.toFixed(2)}</span>
          <span className="coin-label">coins</span>
        </div>
        <span className="shelf-item-count">
          {totalItems} item{totalItems !== 1 ? 's' : ''} on shelf
        </span>
      </div>

      {/* Shelf display */}
      <div className="card">
        <h3 className="card-title">🪵 Your Shelf</h3>

        {inventory.items.length === 0 ? (
          <div className="shelf-empty">
            <span className="shelf-empty-icon">🏪</span>
            <span className="shelf-empty-text">Your shelf is empty</span>
            <span className="shelf-empty-hint">Buy items from the shop below to fill it up!</span>
          </div>
        ) : (
          <>
            {bakedGoods.length > 0 && (
              <div className="shelf-unit">
                <div className="shelf-label">Baked Goods</div>
                <div className="shelf-row">
                  {bakedGoods.map((item) => (
                    <div
                      key={item.key}
                      className={`shelf-item ${item.is_spoiled ? 'spoiled' : ''}`}
                      title={`${item.name} — ${item.age_days}d old${item.shelf_life !== 'infinite' ? `, expires in ${item.shelf_life - item.age_days}d` : ''}`}
                    >
                      {item.quantity > 1 && (
                        <span className="shelf-item-qty">{item.quantity}</span>
                      )}
                      <span className="shelf-item-emoji">
                        {ITEM_EMOJI[item.key] || CATEGORY_EMOJI[item.category] || '📦'}
                      </span>
                      <span className="shelf-item-name">{item.name}</span>
                      {item.shelf_life !== 'infinite' && (
                        <div className="shelf-item-freshness">
                          <div
                            className={`shelf-item-freshness-fill ${freshnessClass(item.freshness)}`}
                            style={{ width: `${item.freshness * 100}%` }}
                          />
                        </div>
                      )}
                      {item.is_spoiled ? (
                        <span className="spoiled-tag">Spoiled!</span>
                      ) : (
                        <button
                          className="shelf-item-sell"
                          onClick={() => handleSell(item.key)}
                        >
                          Sell
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bakedGoods.length > 0 && potions.length > 0 && (
              <div className="shelf-spacer" />
            )}

            {potions.length > 0 && (
              <div className="shelf-unit">
                <div className="shelf-label">Potions</div>
                <div className="shelf-row">
                  {potions.map((item) => (
                    <div
                      key={item.key}
                      className="shelf-item"
                      title={`${item.name} — never spoils`}
                    >
                      {item.quantity > 1 && (
                        <span className="shelf-item-qty">{item.quantity}</span>
                      )}
                      <span className="shelf-item-emoji">
                        {ITEM_EMOJI[item.key] || CATEGORY_EMOJI[item.category] || '📦'}
                      </span>
                      <span className="shelf-item-name">{item.name}</span>
                      <button
                        className="shelf-item-sell"
                        onClick={() => handleSell(item.key)}
                      >
                        Sell
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Shop */}
      <div className="card">
        <h3 className="card-title">🏪 Village Shop</h3>
        <div className="shop-grid">
          {prices.map((item) => {
            const canAfford = inventory.coins >= item.price;
            return (
              <div key={item.key} className="shop-item">
                <span className="shop-item-emoji">
                  {ITEM_EMOJI[item.key] || CATEGORY_EMOJI[item.category] || '📦'}
                </span>
                <div className="shop-item-info">
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-price">{item.price.toFixed(2)} coins</div>
                  <div className="shop-item-life">
                    {item.shelf_life === 'infinite' ? 'Never spoils' : `${item.shelf_life}d shelf life`}
                  </div>
                </div>
                <button
                  className="shop-buy-btn"
                  disabled={!canAfford}
                  onClick={() => handleBuy(item.key)}
                >
                  Buy
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
