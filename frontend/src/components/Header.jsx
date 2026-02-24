import './Header.css';

const SEASON_EMOJI = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const MOOD_EMOJI = {
  joyful: '😄', content: '😊', melancholy: '😔',
  cozy: '☕', enchanted: '✨', restless: '💨',
};
const SKY_EMOJI = {
  clear: '☀️', partly_cloudy: '⛅', overcast: '☁️',
  drizzle: '🌧️', rain: '🌧️', thunderstorm: '⛈️',
  snow: '🌨️', blizzard: '🌨️', fog: '🌫️', hail: '🪨',
};

export default function Header({ day, season, weather, villageMood }) {
  const skyEmoji = weather ? (SKY_EMOJI[weather.sky] || '☀️') : '☀️';
  const temp = weather ? `${weather.temperature_c}°C` : '--';
  const moodEmoji = MOOD_EMOJI[villageMood] || '😊';

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">🏡</span>
        <h1 className="header-title">Willowbrook</h1>
      </div>
      <div className="header-stats">
        <div className="header-stat">
          <span className="stat-emoji">📅</span>
          <span>Day {day || 0}</span>
        </div>
        <div className="header-stat">
          <span className="stat-emoji">{SEASON_EMOJI[season] || '🌸'}</span>
          <span>{season ? season.charAt(0).toUpperCase() + season.slice(1) : 'Spring'}</span>
        </div>
        <div className="header-stat">
          <span className="stat-emoji">{skyEmoji}</span>
          <span>{temp}</span>
        </div>
        {weather?.is_magical && (
          <div className="header-stat magical">
            <span className="stat-emoji">✨</span>
            <span>{weather.magical_event}</span>
          </div>
        )}
        <div className="header-stat">
          <span className="stat-emoji">{moodEmoji}</span>
          <span>{villageMood || 'content'}</span>
        </div>
      </div>
    </header>
  );
}
