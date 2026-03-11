# ☕ Cozy Greeting Service

_A warm welcome, every time you arrive._

---

## Overview 🧸

The **Cozy Greeting Service** brings a gentle, time-aware greeting to your application. Depending on the time of day, users receive a personalized welcome message paired with an uplifting quote and a cozy icon — because every interaction deserves a little warmth. 🕯️

Whether it's a bright morning coffee moment ☕, a sunny afternoon pause, or a peaceful evening wind-down 🌙, the Cozy Greeting Service makes your users feel right at home.

---

## Features

- **Time-aware greetings** — Messages adapt to morning, afternoon, evening, and night.
- **Personalized welcome** — Each greeting includes the user's name for a personal touch.
- **Cozy quotes** — Every response comes with an inspiring, gentle quote.
- **Themed icons** — A matching emoji icon accompanies each greeting to set the mood.

---

## Response Structure

The `getCozyGreeting(userName)` method returns an object with the following shape:

```json
{
  "message": "Good morning, Sasha! ☕",
  "quote": "A new day is a gentle reminder that you can start again.",
  "icon": "☕"
}
```

| Field     | Type     | Description                                                  |
| --------- | -------- | ------------------------------------------------------------ |
| `message` | `string` | A warm, time-aware greeting that includes the user's name.   |
| `quote`   | `string` | A cozy, uplifting quote to brighten the moment.              |
| `icon`    | `string` | An emoji icon that matches the time of day (☕, 🧸, 🕯️, 🌙). |

### Greeting Periods

| Time of Day  | Hours       | Example Message             | Icon |
| ------------ | ----------- | --------------------------- | ---- |
| 🌅 Morning   | 5:00–11:59  | "Good morning, Sasha! ☕"   | ☕   |
| ☀️ Afternoon | 12:00–16:59 | "Good afternoon, Sasha! 🧸" | 🧸   |
| 🕯️ Evening   | 17:00–20:59 | "Good evening, Sasha! 🕯️"   | 🕯️   |
| 🌙 Night     | 21:00–4:59  | "Rest well, Sasha! 🌙"      | 🌙   |

---

## Getting Started

### Installation

The Cozy Greeting Service lives at `src/services/cozyGreetingService.js` — no additional dependencies required.

### Usage

```js
import { CozyGreetingService } from '../src/services/cozyGreetingService.js';

// Create an instance of the service
const greeter = new CozyGreetingService();

// Get a cozy greeting for a user
const greeting = greeter.getCozyGreeting('Sasha');

console.log(greeting.message); // "Good morning, Sasha! ☕"
console.log(greeting.quote); // "A new day is a gentle reminder that you can start again."
console.log(greeting.icon); // "☕"
```

### Integration Example

Here's how you might use the Cozy Greeting Service in an Express route:

```js
import express from 'express';
import { CozyGreetingService } from '../src/services/cozyGreetingService.js';

const app = express();
const greeter = new CozyGreetingService();

app.get('/api/greet/:name', (req, res) => {
  const greeting = greeter.getCozyGreeting(req.params.name);
  res.json(greeting);
});
```

---

## API Reference

### `CozyGreetingService`

#### Constructor

```js
const greeter = new CozyGreetingService();
```

Creates a new instance of the Cozy Greeting Service.

#### `getCozyGreeting(userName)`

Returns a cozy, time-aware greeting for the given user.

**Parameters:**

| Name       | Type     | Description                    |
| ---------- | -------- | ------------------------------ |
| `userName` | `string` | The name of the user to greet. |

**Returns:** `{ message: string, quote: string, icon: string }`

---

## Notes 🕯️

- The greeting period is determined by the system clock at the time of the call.
- All user-facing strings are designed to feel gentle, inviting, and cozy.
- This service has no external dependencies and can be used in any JavaScript environment.

_Stay cozy._ 🧸
