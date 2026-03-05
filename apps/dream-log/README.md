# Dream Log

A gentle dream journal for capturing the stories your sleeping mind tells you — before they fade with the morning light.

Part of the [Cozy Village](../../README.md) universe.

---

## What is Dream Log?

Dream Log is a calm, distraction-free space for recording your dreams. Whether you remember vivid adventures or just hazy fragments, Dream Log meets you where you are. No pressure, no streaks, no judgment — just a soft place to land when you wake up.

Write freely, tag the feelings and themes that linger, and over time, watch the quiet patterns of your dreaming mind unfold.

### Features

- **Morning capture** — A warm, minimal editor designed for half-awake thoughts. Jot down whatever you remember, even if it's just a color or a feeling.
- **Dream tags** — Label dreams with moods, themes, and recurring symbols (flying, water, old houses, lost teeth — we don't judge).
- **Clarity rating** — Rate how vivid each dream was, from a faint whisper to crystal clear.
- **Dream calendar** — A soft visual calendar showing which nights left you with something to remember.
- **Pattern view** — Over time, see which tags, moods, and themes show up most. Your dreams might be trying to tell you something.
- **Lucid dream tracking** — Mark dreams where you knew you were dreaming and note what you did with that awareness.
- **Night notes** — Optionally jot down a thought before sleep. Sometimes intention shapes what comes next.

## Getting Started

### Prerequisites

- Node.js 20+ (see root `.nvmrc`)
- The monorepo dependencies installed from the project root

### Development

```bash
# From the monorepo root
npm install

# Run just Dream Log
npx turbo dev --filter=@cozy-village/dream-log

# Or start everything together
npx turbo dev
```

The app runs at **http://localhost:5174** during development.

### Build

```bash
npx turbo build --filter=@cozy-village/dream-log
```

Output lands in `dist/`.

## Project Structure

```
apps/dream-log/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Root component
│   ├── App.css               # Global styles and CSS custom properties
│   ├── components/
│   │   ├── DreamEditor.jsx   # The main writing space
│   │   ├── DreamCard.jsx     # A single dream entry display
│   │   ├── DreamList.jsx     # Scrollable list of past dreams
│   │   ├── TagPicker.jsx     # Mood and theme tag selector
│   │   ├── ClarityMeter.jsx  # Dream vividness rating
│   │   ├── DreamCalendar.jsx # Monthly calendar view
│   │   ├── PatternView.jsx   # Tag and theme frequency insights
│   │   └── NightNote.jsx     # Pre-sleep intention writing
│   └── hooks/
│       └── useDreamStore.js  # localStorage-backed dream persistence
├── index.html
├── vite.config.js
├── package.json
└── README.md                 # You are here
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 18 |
| Build | Vite 5 |
| Styling | Plain CSS with custom properties |
| Storage | localStorage (no server required) |
| Monorepo | Turborepo via root workspace |

Dream Log is a **client-only** app. Your dreams stay on your device — no accounts, no cloud sync, no one reading your weird ones.

## Design Philosophy

Dream Log follows the same principles as the rest of Cozy Village:

- **Gentle by default.** Soft colors, rounded edges, unhurried transitions. Nothing blinks, nothing demands attention.
- **No streaks, no scores.** You remembered a dream? Wonderful. You didn't? That's fine too. There is no streak to break.
- **Privacy first.** Dreams are personal. Everything stays in your browser's localStorage. There's no backend, no analytics, no tracking.
- **Works when you're half asleep.** The UI is designed for bleary eyes and clumsy thumbs at 6 AM. Large touch targets, minimal decisions, forgiving inputs.

## Writing Your First Dream

1. Open Dream Log after waking up (the sooner the better — dreams are slippery).
2. Start typing in the editor. Don't worry about grammar or making sense. Dreams rarely do.
3. Add tags if you'd like — moods like *peaceful* or *anxious*, themes like *flying* or *childhood home*.
4. Set the clarity rating. Was it a full movie or just a fleeting image?
5. Save. That's it. Come back tomorrow, or next week, or whenever a dream is worth holding onto.

## Contributing

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines. A few Dream Log-specific notes:

- Keep the UI calm. If a feature feels noisy or anxious, it probably doesn't belong here.
- Test with sleepy eyes. If you can't figure out how to use it at 6 AM without coffee, simplify it.
- Dreams are private by nature. Never add features that transmit dream content anywhere.

## Part of the Cozy Village Universe

Dream Log lives alongside the other cozy apps:

| App | What it does |
|-----|-------------|
| [**Web**](../web/) | The main Cozy Village simulator — villagers, weather, farming, and ambient vibes |
| [**Mood Journal**](../mood-journal/) | Simple daily mood tracking |
| [**Dream Log**](../dream-log/) | You're here — a gentle dream journal |
| [**API**](../api/) | The backend engine powering the village simulation |

---

*Sweet dreams.*
