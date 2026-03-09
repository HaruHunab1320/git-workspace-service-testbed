import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import './CandleWorkshop.css';

/* alpha */

export default function CandleWorkshop({ showToast, season }) {
  const [scents, setScents] = useState([]);
  const [candles, setCandles] = useState([]);
  const [workshopInfo, setWorkshopInfo] = useState(null);
  const [moodEffects, setMoodEffects] = useState([]);
  const [selectedScent, setSelectedScent] = useState(null);

  const fetchWorkshop = useCallback(async () => {
    try {
      const data = await api.getCandleWorkshop();
      setCandles(data.candles);
      setWorkshopInfo(data.summary);
      setMoodEffects(data.mood_effects);
    } catch (err) {
      console.error('Failed to fetch candle workshop:', err);
    }
  }, []);

  const fetchScents = useCallback(async () => {
    try {
      const data = await api.getCandleScents();
      setScents(data);
    } catch (err) {
      console.error('Failed to fetch scents:', err);
    }
  }, []);

  useEffect(() => {
    fetchScents();
    fetchWorkshop();
  }, [fetchScents, fetchWorkshop]);

  const craftCandle = async (scentKey) => {
    try {
      const data = await api.craftCandle(scentKey);
      if (showToast) showToast(data.message);
      await fetchWorkshop();
    } catch (err) {
      if (showToast) showToast('Failed to craft candle');
    }
  };

  const lightCandle = async (candleId) => {
    try {
      const data = await api.lightCandle(candleId);
      if (showToast) showToast(data.message);
      await fetchWorkshop();
    } catch (err) {
      if (showToast) showToast('Failed to light candle');
    }
  };

  const extinguishCandle = async (candleId) => {
    try {
      const data = await api.extinguishCandle(candleId);
      if (showToast) showToast(data.message);
      await fetchWorkshop();
    } catch (err) {
      if (showToast) showToast('Failed to extinguish candle');
    }
  };

  const removeCandle = async (candleId) => {
    try {
      const data = await api.removeCandle(candleId);
      if (showToast) showToast(data.message);
      await fetchWorkshop();
    } catch (err) {
      if (showToast) showToast('Failed to remove candle');
    }
  };

  const litCount = candles.filter((c) => c.status === 'lit').length;

  return (
    <div className="candle-workshop" data-agent="alpha">
      <div className="card candle-header-card">
        <h2 className="card-title">🕯️ Candle Workshop</h2>
        <p className="candle-subtitle">
          Craft scented candles to fill your home with warmth and fragrance
        </p>
        {workshopInfo && workshopInfo.total_crafted > 0 && (
          <div className="candle-stats-row">
            <span className="candle-stat">
              🕯️ {workshopInfo.total_crafted} crafted
            </span>
            <span className="candle-stat">
              🔥 {litCount} lit
            </span>
            {workshopInfo.total_burned > 0 && (
              <span className="candle-stat">
                ✨ {workshopInfo.total_burned} fully enjoyed
              </span>
            )}
          </div>
        )}
      </div>

      <div className="scent-selection">
        {scents.map((scent) => (
          <button
            key={scent.scent}
            className="scent-option"
            onClick={() => {
              setSelectedScent(
                selectedScent?.scent === scent.scent ? null : scent
              );
              craftCandle(scent.scent);
            }}
          >
            <span className="scent-option-emoji">{scent.emoji}</span>
            <span className="scent-option-name">{scent.name}</span>
            <span className="scent-option-burn">{scent.burn_days}d burn</span>
            <span className="scent-option-mood">{scent.mood_boost} mood</span>
            <div
              className="scent-option-swatch"
              style={{
                background: `linear-gradient(90deg, ${scent.color}, ${scent.dark_color})`,
              }}
            />
          </button>
        ))}
      </div>

      {selectedScent && (
        <div className="card scent-details">
          <div className="scent-details-title">
            {selectedScent.emoji} {selectedScent.name}
          </div>
          <p className="scent-details-desc">{selectedScent.description}</p>
          <div className="scent-details-info">
            <span className="scent-detail-chip">
              🕯️ Burns {selectedScent.burn_days} days
            </span>
            <span className="scent-detail-chip">
              💛 {selectedScent.mood_boost}
            </span>
            <span className="scent-detail-chip">
              ⭐ Best in {selectedScent.season_bonus}
            </span>
          </div>
          <div
            className="scent-swatch"
            style={{
              background: `linear-gradient(90deg, ${selectedScent.color}, ${selectedScent.dark_color})`,
            }}
          />
        </div>
      )}

      {moodEffects.length > 0 && (
        <div className="card candle-mood-card">
          <h3 className="card-title">Village Mood Boost</h3>
          <div className="candle-mood-row">
            {moodEffects.map((effect, i) => (
              <span
                key={i}
                className={`candle-mood-tag ${effect.includes('bonus') ? 'bonus' : ''}`}
              >
                {effect}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card candle-collection">
        <h3 className="card-title">Your Candles</h3>
        {candles.length === 0 ? (
          <div className="candle-collection-empty">
            <span className="candle-collection-empty-icon">🕯️</span>
            Choose a scent above to craft your first candle
          </div>
        ) : (
          <div className="candle-grid">
            {candles.map((candle) => {
              const burnPct = Math.round(candle.burn_fraction * 100);
              const candleHeight = Math.max(15, candle.burn_fraction * 55);
              return (
                <div
                  key={candle.id}
                  className={`candle-item ${candle.status}`}
                >
                  <div className="candle-visual">
                    {candle.status === 'lit' && (
                      <>
                        <div className="candle-glow" />
                        <div className="candle-flame" />
                      </>
                    )}
                    <div
                      className="candle-body"
                      style={{
                        height: `${candleHeight}px`,
                        background: `linear-gradient(180deg, ${candle.color}, ${candle.dark_color})`,
                      }}
                    >
                      {candle.status !== 'spent' && (
                        <div className="candle-wick" />
                      )}
                    </div>
                  </div>

                  <div className="candle-item-name">
                    {candle.emoji} {candle.name}
                  </div>
                  <div className={`candle-item-status ${candle.status}`}>
                    {candle.status === 'lit'
                      ? `Glowing (${burnPct}%)`
                      : candle.status === 'spent'
                        ? 'Burned out'
                        : `${burnPct}% remaining`}
                  </div>

                  <div className="candle-burn-bar">
                    <div
                      className="candle-burn-fill"
                      style={{
                        width: `${burnPct}%`,
                        background: `linear-gradient(90deg, ${candle.color}, ${candle.dark_color})`,
                      }}
                    />
                  </div>

                  <div className="candle-actions">
                    {candle.status === 'unlit' && (
                      <button
                        className="candle-btn light"
                        onClick={() => lightCandle(candle.id)}
                      >
                        🔥 Light
                      </button>
                    )}
                    {candle.status === 'lit' && (
                      <button
                        className="candle-btn"
                        onClick={() => extinguishCandle(candle.id)}
                      >
                        💨 Blow out
                      </button>
                    )}
                    {candle.status === 'spent' && (
                      <button
                        className="candle-btn remove"
                        onClick={() => removeCandle(candle.id)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
