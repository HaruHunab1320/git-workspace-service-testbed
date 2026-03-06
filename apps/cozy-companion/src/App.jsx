import { useState, useEffect, useCallback } from 'react';
import Companion from './components/Companion';
import StudyTimer from './components/StudyTimer';
import MoodSelector from './components/MoodSelector';
import MessageLog from './components/MessageLog';
import GentleReminders from './components/GentleReminders';

const COMPANION_RESPONSES = {
  idle: [
    "I'm here whenever you're ready to study!",
    "Take your time... no rush at all.",
    "The rain outside sounds nice, doesn't it?",
  ],
  studying: [
    "You're doing great! Keep it up!",
    "Focus mode activated. You've got this.",
    "One step at a time... you're making progress.",
    "I'll keep you company while you work.",
  ],
  break: [
    "Nice work! You earned this break.",
    "Stretch a little, grab some water!",
    "Breaks are important too. Rest well.",
  ],
  happy: [
    "Your good energy is contagious!",
    "Love to see you in such a great mood!",
  ],
  calm: [
    "What a peaceful vibe. Let's keep it going.",
    "Calm and collected... perfect study energy.",
  ],
  tired: [
    "It's okay to rest. We can study later.",
    "Maybe a short session today? No pressure.",
  ],
  stressed: [
    "Deep breaths... you've handled tough things before.",
    "Let's take it slow. One thing at a time.",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function App() {
  const [mood, setMood] = useState(null);
  const [studyState, setStudyState] = useState('idle');
  const [messages, setMessages] = useState([
    { text: "Hey there! I'm your cozy study buddy. How are you feeling today?", timestamp: Date.now() },
  ]);

  const addMessage = useCallback((text) => {
    setMessages((prev) => [...prev.slice(-19), { text, timestamp: Date.now() }]);
  }, []);

  const handleMoodSelect = useCallback((selectedMood) => {
    setMood(selectedMood);
    const moodKey = selectedMood.toLowerCase();
    const responses = COMPANION_RESPONSES[moodKey] || COMPANION_RESPONSES.idle;
    addMessage(pickRandom(responses));
  }, [addMessage]);

  const handleStudyStateChange = useCallback((newState) => {
    setStudyState(newState);
    const responses = COMPANION_RESPONSES[newState] || COMPANION_RESPONSES.idle;
    addMessage(pickRandom(responses));
  }, [addMessage]);

  useEffect(() => {
    if (studyState !== 'studying') return;
    const interval = setInterval(() => {
      addMessage(pickRandom(COMPANION_RESPONSES.studying));
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [studyState, addMessage]);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Cozy Companion</h1>
        <p className="subtitle">Your lo-fi study buddy</p>
      </header>

      <main className="main">
        <div className="companion-area">
          <Companion mood={mood} studyState={studyState} />
        </div>

        <div className="controls">
          <MoodSelector selectedMood={mood} onSelect={handleMoodSelect} />
          <StudyTimer studyState={studyState} onStateChange={handleStudyStateChange} />
        </div>

        <MessageLog messages={messages} />
        <GentleReminders />
      </main>

      <footer className="footer">
        <p>Part of the Cozy Village universe</p>
      </footer>
    </div>
  );
}

export default App;
