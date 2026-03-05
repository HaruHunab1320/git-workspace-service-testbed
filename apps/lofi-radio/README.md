# Lo-fi Radio

A standalone ambient audio app for the Cozy Village universe — stream curated lo-fi stations and mix your own layered soundscapes, all powered by the Web Audio API.

## Features

### Streaming Radio Player

A floating radio widget with 4 curated lo-fi stations:

| Station | Vibe |
|---------|------|
| Sleepy Village | Gentle village ambiance |
| Rainy Window | Rain-soaked lo-fi beats |
| Cozy Fireplace | Warm crackling fireside |
| Moonlit Garden | Dreamy nighttime melodies |

- Play/pause, previous/next station controls
- Volume slider with mute indicator
- Animated spinning vinyl record with per-station artwork
- 5-bar audio visualizer
- Collapsible FAB (floating action button) with pulsing ring when playing
- Graceful error handling for unavailable streams

### Ambient Lo-fi Mixer

An 8-channel synthesized sound mixer that generates audio entirely in the browser — no external files required.

**Channels:**

| Channel | Sound |
|---------|-------|
| Rain | Gentle rainfall on a window |
| Vinyl Crackle | Warm record player hiss |
| Piano Keys | Soft Rhodes chords |
| Lo-fi Bass | Mellow sub-bass hum |
| Fireplace | Crackling embers |
| Night Wind | Soft breeze through trees |
| Morning Birds | Distant birdsong |
| Cafe Murmur | Quiet coffeeshop bustle |

**Presets:**

| Preset | Channels |
|--------|----------|
| Rainy Study | Rain + vinyl + keys + bass + cafe |
| Cozy Night | Vinyl + keys + bass + fire + wind |
| Morning Cafe | Vinyl + keys + bass + birds + cafe |
| Deep Focus | Rain + vinyl + bass + wind |

- Per-channel vertical fader controls with fill visualization
- Master volume control
- One-click preset loading
- Real-time gain adjustment (no audio restart)
- Animated wave-ring visualizer showing active layers
- Reset to silence

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build | Vite 5 |
| Audio | Web Audio API (fully synthesized) |
| Streaming | HTML5 `<audio>` element |
| Styling | CSS with CSS custom properties |
| Monorepo | Turborepo 2, npm workspaces |

All ambient sounds are generated client-side using oscillators, noise buffers, and biquad filters — the app ships zero audio files.

## Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc` in repo root)
- npm 10+

### Install

From the repository root:

```bash
npm install
```

### Development

```bash
# Start just the lo-fi radio app
npx turbo dev --filter=@cozy-village/lofi-radio

# Or start all apps in parallel
npx turbo dev
```

The dev server runs at `http://localhost:5174` with hot module reloading.

### Build

```bash
npx turbo build --filter=@cozy-village/lofi-radio
```

Output is written to `dist/`.

## Project Structure

```
apps/lofi-radio/
├── index.html              # Entry HTML (loads Google Fonts: Nunito)
├── package.json            # @cozy-village/lofi-radio
├── vite.config.js          # Vite config
├── README.md
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Root component — composes radio + mixer
    ├── App.css             # Global styles and CSS variables
    └── components/
        ├── LofiPlayer.jsx      # Floating streaming radio widget
        ├── LofiPlayer.css
        ├── AmbientLofiMixer.jsx # 8-channel synthesized mixer
        └── AmbientLofiMixer.css
```

## Components

### `<LofiPlayer />`

Floating action button that expands into a radio panel. Streams audio from external lo-fi stations via an HTML5 `<audio>` element. Fixed-position bottom-right overlay.

**State:** `isPlaying`, `isExpanded`, `stationIdx`, `volume`, `hasError`

### `<AmbientLofiMixer />`

Full-page mixer board with vertical faders for 8 synthesized audio channels. Uses the Web Audio API to generate sounds from scratch:

- **Noise-based** channels (rain, vinyl, fire, wind, cafe) use looped white noise buffers routed through bandpass/lowpass/highpass filters with LFO modulation
- **Oscillator-based** channels (keys, bass) use detuned sine waves with tremolo
- **Procedural** channels (birds) schedule randomized chirp events via `setInterval`

Each channel has an independent `GainNode` connected to a shared master gain. Preset application updates gain values in real time without rebuilding the audio graph.

**Props:** `showToast` — callback for status notifications

## Audio Architecture

```
[Noise Buffer / Oscillator]
        │
   [BiquadFilter(s)]
        │
    [LFO modulation]
        │
   [Channel GainNode]  ←── per-channel fader
        │
  [Master GainNode]    ←── master volume
        │
  [AudioContext.destination]
```

## Design Tokens

The app inherits the Cozy Village design system via CSS custom properties:

```css
--cream: #faf6f0       /* background */
--sage: #7a9e7e        /* primary accent */
--sage-dark: #5a7e5e   /* hover states */
--tan: #d4b896         /* secondary accent */
--tan-light: #e8d5be   /* subtle fills */
--rose: #c8848a        /* active/error states */
--brown: #4a3728       /* text */
--brown-light: #6b5545 /* secondary text */
```

## Responsive Behavior

- **Desktop (> 700px):** Full 8-channel mixer board with side visualizer, 4-column preset grid
- **Mobile (< 700px):** Wrapped channel layout, stacked visualizer, 2-column preset grid
- **Small mobile (< 500px):** Shorter fader tracks for compact display
- The floating radio player adapts independently at all sizes

## Part of the Cozy Village Monorepo

This app is one of several in the [Cozy Village](../../README.md) Turborepo monorepo:

| App | Description |
|-----|-------------|
| **api** | FastAPI simulation engine |
| **web** | Main village UI |
| **lofi-radio** | Ambient audio app (this project) |
| **mood-journal** | Mood tracking journal |
