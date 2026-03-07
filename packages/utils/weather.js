/**
 * alpha
 *
 * Deterministic weather forecast generator for Willowbrook.
 * Given a day number and season, produces consistent weather conditions
 * using a simple seeded pseudo-random number generator.
 */

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_SET = new Set(SEASONS);
const SEASON_INDEX = new Map(SEASONS.map((s, i) => [s, i]));

const WEATHER_TYPES = {
  spring: ['sunny', 'cloudy', 'rainy', 'misty', 'breezy', 'rainbow'],
  summer: ['sunny', 'hot', 'humid', 'thunderstorm', 'clear', 'breezy'],
  autumn: ['cloudy', 'foggy', 'rainy', 'windy', 'crisp', 'golden'],
  winter: ['snowy', 'freezing', 'overcast', 'blizzard', 'frosty', 'clear'],
};

const SPECIAL_EVENTS = {
  spring: { name: 'Cherry Blossom Shower', chance: 0.08 },
  summer: { name: 'Firefly Evening', chance: 0.1 },
  autumn: { name: 'Harvest Moon', chance: 0.1 },
  winter: { name: 'Aurora Borealis', chance: 0.06 },
};

const TEMPERATURE_RANGES = {
  spring: { min: 8, max: 22 },
  summer: { min: 20, max: 35 },
  autumn: { min: 5, max: 18 },
  winter: { min: -10, max: 5 },
};

/**
 * Simple seeded PRNG (mulberry32).
 * Returns a function that produces values in [0, 1).
 */
function createRng(seed) {
  let t = (seed | 0) + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a weather forecast for a given day and season.
 *
 * @param {number} day - The in-game day number (1-based).
 * @param {string} season - One of 'spring', 'summer', 'autumn', 'winter'.
 * @returns {{ day: number, season: string, weather: string, temperature: number, specialEvent: string|null }}
 */
export function getForecast(day, season) {
  const s = season.toLowerCase();
  if (!SEASON_SET.has(s)) {
    throw new Error(
      `Invalid season "${season}". Must be one of: ${SEASONS.join(', ')}`
    );
  }

  const seed = day * 2654435761 + SEASON_INDEX.get(s) * 7919;
  const rng = createRng(seed);

  const types = WEATHER_TYPES[s];
  const weather = types[Math.floor(rng() * types.length)];

  const range = TEMPERATURE_RANGES[s];
  const temperature = Math.round(range.min + rng() * (range.max - range.min));

  const event = SPECIAL_EVENTS[s];
  const specialEvent = rng() < event.chance ? event.name : null;

  return { day, season: s, weather, temperature, specialEvent };
}

/**
 * Generate a 7-day forecast starting from a given day.
 *
 * @param {number} startDay - The first day of the forecast.
 * @param {string} season - The current season.
 * @returns {Array} Array of 7 forecast objects.
 */
export function getWeeklyForecast(startDay, season) {
  const forecasts = new Array(7);
  for (let i = 0; i < 7; i++) {
    forecasts[i] = getForecast(startDay + i, season);
  }
  return forecasts;
}

/**
 * Get a human-friendly weather summary string.
 *
 * @param {{ weather: string, temperature: number, specialEvent: string|null }} forecast
 * @returns {string}
 */
export function describeForecast(forecast) {
  let description = `${forecast.weather}, ${forecast.temperature}C`;
  if (forecast.specialEvent) {
    description += ` — ${forecast.specialEvent} tonight!`;
  }
  return description;
}
