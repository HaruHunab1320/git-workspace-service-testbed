import { useRef, useEffect } from 'react';
import './EventLog.css';

export default function EventLog({ reports }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reports.length]);

  if (reports.length === 0) {
    return (
      <div className="event-log card">
        <h3 className="card-title">📜 Event Log</h3>
        <p className="event-log-empty">Advance the day to see events unfold...</p>
      </div>
    );
  }

  return (
    <div className="event-log card">
      <h3 className="card-title">📜 Event Log</h3>
      <div className="event-log-scroll">
        {reports.map((report, i) => (
          <div key={i} className={`event-day ${report.is_magical ? 'magical-glow' : ''}`}>
            <div className="event-day-header">
              <strong>Day {report.day}</strong>
              <span className="event-day-season">{report.season}</span>
            </div>
            <div className="event-day-weather">{report.weather_summary}</div>
            {report.is_magical && (
              <div className="event-magical">✨ {report.magical_event}</div>
            )}
            {report.festivals.length > 0 && (
              <div className="event-festival">🎉 {report.festivals.join(', ')}</div>
            )}
            {report.villager_events.slice(0, 3).map((e, j) => (
              <div key={j} className="event-line">👤 {e}</div>
            ))}
            {report.garden_events.slice(0, 3).map((e, j) => (
              <div key={j} className="event-line">🌱 {e}</div>
            ))}
            {report.harvests.map((e, j) => (
              <div key={j} className="event-line event-harvest">🌾 {e}</div>
            ))}
            {report.pet_events.slice(0, 3).map((e, j) => (
              <div key={j} className="event-line">🐾 {e}</div>
            ))}
            {report.found_items.map((e, j) => (
              <div key={j} className="event-line event-found">💠 {e}</div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
