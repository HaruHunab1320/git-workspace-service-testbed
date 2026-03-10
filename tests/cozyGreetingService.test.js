const {
  CozyGreetingService,
  COZY_QUOTES,
  TIME_PERIODS,
} = require('../src/services/cozyGreetingService.js');

/**
 * Helper to set the system clock to a specific hour (0-23) on a fixed date.
 * Uses jest.useFakeTimers to freeze Date so CozyGreetingService sees a
 * deterministic time of day.
 */
function setHour(hour) {
  vi.setSystemTime(new Date(2026, 2, 9, hour, 0, 0)); // March 9, 2026
}

describe('CozyGreetingService', () => {
  let service;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new CozyGreetingService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ------------------------------------------------------------------
  // Return shape
  // ------------------------------------------------------------------
  describe('return value structure', () => {
    it('returns an object with message, quote, and icon properties', () => {
      setHour(10);
      const result = service.getCozyGreeting('Alice');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('icon');
    });

    it('message is a string', () => {
      setHour(10);
      const { message } = service.getCozyGreeting('Alice');
      expect(typeof message).toBe('string');
    });

    it('quote is a string', () => {
      setHour(10);
      const { quote } = service.getCozyGreeting('Alice');
      expect(typeof quote).toBe('string');
    });

    it('icon is a string', () => {
      setHour(10);
      const { icon } = service.getCozyGreeting('Alice');
      expect(typeof icon).toBe('string');
    });
  });

  // ------------------------------------------------------------------
  // userName interpolation
  // ------------------------------------------------------------------
  describe('userName interpolation', () => {
    it('includes the user name in the greeting message', () => {
      setHour(10);
      const { message } = service.getCozyGreeting('Maple');
      expect(message).toContain('Maple');
    });

    it('includes a different user name correctly', () => {
      setHour(10);
      const { message } = service.getCozyGreeting('Birch');
      expect(message).toContain('Birch');
    });

    it('handles a single-character name', () => {
      setHour(14);
      const { message } = service.getCozyGreeting('J');
      expect(message).toContain('J');
    });

    it('handles a name with spaces', () => {
      setHour(14);
      const { message } = service.getCozyGreeting('Mary Jane');
      expect(message).toContain('Mary Jane');
    });

    it('handles an empty string name gracefully', () => {
      setHour(10);
      const result = service.getCozyGreeting('');
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Morning (5:00 – 11:59)
  // ------------------------------------------------------------------
  describe('morning greetings (5:00 – 11:59)', () => {
    it('returns a morning greeting at 5:00 AM (start boundary)', () => {
      setHour(5);
      const { message } = service.getCozyGreeting('Fern');
      expect(message.toLowerCase()).toContain('morning');
    });

    it('returns a morning greeting at 8:00 AM (mid-morning)', () => {
      setHour(8);
      const { message } = service.getCozyGreeting('Fern');
      expect(message.toLowerCase()).toContain('morning');
    });

    it('returns a morning greeting at 11:00 AM (end boundary)', () => {
      setHour(11);
      const { message } = service.getCozyGreeting('Fern');
      expect(message.toLowerCase()).toContain('morning');
    });

    it('uses the ☕ icon for morning', () => {
      setHour(8);
      const { icon } = service.getCozyGreeting('Fern');
      expect(icon).toBe('☕');
    });

    it('includes the coffee emoji in the morning message', () => {
      setHour(8);
      const { message } = service.getCozyGreeting('Fern');
      expect(message).toContain('☕');
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Afternoon (12:00 – 16:59)
  // ------------------------------------------------------------------
  describe('afternoon greetings (12:00 – 16:59)', () => {
    it('returns an afternoon greeting at 12:00 PM (start boundary)', () => {
      setHour(12);
      const { message } = service.getCozyGreeting('Cedar');
      expect(message.toLowerCase()).toContain('afternoon');
    });

    it('returns an afternoon greeting at 14:00 (mid-afternoon)', () => {
      setHour(14);
      const { message } = service.getCozyGreeting('Cedar');
      expect(message.toLowerCase()).toContain('afternoon');
    });

    it('returns an afternoon greeting at 16:00 (end boundary)', () => {
      setHour(16);
      const { message } = service.getCozyGreeting('Cedar');
      expect(message.toLowerCase()).toContain('afternoon');
    });

    it('uses the 🧸 icon for afternoon', () => {
      setHour(14);
      const { icon } = service.getCozyGreeting('Cedar');
      expect(icon).toBe('🧸');
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Evening (17:00 – 20:59)
  // ------------------------------------------------------------------
  describe('evening greetings (17:00 – 20:59)', () => {
    it('returns an evening greeting at 17:00 (start boundary)', () => {
      setHour(17);
      const { message } = service.getCozyGreeting('Willow');
      expect(message.toLowerCase()).toContain('evening');
    });

    it('returns an evening greeting at 19:00 (mid-evening)', () => {
      setHour(19);
      const { message } = service.getCozyGreeting('Willow');
      expect(message.toLowerCase()).toContain('evening');
    });

    it('returns an evening greeting at 20:00 (end boundary)', () => {
      setHour(20);
      const { message } = service.getCozyGreeting('Willow');
      expect(message.toLowerCase()).toContain('evening');
    });

    it('uses the 🕯️ icon for evening', () => {
      setHour(19);
      const { icon } = service.getCozyGreeting('Willow');
      expect(icon).toBe('🕯️');
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Night (21:00 – 4:59)
  // ------------------------------------------------------------------
  describe('night greetings (21:00 – 4:59)', () => {
    it('returns a night greeting at 21:00 (start boundary)', () => {
      setHour(21);
      const { message } = service.getCozyGreeting('Luna');
      expect(message.toLowerCase()).toContain('rest well');
    });

    it('returns a night greeting at midnight (0:00)', () => {
      setHour(0);
      const { message } = service.getCozyGreeting('Luna');
      expect(message.toLowerCase()).toContain('rest well');
    });

    it('returns a night greeting at 3:00 AM', () => {
      setHour(3);
      const { message } = service.getCozyGreeting('Luna');
      expect(message.toLowerCase()).toContain('rest well');
    });

    it('returns a night greeting at 4:00 AM (end boundary)', () => {
      setHour(4);
      const { message } = service.getCozyGreeting('Luna');
      expect(message.toLowerCase()).toContain('rest well');
    });

    it('uses the 🌙 icon for night', () => {
      setHour(23);
      const { icon } = service.getCozyGreeting('Luna');
      expect(icon).toBe('🌙');
    });

    it('includes the moon emoji in the night message', () => {
      setHour(22);
      const { message } = service.getCozyGreeting('Luna');
      expect(message).toContain('🌙');
    });
  });

  // ------------------------------------------------------------------
  // Boundary transitions
  // ------------------------------------------------------------------
  describe('time boundary transitions', () => {
    it('transitions from night to morning at 5:00 AM', () => {
      setHour(4);
      const nightResult = service.getCozyGreeting('Dawn');
      setHour(5);
      const morningResult = service.getCozyGreeting('Dawn');

      expect(nightResult.message.toLowerCase()).toContain('rest well');
      expect(morningResult.message.toLowerCase()).toContain('morning');
    });

    it('transitions from morning to afternoon at 12:00 PM', () => {
      setHour(11);
      const morningResult = service.getCozyGreeting('Sol');
      setHour(12);
      const afternoonResult = service.getCozyGreeting('Sol');

      expect(morningResult.message.toLowerCase()).toContain('morning');
      expect(afternoonResult.message.toLowerCase()).toContain('afternoon');
    });

    it('transitions from afternoon to evening at 17:00', () => {
      setHour(16);
      const afternoonResult = service.getCozyGreeting('Dusk');
      setHour(17);
      const eveningResult = service.getCozyGreeting('Dusk');

      expect(afternoonResult.message.toLowerCase()).toContain('afternoon');
      expect(eveningResult.message.toLowerCase()).toContain('evening');
    });

    it('transitions from evening to night at 21:00', () => {
      setHour(20);
      const eveningResult = service.getCozyGreeting('Star');
      setHour(21);
      const nightResult = service.getCozyGreeting('Star');

      expect(eveningResult.message.toLowerCase()).toContain('evening');
      expect(nightResult.message.toLowerCase()).toContain('rest well');
    });
  });

  // ------------------------------------------------------------------
  // Quote field
  // ------------------------------------------------------------------
  describe('quote', () => {
    it('returns a non-empty quote string', () => {
      setHour(10);
      const { quote } = service.getCozyGreeting('Sage');
      expect(quote.length).toBeGreaterThan(0);
    });

    it('returns a quote from the COZY_QUOTES array', () => {
      setHour(10);
      const { quote } = service.getCozyGreeting('Sage');
      expect(COZY_QUOTES).toContain(quote);
    });

    it('returns a quote for every time period', () => {
      for (const hour of [2, 8, 14, 19]) {
        setHour(hour);
        const { quote } = service.getCozyGreeting('Sage');
        expect(typeof quote).toBe('string');
        expect(quote.length).toBeGreaterThan(0);
      }
    });

    it('selects quotes using Math.random', () => {
      setHour(10);
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
      const { quote } = service.getCozyGreeting('Sage');
      expect(quote).toBe(COZY_QUOTES[0]);
      spy.mockRestore();
    });

    it('selects the last quote when Math.random is near 1', () => {
      setHour(10);
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.999);
      const { quote } = service.getCozyGreeting('Sage');
      expect(quote).toBe(COZY_QUOTES[COZY_QUOTES.length - 1]);
      spy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  // Exported constants
  // ------------------------------------------------------------------
  describe('exported constants', () => {
    it('exports COZY_QUOTES as a non-empty array', () => {
      expect(Array.isArray(COZY_QUOTES)).toBe(true);
      expect(COZY_QUOTES.length).toBeGreaterThan(0);
    });

    it('exports TIME_PERIODS with morning, afternoon, evening, and night', () => {
      expect(TIME_PERIODS).toHaveProperty('morning');
      expect(TIME_PERIODS).toHaveProperty('afternoon');
      expect(TIME_PERIODS).toHaveProperty('evening');
      expect(TIME_PERIODS).toHaveProperty('night');
    });

    it('each TIME_PERIOD has range, icon, and template', () => {
      for (const key of ['morning', 'afternoon', 'evening', 'night']) {
        expect(TIME_PERIODS[key]).toHaveProperty('range');
        expect(TIME_PERIODS[key]).toHaveProperty('icon');
        expect(TIME_PERIODS[key]).toHaveProperty('template');
        expect(typeof TIME_PERIODS[key].template).toBe('function');
      }
    });
  });

  // ------------------------------------------------------------------
  // Consistency and idempotency
  // ------------------------------------------------------------------
  describe('consistency', () => {
    it('returns the same greeting message when called twice at the same time', () => {
      setHour(9);
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result1 = service.getCozyGreeting('Echo');
      const result2 = service.getCozyGreeting('Echo');

      expect(result1.message).toBe(result2.message);
      expect(result1.icon).toBe(result2.icon);
      vi.restoreAllMocks();
    });

    it('produces different messages for different users at the same time', () => {
      setHour(14);
      const result1 = service.getCozyGreeting('Alice');
      const result2 = service.getCozyGreeting('Bob');

      expect(result1.message).not.toBe(result2.message);
    });
  });

  // ------------------------------------------------------------------
  // Instantiation
  // ------------------------------------------------------------------
  describe('class instantiation', () => {
    it('can be instantiated with new', () => {
      expect(service).toBeInstanceOf(CozyGreetingService);
    });

    it('getCozyGreeting is a function', () => {
      expect(typeof service.getCozyGreeting).toBe('function');
    });
  });
});
