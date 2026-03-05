import { useState, useEffect } from 'react';
import './TrivialClock.css';

export default function TrivialClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="trivial-clock">
      <span className="trivial-clock-time">
        {hours}:{minutes}<span className="trivial-clock-seconds">:{seconds}</span>
      </span>
    </div>
  );
}
