import { useState, useEffect } from 'react';
import './Affirmations.css';

const AFFIRMATIONS = [
  "I am worthy of love and kindness.",
  "Today I choose peace over worry.",
  "I am growing at my own perfect pace.",
  "My presence makes the world a little brighter.",
  "I trust myself to handle whatever comes my way.",
  "I deserve rest and gentle moments.",
  "Every small step I take matters.",
  "I am enough, exactly as I am.",
  "I welcome joy into this day.",
  "My heart is open to good things.",
  "I release what I cannot control.",
  "I am surrounded by warmth and possibility.",
  "I give myself permission to take it slow.",
  "Today is a fresh start full of potential.",
  "I honor my feelings without judgment.",
];

function getAffirmationForToday() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

function Affirmations() {
  const [affirmation, setAffirmation] = useState(getAffirmationForToday);
  const [fade, setFade] = useState(true);

  function shuffleAffirmation() {
    setFade(false);
    setTimeout(() => {
      const random = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
      setAffirmation(random);
      setFade(true);
    }, 300);
  }

  useEffect(() => {
    setFade(true);
  }, []);

  return (
    <div className="affirmations">
      <h1 className="affirmations-title">Daily Affirmation</h1>
      <div className={`affirmation-card ${fade ? 'visible' : ''}`}>
        <p className="affirmation-text">{affirmation}</p>
      </div>
      <button className="shuffle-btn" onClick={shuffleAffirmation}>
        Another affirmation
      </button>
    </div>
  );
}

export default Affirmations;
