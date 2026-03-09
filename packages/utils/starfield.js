/**
 * alpha
 *
 * Deterministic night-sky generator for Willowbrook.
 * Given a day number and season, produces a consistent starfield with
 * star positions, visible constellations, and shooting-star events
 * using a seeded pseudo-random number generator (same mulberry32 approach
 * as weather.js).
 */

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_SET = new Set(SEASONS);
const SEASON_INDEX = new Map(SEASONS.map((s, i) => [s, i]));

/**
 * Constellations visible per season. Each has a name, a base brightness
 * (0-1), and anchor coordinates (normalised 0-1 within the sky canvas).
 */
const CONSTELLATIONS = {
  spring: [
    { name: 'The Seedling', anchor: { x: 0.25, y: 0.3 }, brightness: 0.9 },
    { name: 'The Rain Crow', anchor: { x: 0.7, y: 0.2 }, brightness: 0.75 },
    { name: 'The Blossom', anchor: { x: 0.5, y: 0.6 }, brightness: 0.85 },
  ],
  summer: [
    { name: 'The Firefly', anchor: { x: 0.3, y: 0.15 }, brightness: 1.0 },
    { name: 'The Sunfish', anchor: { x: 0.65, y: 0.4 }, brightness: 0.8 },
    { name: 'The Hammock', anchor: { x: 0.5, y: 0.7 }, brightness: 0.7 },
  ],
  autumn: [
    { name: 'The Acorn', anchor: { x: 0.4, y: 0.25 }, brightness: 0.85 },
    { name: 'The Lantern', anchor: { x: 0.75, y: 0.5 }, brightness: 0.95 },
    { name: 'The Fox', anchor: { x: 0.2, y: 0.65 }, brightness: 0.8 },
  ],
  winter: [
    { name: 'The Hearth', anchor: { x: 0.5, y: 0.2 }, brightness: 1.0 },
    { name: 'The Snowflake', anchor: { x: 0.3, y: 0.5 }, brightness: 0.9 },
    { name: 'The Mitten', anchor: { x: 0.7, y: 0.6 }, brightness: 0.75 },
  ],
};

const CONSTELLATION_LORE = {
  'The Seedling':
    'A tiny cluster said to appear when the soil is ready for planting. Farmers in Willowbrook sow their first crops the morning after it shines brightest.',
  'The Rain Crow':
    'An arc of stars that locals say foretells gentle spring showers. When its tail brightens, grab your umbrella.',
  'The Blossom':
    'Five stars arranged like flower petals. Legend says anyone who spots all five in one night will have a bountiful garden.',
  'The Firefly':
    'A scattering of twinkling stars that pulse faintly, mimicking the fireflies that fill Willowbrook meadows on warm nights.',
  'The Sunfish':
    'A broad curve of golden stars best seen near the horizon on clear summer evenings. Fishers consider it good luck.',
  'The Hammock':
    'Two bright stars with a gentle arc between them. Villagers say falling asleep under this constellation brings the sweetest dreams.',
  'The Acorn':
    'A compact, bright cluster that signals the harvest season. Its appearance means it is time to gather and prepare.',
  'The Lantern':
    'A single brilliant star surrounded by a soft halo of dimmer ones. It guides travelers safely home on foggy autumn nights.',
  'The Fox':
    'A sly streak of stars that seems to dart across the sky. Children in Willowbrook try to trace its full shape before it fades.',
  'The Hearth':
    'The brightest winter constellation — a warm ring of stars overhead. Villagers gather around bonfires to watch it on the longest nights.',
  'The Snowflake':
    'Six delicate arms of faint stars radiating from a single bright center. No two nights produce quite the same pattern.',
  'The Mitten':
    'A cozy grouping low on the horizon, visible only on the clearest, coldest nights. Spotting it is said to keep your hands warm all winter.',
};

/** Shooting-star probability per season (clear skies = higher chance). */
const SHOOTING_STAR_CHANCE = {
  spring: 0.15,
  summer: 0.25,
  autumn: 0.2,
  winter: 0.12,
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
 * Generate a starfield for a given night (day + season).
 *
 * @param {number} day - The in-game day number (1-based).
 * @param {string} season - One of 'spring', 'summer', 'autumn', 'winter'.
 * @param {{ starCount?: number }} [options]
 * @returns {{
 *   day: number,
 *   season: string,
 *   stars: Array<{ x: number, y: number, brightness: number, size: number }>,
 *   constellations: Array<{ name: string, anchor: { x: number, y: number }, brightness: number, visible: boolean }>,
 *   shootingStar: { startX: number, startY: number, angle: number, speed: number } | null
 * }}
 */
export function getStarfield(day, season, options = {}) {
  const s = season.toLowerCase();
  if (!SEASON_SET.has(s)) {
    throw new Error(
      `Invalid season "${season}". Must be one of: ${SEASONS.join(', ')}`
    );
  }

  const starCount = options.starCount ?? 80;
  // Use a different multiplier from weather.js so same day/season combos diverge
  const seed = day * 1597334677 + SEASON_INDEX.get(s) * 6271;
  const rng = createRng(seed);

  // Generate individual stars
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: rng(),
      y: rng(),
      brightness: 0.3 + rng() * 0.7,
      size: 1 + Math.floor(rng() * 3),
    });
  }

  // Determine constellation visibility (each has a ~70% chance of being visible on a given night)
  const seasonConstellations = CONSTELLATIONS[s].map((c) => ({
    ...c,
    visible: rng() < 0.7,
  }));

  // Shooting star
  const shootingStarRoll = rng();
  const shootingStar =
    shootingStarRoll < SHOOTING_STAR_CHANCE[s]
      ? {
          startX: rng(),
          startY: rng() * 0.5, // upper half of sky
          angle: 30 + rng() * 120, // degrees
          speed: 0.5 + rng() * 1.5,
        }
      : null;

  return {
    day,
    season: s,
    stars,
    constellations: seasonConstellations,
    shootingStar,
  };
}

/**
 * Get lore text for a named constellation.
 *
 * @param {string} name - The constellation name (e.g. "The Hearth").
 * @returns {string | null} The lore string, or null if unknown.
 */
export function getConstellationLore(name) {
  return CONSTELLATION_LORE[name] ?? null;
}

/**
 * List all constellation names for a given season.
 *
 * @param {string} season
 * @returns {string[]}
 */
export function getSeasonConstellations(season) {
  const s = season.toLowerCase();
  if (!SEASON_SET.has(s)) {
    throw new Error(
      `Invalid season "${season}". Must be one of: ${SEASONS.join(', ')}`
    );
  }
  return CONSTELLATIONS[s].map((c) => c.name);
}

/**
 * Generate a human-friendly description of tonight's sky.
 *
 * @param {{ stars: Array, constellations: Array<{ name: string, visible: boolean }>, shootingStar: object | null }} starfield
 * @returns {string}
 */
export function describeStarfield(starfield) {
  const visibleNames = starfield.constellations
    .filter((c) => c.visible)
    .map((c) => c.name);

  let desc = `${starfield.stars.length} stars shimmer above Willowbrook`;

  if (visibleNames.length > 0) {
    desc += `. Visible constellations: ${visibleNames.join(', ')}`;
  } else {
    desc += '. The constellations are hidden behind clouds tonight';
  }

  if (starfield.shootingStar) {
    desc += '. A shooting star streaks across the sky — make a wish!';
  }

  return desc;
}
