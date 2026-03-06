import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'cozy-checkin-history';

function loadCheckIns() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCheckIns(checkIns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
  } catch {
    // storage unavailable
  }
}

function toDateString(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function calculateStreak(checkIns) {
  if (checkIns.length === 0) return 0;

  const today = toDateString(new Date());
  const sorted = [...checkIns]
    .map((c) => toDateString(c.date))
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse();

  if (sorted[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (sorted[0] !== toDateString(yesterday)) return 0;
  }

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const COMPANION_RESPONSES = {
  happy: [
    "Wonderful! Your happiness is contagious!",
    "That's great to hear! Let's make today even better.",
    "Your joy brightens this little corner of the world.",
  ],
  calm: [
    "A peaceful mind is a powerful thing.",
    "Serenity looks good on you today.",
    "What a lovely, centered way to start.",
  ],
  tired: [
    "It's okay to take things slow today.",
    "Rest is productive too. Be gentle with yourself.",
    "Even on tired days, you showed up. That matters.",
  ],
  excited: [
    "Channel that energy into something wonderful!",
    "What an amazing vibe to carry today!",
    "Your excitement is like sunshine on a rainy day.",
  ],
  anxious: [
    "Take a deep breath. You are safe here.",
    "One step at a time. You've got this.",
    "Let's breathe together. Inhale... exhale...",
  ],
};

const ENERGY_RESPONSES = {
  low: "Remember, even small steps count.",
  medium: "A steady pace wins the day.",
  high: "What a spark! Let's make the most of it.",
};

function getCompanionResponse(mood, energy) {
  const moodResponses = COMPANION_RESPONSES[mood] || COMPANION_RESPONSES.calm;
  const moodResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];
  const energyResponse = energy ? ENERGY_RESPONSES[energy] : '';
  return energyResponse ? `${moodResponse} ${energyResponse}` : moodResponse;
}

export default function useDailyCheckIn() {
  const [checkIns, setCheckIns] = useState(loadCheckIns);

  const todayKey = toDateString(new Date());
  const todayCheckIn = checkIns.find((c) => toDateString(c.date) === todayKey) || null;
  const hasCheckedInToday = !!todayCheckIn;

  const streak = useMemo(() => calculateStreak(checkIns), [checkIns]);

  const submitCheckIn = useCallback(({ mood, energy, note }) => {
    const response = getCompanionResponse(mood, energy);

    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      mood,
      energy,
      note: note || '',
      companionResponse: response,
    };

    const updated = [entry, ...checkIns.filter((c) => toDateString(c.date) !== todayKey)];
    setCheckIns(updated);
    saveCheckIns(updated);
    return response;
  }, [checkIns, todayKey]);

  const recentCheckIns = useMemo(() => checkIns.slice(0, 7), [checkIns]);

  return {
    todayCheckIn,
    hasCheckedInToday,
    streak,
    recentCheckIns,
    submitCheckIn,
  };
}
