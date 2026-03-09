const COZY_QUOTES = [
  "A cup of warmth makes everything better. ☕",
  "Take it slow — the world can wait. 🧸",
  "You belong here, just as you are. 🕯️",
  "Wrap yourself in kindness today. 🧸",
  "Every small moment is worth savoring. ☕",
];

const TIME_PERIODS = {
  morning: {
    range: [5, 12],
    icon: "☕",
    template: (name) => `Good morning, ${name}! Rise and shine ☕`,
  },
  afternoon: {
    range: [12, 17],
    icon: "🧸",
    template: (name) => `Good afternoon, ${name}! Hope your day is cozy 🧸`,
  },
  evening: {
    range: [17, 21],
    icon: "🕯️",
    template: (name) => `Good evening, ${name}! Time to unwind 🕯️`,
  },
  night: {
    range: [21, 5],
    icon: "🌙",
    template: (name) => `Rest well, ${name}! Sweet dreams 🌙`,
  },
};

class CozyGreetingService {
  /**
   * Returns a warm, time-aware greeting for the given user.
   *
   * @param {string} userName - The name of the user to greet.
   * @returns {{ message: string, quote: string, icon: string }}
   *   An object containing a personalized greeting message,
   *   a cozy inspirational quote, and a matching emoji icon.
   */
  getCozyGreeting(userName) {
    const hour = new Date().getHours();
    const period = this._getTimePeriod(hour);

    const message = period.template(userName);
    const quote = COZY_QUOTES[Math.floor(Math.random() * COZY_QUOTES.length)];
    const icon = period.icon;

    return { message, quote, icon };
  }

  /**
   * Determines the time-of-day period for a given hour.
   *
   * @param {number} hour - The current hour (0-23).
   * @returns {object} The matching time period configuration.
   * @private
   */
  _getTimePeriod(hour) {
    if (hour >= 5 && hour < 12) return TIME_PERIODS.morning;
    if (hour >= 12 && hour < 17) return TIME_PERIODS.afternoon;
    if (hour >= 17 && hour < 21) return TIME_PERIODS.evening;
    return TIME_PERIODS.night;
  }
}

module.exports = { CozyGreetingService, COZY_QUOTES, TIME_PERIODS };
