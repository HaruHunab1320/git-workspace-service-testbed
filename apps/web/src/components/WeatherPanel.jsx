import './WeatherPanel.css';

const SKY_EMOJI = {
  clear: '☀️', partly_cloudy: '⛅', overcast: '☁️',
  drizzle: '🌧️', rain: '🌧️', thunderstorm: '⛈️',
  snow: '🌨️', blizzard: '🌨️', fog: '🌫️', hail: '🪨',
};

const MAGICAL_EMOJI = {
  'aurora shower': '🌌',
  'petal blizzard': '🌸',
  'moonbow night': '🌙',
  'eternal golden hour': '🌅',
  'starfall': '⭐',
  'whispering mist': '🌫️',
  'firefly storm': '🪲',
  'crystal frost': '💎',
  'rainbow rain': '🌈',
  'sundog halo': '☀️',
};

const SEASON_EMOJI = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const MOOD_EMOJI = {
  joyful: '😄', content: '😊', melancholy: '😔',
  cozy: '☕', enchanted: '✨', restless: '💨',
};
const MOOD_LABEL = {
  joyful: 'The village is joyful!',
  content: 'The village feels content.',
  melancholy: 'A melancholy mood drifts through town.',
  cozy: 'Everyone is feeling cozy.',
  enchanted: 'The village is enchanted!',
  restless: 'Restless energy fills the air.',
};

const FESTIVAL_EMOJI = {
  'Blossom Dance': '💃',
  'Petal Reverie': '🌸',
  'Firefly Gala': '🪲',
  'Midsummer Feast': '🍽️',
  'Harvest Moon Vigil': '🌕',
  'Lantern Walk': '🏮',
  'Frost Fair': '⛸️',
  'Aurora Celebration': '🌌',
};

export default function WeatherPanel({ weather, forecast }) {
  if (!weather) {
    return (
      <div className="card">
        <h3 className="card-title">Weather</h3>
        <p>No weather data yet. Advance a day to see the forecast!</p>
      </div>
    );
  }

  const season = weather.season || 'spring';
  const streak = weather.weather_streak;

  return (
    <div className={`weather-panel season-theme-${season}`}>
      {/* Current weather card */}
      <div className={`card weather-current ${weather.is_magical ? 'magical-glow' : ''}`}>
        <div className="weather-season-badge">
          <span>{SEASON_EMOJI[season] || '🌸'}</span>
          <span>{season.charAt(0).toUpperCase() + season.slice(1)}</span>
        </div>

        <div className="weather-main">
          <span className="weather-big-emoji">{SKY_EMOJI[weather.sky] || '☀️'}</span>
          <div className="weather-info">
            <div className="weather-temp">{weather.temperature_c}&deg;C</div>
            <div className="weather-feels">Feels like {weather.feels_like_c}&deg;C</div>
            <div className="weather-sky">{weather.sky.replace(/_/g, ' ')}</div>
          </div>
        </div>

        <div className="weather-details">
          <div className="weather-detail">
            <span className="detail-icon">💧</span>
            <span>Humidity: {Math.round(weather.humidity * 100)}%</span>
          </div>
          <div className="weather-detail">
            <span className="detail-icon">🌬️</span>
            <span>Wind: {weather.wind_speed_kph} km/h {weather.wind_direction}</span>
          </div>
          <div className="weather-detail">
            <span className="detail-icon">⚠️</span>
            <span>Severity: {Math.round(weather.severity * 100)}%</span>
          </div>
        </div>

        <p className="weather-desc">{weather.description}</p>

        {/* Weather streak indicator */}
        {streak && streak.days >= 2 && (
          <div className="weather-streak">
            {SKY_EMOJI[streak.sky] || '☀️'} {streak.days} days of {streak.sky.replace(/_/g, ' ')}
          </div>
        )}

        {/* Magical event card */}
        {weather.is_magical && (
          <div className="weather-magical-card">
            <span className="magical-icon">
              {MAGICAL_EMOJI[weather.magical_event] || '✨'}
            </span>
            <div>
              <strong>{weather.magical_event}</strong>
              <p>A magical event is happening!</p>
            </div>
          </div>
        )}

        {/* Festival announcements */}
        {weather.festivals && weather.festivals.length > 0 && (
          <div className="weather-festivals">
            <div className="festival-header">🎉 Festival Day!</div>
            {weather.festivals.map((f, i) => (
              <div key={i} className="festival-item">
                <span className="festival-icon">{FESTIVAL_EMOJI[f] || '🎪'}</span>
                <span className="festival-name">{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Village mood */}
        {weather.village_mood && (
          <div className={`weather-mood mood-${weather.village_mood}`}>
            <span className="mood-icon">{MOOD_EMOJI[weather.village_mood] || '😊'}</span>
            <span>{MOOD_LABEL[weather.village_mood] || weather.village_mood}</span>
          </div>
        )}
      </div>

      {/* 5-Day Forecast */}
      <div className="card">
        <h3 className="card-title">📅 5-Day Forecast</h3>
        <div className="forecast-grid">
          {forecast.map((f, i) => (
            <div key={i} className={`forecast-day ${f.is_magical ? 'magical-glow' : ''}`}>
              <div className="forecast-day-num">Day {f.day}</div>
              <div className="forecast-emoji">{SKY_EMOJI[f.sky] || '☀️'}</div>
              <div className="forecast-temp">{f.temperature_c}&deg;C</div>
              <div className="forecast-sky">{f.sky.replace(/_/g, ' ')}</div>
              {f.is_magical && <div className="forecast-magic">✨</div>}
              {f.festivals && f.festivals.length > 0 && (
                <div className="forecast-festival">🎉</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
