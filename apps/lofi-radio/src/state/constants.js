export const STATIONS = [
  {
    name: 'Sleepy Village',
    url: 'https://stream.zeno.fm/0r0xa792kwzuv',
    emoji: '\u{1F3E1}',
  },
  {
    name: 'Rainy Window',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    emoji: '\u{1F327}\uFE0F',
  },
  {
    name: 'Cozy Fireplace',
    url: 'https://stream.zeno.fm/4d6bhkaqmg8uv',
    emoji: '\u{1F525}',
  },
  {
    name: 'Moonlit Garden',
    url: 'https://stream.zeno.fm/mfnb0u0cxzzuv',
    emoji: '\u{1F319}',
  },
];

export const CHANNELS = [
  {
    id: 'rain',
    name: 'Rain',
    emoji: '\u{1F327}\uFE0F',
    color: '#7a9ec8',
    description: 'Gentle rainfall on a window',
  },
  {
    id: 'vinyl',
    name: 'Vinyl Crackle',
    emoji: '\u{1F4BF}',
    color: '#b8956a',
    description: 'Warm record player hiss',
  },
  {
    id: 'keys',
    name: 'Piano Keys',
    emoji: '\u{1F3B9}',
    color: '#c8848a',
    description: 'Soft Rhodes chords',
  },
  {
    id: 'bass',
    name: 'Lo-fi Bass',
    emoji: '\u{1F3B8}',
    color: '#7a9e7e',
    description: 'Mellow sub-bass hum',
  },
  {
    id: 'fire',
    name: 'Fireplace',
    emoji: '\u{1F525}',
    color: '#c8a04a',
    description: 'Crackling embers',
  },
  {
    id: 'wind',
    name: 'Night Wind',
    emoji: '\u{1F343}',
    color: '#8faabe',
    description: 'Soft breeze through trees',
  },
  {
    id: 'birds',
    name: 'Morning Birds',
    emoji: '\u{1F426}',
    color: '#a8c5a0',
    description: 'Distant birdsong',
  },
  {
    id: 'cafe',
    name: 'Cafe Murmur',
    emoji: '\u2615',
    color: '#9e8a7a',
    description: 'Quiet coffeeshop bustle',
  },
];

export const DEFAULT_CHANNEL_LEVELS = Object.fromEntries(
  CHANNELS.map((ch) => [ch.id, 0])
);

export const PRESETS = [
  {
    id: 'rainy_study',
    name: 'Rainy Study',
    emoji: '\u{1F4DA}',
    levels: {
      rain: 0.7,
      vinyl: 0.4,
      keys: 0.5,
      bass: 0.3,
      fire: 0,
      wind: 0,
      birds: 0,
      cafe: 0.2,
    },
  },
  {
    id: 'cozy_night',
    name: 'Cozy Night',
    emoji: '\u{1F319}',
    levels: {
      rain: 0,
      vinyl: 0.3,
      keys: 0.4,
      bass: 0.4,
      fire: 0.6,
      wind: 0.2,
      birds: 0,
      cafe: 0,
    },
  },
  {
    id: 'morning_cafe',
    name: 'Morning Cafe',
    emoji: '\u2600\uFE0F',
    levels: {
      rain: 0,
      vinyl: 0.2,
      keys: 0.3,
      bass: 0.2,
      fire: 0,
      wind: 0,
      birds: 0.5,
      cafe: 0.6,
    },
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    emoji: '\u{1F9E0}',
    levels: {
      rain: 0.5,
      vinyl: 0.1,
      keys: 0,
      bass: 0.5,
      fire: 0,
      wind: 0.3,
      birds: 0,
      cafe: 0,
    },
  },
];
