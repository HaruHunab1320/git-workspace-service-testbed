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
  'golden hour eternal': '🌅',
  'starfall': '⭐',
  'whispering mist': '🌫️',
  'firefly storm': '🪲',
  'crystal frost': '💎',
  'rainbow rain': '🌈',
  'sundog halo': '☀️',
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

  return (
    <div className="weather-panel">
      <div className={`card weather-current ${weather.is_magical ? 'magical-glow' : ''}`}>
        <div className="weather-main">
          <span className="weather-big-emoji">{SKY_EMOJI[weather.sky] || '☀️'}</span>
          <div className="weather-info">
            <div className="weather-temp">{weather.temperature_c}&deg;C</div>
            <div className="weather-feels">Feels like {weather.feels_like_c}&deg;C</div>
            <div className="weather-sky">{weather.sky.replace('_', ' ')}</div>
          </div>
        </div>
        <div className="weather-details">
          <div className="weather-detail">
            💧 Humidity: {Math.round(weather.humidity * 100)}%
          </div>
          <div className="weather-detail">
            🌬️ Wind: {weather.wind_speed_kph} km/h {weather.wind_direction}
          </div>
          <div className="weather-detail">
            ⚠️ Severity: {Math.round(weather.severity * 100)}%
          </div>
        </div>
        <p className="weather-desc">{weather.description}</p>
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
      </div>

      <div className="card">
        <h3 className="card-title">📅 5-Day Forecast</h3>
        <div className="forecast-grid">
          {forecast.map((f, i) => (
            <div key={i} className={`forecast-day ${f.is_magical ? 'magical-glow' : ''}`}>
              <div className="forecast-day-num">Day {f.day}</div>
              <div className="forecast-emoji">{SKY_EMOJI[f.sky] || '☀️'}</div>
              <div className="forecast-temp">{f.temperature_c}&deg;C</div>
              <div className="forecast-sky">{f.sky.replace('_', ' ')}</div>
              {f.is_magical && <div className="forecast-magic">✨</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
