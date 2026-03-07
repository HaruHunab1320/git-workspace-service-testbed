# Cozy Companion — Component Guide

Welcome! This guide walks you through every component in the Cozy Companion app. Whether you're looking to understand how things work, make a small tweak, or build something new on top of what's here, this document is here to help you feel at home.

---

## Table of Contents

1. [App Overview](#app-overview)
2. [CompanionDisplay](#companiondisplay)
3. [Companion (Legacy)](#companion-legacy)
4. [MoodSelector](#moodselector)
5. [FocusTimer](#focustimer)
6. [GentleReminders](#gentlereminders)
7. [JournalPanel](#journalpanel)
8. [MessageLog (Legacy)](#messagelog-legacy)
9. [StudyTimer (Legacy)](#studytimer-legacy)
10. [SettingsPanel](#settingspanel)
11. [Styling & Layout](#styling--layout)
12. [Shared UI Components](#shared-ui-components)

---

## App Overview

**File:** `src/App.jsx`

The `App` component is the heart of Cozy Companion. It sets up a gentle three-tab layout — **Home**, **Journal**, and **Settings** — and ties all the other components together.

### How it works

- **Tabs** are rendered using `PastelTabs` from the shared `@cozy-village/ui` library, with a soft pill-style variant.
- **Mood** is stored as a single piece of state (`mood`) and flows down to `CompanionDisplay` and `MoodSelector`.
- **Toast notifications** are managed by a simple `showToast` / `dismissToast` pair and displayed via `PastelToast` (auto-dismisses after 3 seconds).

### Tab structure

| Tab          | What it shows                                                    |
| ------------ | ---------------------------------------------------------------- |
| **Home**     | Your companion, mood selector, focus timer, and gentle reminders |
| **Journal**  | A freeform writing space with saved entries                      |
| **Settings** | Companion name, theme, sound, and reminder preferences           |

### Default reminders

The app comes with a built-in set of wellness reminders that rotate every 30 seconds:

- _Take a deep breath and relax your shoulders._
- _Have you had a glass of water recently?_
- _Stretch your arms above your head for a moment._
- _Look away from the screen at something distant._
- _You are doing great today._
- _Remember to check in with how you feel._

---

## CompanionDisplay

**File:** `src/components/CompanionDisplay.jsx`

This is the visual heart of the app — a charming ASCII-art cat named **Mochi** who reacts to your mood.

### Props

| Prop   | Type               | Default | Description                                                                |
| ------ | ------------------ | ------- | -------------------------------------------------------------------------- |
| `mood` | `string` or `null` | —       | One of `'happy'`, `'calm'`, `'tired'`, `'excited'`, `'anxious'`, or `null` |

### Mood reactions

Each mood changes Mochi's expression and shows a unique message:

| Mood      | Expression | Message                                  |
| --------- | ---------- | ---------------------------------------- |
| `happy`   | `( ^.^ )`  | "Your companion is purring contentedly!" |
| `calm`    | `( -.- )`  | "A peaceful moment together..."          |
| `tired`   | `( u.u )`  | "Let's take it easy today."              |
| `excited` | `( *.* )`  | "So much energy! What an adventure!"     |
| `anxious` | `( o.o )`  | "It's okay. Deep breaths together."      |
| _(none)_  | `( o.o )`  | "Hello! How are you today?"              |

When a mood is selected, a `PastelBadge` appears beneath Mochi's name with a color that matches the mood (e.g., lemon for happy, mint for calm, lavender for tired).

### Customizing

To add a new mood, you'll need to add entries to three objects in this file:

1. `COMPANION_ART` — the ASCII art string
2. `MOOD_MESSAGES` — the companion's spoken message
3. The `badgeVariant` mapping — which pastel color to use

---

## Companion (Legacy)

**File:** `src/components/Companion.jsx`

An earlier version of the companion display that uses simpler text-face expressions and responds to both mood and study state. This component is not currently used in `App.jsx` but is available if you prefer the lighter style.

### Props

| Prop         | Type               | Default | Description                                         |
| ------------ | ------------------ | ------- | --------------------------------------------------- |
| `mood`       | `string` or `null` | —       | One of `'Happy'`, `'Calm'`, `'Tired'`, `'Stressed'` |
| `studyState` | `string`           | —       | One of `'idle'`, `'studying'`, `'break'`            |

### Expressions

| Study State | Face      | Status Text          |
| ----------- | --------- | -------------------- |
| `idle`      | `(^ _ ^)` | "Relaxing..."        |
| `studying`  | `(o _ o)` | "Studying together!" |
| `break`     | `(^ u ^)` | "Break time~"        |

Mood overlays appear as small repeated characters (e.g., `~~~` for Happy, `zzz` for Calm).

---

## MoodSelector

**File:** `src/components/MoodSelector.jsx`

A row of soft buttons that let you tell your companion how you're feeling.

### Props

| Prop       | Type                       | Description                          |
| ---------- | -------------------------- | ------------------------------------ |
| `selected` | `string` or `null`         | The currently active mood id         |
| `onSelect` | `(moodId: string) => void` | Called when a mood button is clicked |

### Available moods

| ID        | Label   | Button Color (when selected) |
| --------- | ------- | ---------------------------- |
| `happy`   | Happy   | peach                        |
| `calm`    | Calm    | mint                         |
| `tired`   | Tired   | lavender                     |
| `excited` | Excited | sky                          |
| `anxious` | Anxious | blush                        |

Unselected buttons use the `ghost` variant, making them blend softly into the background until clicked.

---

## FocusTimer

**File:** `src/components/FocusTimer.jsx`

A Pomodoro-style focus timer with preset durations and a gentle progress bar.

### Props

| Prop        | Type                                          | Description                         |
| ----------- | --------------------------------------------- | ----------------------------------- |
| `showToast` | `(message: string, variant?: string) => void` | Optional callback for notifications |

### Presets

| Label  | Duration               |
| ------ | ---------------------- |
| 5 min  | 300 seconds            |
| 15 min | 900 seconds            |
| 25 min | 1500 seconds (default) |

### How it works

1. Choose a duration by clicking one of the preset badges (highlighted in lavender when active, peach otherwise).
2. Press **Start** to begin the countdown. The button changes to **Pause** while running.
3. If you pause and resume, the button reads **Resume**.
4. **Reset** stops the timer and returns it to the selected duration.
5. A `PastelProgress` bar fills from left to right as time passes.
6. When the timer reaches zero, a success toast appears: _"Focus session complete!"_

### Technical notes

- The countdown runs via `setInterval` with a 1-second tick, managed through a `useRef` to avoid stale closures.
- The `stop` function is wrapped in `useCallback` so the interval cleanup effect has a stable reference.

---

## GentleReminders

**File:** `src/components/GentleReminders.jsx`

A softly pulsing reminder that cycles through kind messages at a configurable interval.

### Props

| Prop         | Type       | Default | Description                                 |
| ------------ | ---------- | ------- | ------------------------------------------- |
| `reminders`  | `string[]` | `[]`    | Array of reminder messages to cycle through |
| `intervalMs` | `number`   | `30000` | Milliseconds between reminder changes       |

### Behavior

- Displays one reminder at a time with a small `*` icon beside it.
- Automatically advances to the next reminder on a timer.
- Cycles back to the first reminder after reaching the end.
- If there's only one reminder (or none), the cycling timer doesn't run.
- The reminder container has a gentle pulse animation (fades to 70% opacity and back over 3 seconds).

### Customizing

Pass your own array of strings to show different messages. Adjust `intervalMs` to control pacing — smaller values feel more lively, larger values feel more calm.

---

## JournalPanel

**File:** `src/components/JournalPanel.jsx`

A private writing space where you can capture thoughts, feelings, or anything on your mind.

### Props

| Prop        | Type                                          | Description                             |
| ----------- | --------------------------------------------- | --------------------------------------- |
| `showToast` | `(message: string, variant?: string) => void` | Optional callback for save confirmation |

### Features

- **Write freely** in a multi-line text area with the placeholder _"What's on your mind? Write freely..."_
- **Save** your entry with the mint-colored button (disabled when the text area is empty).
- **Browse past entries** below a labeled divider, each showing a timestamp and your text.
- **Delete** any entry with the small `x` button beside its date.
- Entries are **persisted to `localStorage`** under the key `cozy-journal`, so they survive page refreshes.

### Data format

Each entry is stored as:

```json
{
  "id": 1709742000000,
  "text": "Today felt really peaceful.",
  "date": "Thu, Mar 6, 02:00 PM"
}
```

The `id` is generated from `Date.now()`, making it unique and chronologically sortable. Entries are stored newest-first.

### Storage notes

- The component gracefully handles cases where `localStorage` is unavailable (e.g., in private browsing with storage limits).
- There is no limit on the number of entries, but the entry list scrolls after reaching 300px in height.

---

## MessageLog (Legacy)

**File:** `src/components/MessageLog.jsx`

A scrollable log of messages from your companion. This component is not currently wired into `App.jsx` but is ready to use if you want to add a message feed.

### Props

| Prop       | Type                                         | Description         |
| ---------- | -------------------------------------------- | ------------------- |
| `messages` | `Array<{ timestamp: string, text: string }>` | Messages to display |

### Behavior

- Renders each message as a simple text block.
- Auto-scrolls to the bottom when new messages arrive, using a `ref` at the end of the list with `scrollIntoView({ behavior: 'smooth' })`.

---

## StudyTimer (Legacy)

**File:** `src/components/StudyTimer.jsx`

A classic Pomodoro timer with fixed 25-minute study / 5-minute break cycles. This is an earlier version of the timer; `FocusTimer` is the active replacement with more flexibility.

### Props

| Prop            | Type                      | Description                                      |
| --------------- | ------------------------- | ------------------------------------------------ |
| `studyState`    | `string`                  | One of `'idle'`, `'studying'`, `'break'`         |
| `onStateChange` | `(state: string) => void` | Called when the timer transitions between states |

### Cycle

1. Press **Start Studying** to begin a 25-minute focus session.
2. When the timer reaches zero, it automatically transitions to a 5-minute break.
3. When the break ends, the state returns to `idle` and the timer resets.
4. You can press **Stop** at any time to return to `idle`.

---

## SettingsPanel

**File:** `src/components/SettingsPanel.jsx`

A cozy configuration screen for personalizing your companion experience.

### Props

| Prop        | Type                                          | Description                             |
| ----------- | --------------------------------------------- | --------------------------------------- |
| `showToast` | `(message: string, variant?: string) => void` | Optional callback for save confirmation |

### Settings available

| Setting              | Control         | Options                                                             |
| -------------------- | --------------- | ------------------------------------------------------------------- |
| **Companion Name**   | Text input      | Any name you like (default: "Mochi")                                |
| **Color Theme**      | Dropdown select | Lavender Dreams, Mint Meadow, Rose Garden, Peach Sunset, Cloud Nine |
| **Sound Effects**    | Toggle switch   | On / Off (mint colored)                                             |
| **Gentle Reminders** | Toggle switch   | On / Off (lavender colored)                                         |

### Current limitations

The settings are stored in component state only — they reset when the page reloads. A future improvement could persist them to `localStorage` (similar to how `JournalPanel` stores entries) and lift the values up to `App` so other components can respond to them.

---

## Styling & Layout

**File:** `src/App.css`

The app uses a combination of CSS custom properties from `@cozy-village/ui` design tokens and local styles.

### Layout structure

```
.companion-app           max-width 900px centered container
  .companion-header      centered title and avatar
  PastelTabs             pill-style navigation
  PastelDivider          soft horizontal rule
  .companion-main        vertical flex column for tab content
    .companion-row       2-column grid (stacks on mobile < 640px)
```

### Key CSS classes

| Class                | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `.companion-display` | Centers the ASCII art, name, badge, and message   |
| `.companion-ascii`   | Monospace pre-formatted text for the ASCII cat    |
| `.mood-grid`         | Flex-wrap layout for mood buttons                 |
| `.reminder-item`     | Styled reminder with pulse animation              |
| `.timer-display`     | Centered timer with large tabular numbers         |
| `.timer-controls`    | Centered flex row for timer buttons               |
| `.journal-entries`   | Scrollable list of past entries (max 300px)       |
| `.journal-entry`     | Individual entry with left lavender border accent |

### Design tokens used

The styles reference CSS custom properties like `--pastel-surface`, `--pastel-text`, `--pastel-lavender-light`, `--space-xl`, `--font-size-sm`, and `--radius-md`. These are defined in the `@cozy-village/ui` package's `tokens.css` file and imported in `main.jsx`.

### Responsive behavior

On screens narrower than 640px, the `.companion-row` grid collapses from two columns to one, stacking the mood selector above the focus timer.

---

## Shared UI Components

The app uses several components from the `@cozy-village/ui` package. Here's a quick reference for the ones you'll see throughout:

| Component        | Used for                                                           |
| ---------------- | ------------------------------------------------------------------ |
| `PastelCard`     | Wrapping sections with titles, icons, optional glow borders        |
| `PastelButton`   | All interactive buttons (variants: `mint`, `ghost`, `peach`, etc.) |
| `PastelTabs`     | Top-level navigation between Home, Journal, Settings               |
| `PastelToast`    | Temporary notification popups                                      |
| `PastelDivider`  | Horizontal separators, optionally labeled                          |
| `PastelAvatar`   | The header avatar with emoji                                       |
| `PastelBadge`    | Small colored labels (mood badge, timer presets)                   |
| `PastelProgress` | The focus timer's progress bar                                     |
| `PastelTextarea` | Journal text input                                                 |
| `PastelInput`    | Settings text input (companion name)                               |
| `PastelSelect`   | Settings dropdown (theme picker)                                   |
| `PastelToggle`   | Settings on/off switches                                           |

All shared components support a `variant` prop for color theming (e.g., `lavender`, `mint`, `peach`, `sky`, `blush`, `lemon`).

---

## Getting Started with Development

```bash
# From the monorepo root
npx turbo dev --filter=@cozy-village/cozy-companion

# Or from this directory
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Adding a new component

1. Create your file in `src/components/YourComponent.jsx`.
2. Import any needed `@cozy-village/ui` primitives.
3. Import and place it in the appropriate tab section of `src/App.jsx`.
4. Add any CSS classes to `src/App.css`.

Happy building, and take your time. There's no rush here.
