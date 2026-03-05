# Cozy Village Tamagotchi

Welcome to the coziest corner of Cozy Village -- where fluffy companions are waiting to be loved!

Your digital pet is more than pixels on a screen. They have moods, favorite weather, secret foraging talents, and a whole little life of their own. All they need is *you*.

---

## Meet the Adoptable Friends

Visit the adoption board and pick your new best friend:

| Pet | Personality | A Little About Them |
|---|---|---|
| **Whiskers** the Cat | Lazy | Found napping on the library windowsill. Prefers fish and warm laps. |
| **Biscuit** the Dog | Loyal | A scruffy golden pup who was waiting by the village gate. |
| **Clover** the Rabbit | Curious | Appeared in the garden one spring morning. Loves dandelions. |
| **Archimedes** the Owl | Gentle | Perches in the old oak by the library. Remarkably well-read. |
| **Russet** the Fox | Mischievous | Steals socks from clotheslines. Impossible not to love. |
| **Bramble** the Hedgehog | Gentle | Found curled up in the herb garden. Loves chamomile. |

---

## How to Care for Your Pet

Caring for your companion is simple -- just three little actions each day:

### Pet them (max 3x/day)

Give your friend a gentle pat. Cats purr, dogs wag, rabbits do a happy little binky. Each pet strengthens your bond and lifts their mood.

### Feed them (1x/day)

A well-fed pet is a happy pet! Feeding restores 30 energy and earns you bonus bond points. Don't worry -- they'll let you know when they're hungry.

### Play with them

Toss a ball, dangle a feather, or just run around the village together. Playing costs a bit of energy (15 points) but builds your bond the fastest -- especially with playful personalities!

---

## Understanding Your Pet

### Mood

Your pet cycles through five moods throughout the day:

- **Ecstatic** -- Pure joy! Everything is wonderful.
- **Happy** -- Tail wags and content sighs.
- **Content** -- Relaxed and at peace.
- **Restless** -- Could use some attention...
- **Lonely** -- Please come say hello!

Mood is shaped by their personality, the weather, and how much love you give them. A lazy cat might be perfectly content snoozing all day, while a mischievous fox gets restless without adventure.

### Energy

Pets start each day with energy that they spend on play and foraging. They recover 40 energy at dawn, so there's always a fresh start tomorrow.

### Bond

This is the heart of your relationship. Every pat, meal, and game of fetch brings you closer together:

| Bond Level | Points | What It Means |
|---|---|---|
| Stranger | 0--14 | Just getting acquainted |
| Familiar | 15--39 | They recognize your footsteps |
| Companion | 40--79 | A true and trusted friend |
| Devoted | 80--119 | An unbreakable connection |
| Soulbound | 120+ | Two souls, one heartbeat |

At Devoted and above, your pet becomes an even better forager -- their love for you sharpens their senses!

> **Tip:** Don't forget to visit your pet at least once a day. A day without interaction means a small dip in bond. They miss you!

---

## Foraging Adventures

When your pet has energy to spare, they'll wander off to explore the village and bring back little treasures -- sticks, gemstones, wildflowers, mysterious old coins, and (if you're very lucky) rare artifacts.

What they find depends on their species, personality, bond level, the season, and a little bit of luck. Curious pets are natural treasure hunters, and a Soulbound companion seems to find the good stuff more often.

Items come in three rarities:

- **Common** -- A sweet everyday find
- **Uncommon** -- Something a little special
- **Rare** -- A one-of-a-kind discovery!

Check your pet's card to see their latest finds.

---

## Weather & Seasons

Your pet has opinions about the weather!

Cats bask in the sun but flee indoors at the first raindrop. Hedgehogs love splashing through puddles but curl into a tight ball when frost arrives. Owls come alive in the fog, and foxes use misty mornings to hunt for hidden treasures.

When the weather is just right, your pet's mood gets a little boost. When it's not their cup of tea, they'll shelter somewhere cozy until it passes.

---

## Village Social Life

Pets don't just bond with you -- they make friends around the village too! Your companion might bound up to a villager, rub against their ankles, or land dramatically on their shoulder (looking at you, Archimedes).

Dogs are especially gifted at making friends and can help boost your own friendships with the villagers. Sometimes a wagging tail opens doors that polite conversation can't.

---

## A Few Cozy Reminders

- There are no fail states. Your pet will never leave you or get sick. This is a cozy place.
- You don't need to grind. Bonds grow naturally over days and weeks of gentle care.
- Every species and personality plays a little differently. Experiment and find your favorite companion!
- Foraged items can be used in crafting and the village economy.

---

## API Quick Reference

| Endpoint | Method | What It Does |
|---|---|---|
| `/api/pets` | GET | See all your adopted pets |
| `/api/pets/adoptable` | GET | Browse the adoption board |
| `/api/pets/adopt` | POST | Bring a new friend home |
| `/api/pets/{name}/pet` | POST | Give pets and scratches |
| `/api/pets/{name}/feed` | POST | Serve up a tasty meal |
| `/api/pets/{name}/play` | POST | Have fun together |

---

*Now go adopt a friend. They've been waiting for you.*
