import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CozyGreetingService } from '../src/services/cozyGreetingService.js';

/**
 * Helper to set the system clock to a specific hour (0-23) on a fixed date.
 * Uses vi.useFakeTimers to freeze Date so CozyGreetingService sees a
 * deterministic time of day.
 */
function setHour(hour) {
  const date = new Date(2026, 2, 9, hour, 0, 0); // March 9, 2026
  vi.setSystemTime(date);
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
  // Time-of-day logic: Morning
  // ------------------------------------------------------------------
  describe('morning greetings (5:00 - 11:59)', () => {
    it('returns a morning greeting at 5:00 AM', () => {
      setHour(5);
      const { message } = service.getCozyGreeting('Fern');
      expect(message.toLowerCase()).toContain('morning');
    });

    it('returns a morning greeting at 8:00 AM', () => {
      setHour(8);
      const { message } = service.getCozyGreeting('Fern');
      expect(message.toLowerCase()).toContain('morning');
    });

    it('returns a morning greeting at 11:00 AM', () => {
      setHour(11);
      const { message } = service.getCozyGreeting('Fern');
      expect(message.toLowerCase()).toContain('morning');
    });

    it('includes a cozy morning icon', () => {
      setHour(8);
      const { icon } = service.getCozyGreeting('Fern');
      expect(icon).toBeTruthy();
    });

    it('includes the coffee emoji in the morning message', () => {
      setHour(8);
      const result = service.getCozyGreeting('Fern');
      // The spec says morning messages should include ☕
      expect(result.message + result.icon).toContain('☕');
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Afternoon
  // ------------------------------------------------------------------
  describe('afternoon greetings (12:00 - 17:59)', () => {
    it('returns an afternoon greeting at 12:00 PM', () => {
      setHour(12);
      const { message } = service.getCozyGreeting('Cedar');
      expect(message.toLowerCase()).toContain('afternoon');
    });

    it('returns an afternoon greeting at 15:00', () => {
      setHour(15);
      const { message } = service.getCozyGreeting('Cedar');
      expect(message.toLowerCase()).toContain('afternoon');
    });

    it('returns an afternoon greeting at 17:00', () => {
      setHour(17);
      const { message } = service.getCozyGreeting('Cedar');
      expect(message.toLowerCase()).toContain('afternoon');
    });

    it('includes a cozy afternoon icon', () => {
      setHour(14);
      const { icon } = service.getCozyGreeting('Cedar');
      expect(icon).toBeTruthy();
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Evening
  // ------------------------------------------------------------------
  describe('evening greetings (18:00 - 21:59)', () => {
    it('returns an evening greeting at 18:00', () => {
      setHour(18);
      const { message } = service.getCozyGreeting('Willow');
      expect(message.toLowerCase()).toContain('evening');
    });

    it('returns an evening greeting at 20:00', () => {
      setHour(20);
      const { message } = service.getCozyGreeting('Willow');
      expect(message.toLowerCase()).toContain('evening');
    });

    it('includes a cozy evening icon', () => {
      setHour(19);
      const { icon } = service.getCozyGreeting('Willow');
      expect(icon).toBeTruthy();
    });
  });

  // ------------------------------------------------------------------
  // Time-of-day logic: Night
  // ------------------------------------------------------------------
  describe('night greetings (22:00 - 4:59)', () => {
    it('returns a night/rest greeting at 22:00', () => {
      setHour(22);
      const { message } = service.getCozyGreeting('Luna');
      // The spec says night messages use "Rest well" and 🌙
      expect(
        message.toLowerCase().includes('rest') ||
          message.toLowerCase().includes('night')
      ).toBe(true);
    });

    it('returns a night/rest greeting at midnight (0:00)', () => {
      setHour(0);
      const { message } = service.getCozyGreeting('Luna');
      expect(
        message.toLowerCase().includes('rest') ||
          message.toLowerCase().includes('night')
      ).toBe(true);
    });

    it('returns a night/rest greeting at 3:00 AM', () => {
      setHour(3);
      const { message } = service.getCozyGreeting('Luna');
      expect(
        message.toLowerCase().includes('rest') ||
          message.toLowerCase().includes('night')
      ).toBe(true);
    });

    it('includes the moon emoji in the night message', () => {
      setHour(23);
      const result = service.getCozyGreeting('Luna');
      expect(result.message + result.icon).toContain('🌙');
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

      expect(
        nightResult.message.toLowerCase().includes('rest') ||
          nightResult.message.toLowerCase().includes('night')
      ).toBe(true);
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

    it('transitions from afternoon to evening at 18:00', () => {
      setHour(17);
      const afternoonResult = service.getCozyGreeting('Dusk');
      setHour(18);
      const eveningResult = service.getCozyGreeting('Dusk');

      expect(afternoonResult.message.toLowerCase()).toContain('afternoon');
      expect(eveningResult.message.toLowerCase()).toContain('evening');
    });

    it('transitions from evening to night at 22:00', () => {
      setHour(21);
      const eveningResult = service.getCozyGreeting('Star');
      setHour(22);
      const nightResult = service.getCozyGreeting('Star');

      expect(eveningResult.message.toLowerCase()).toContain('evening');
      expect(
        nightResult.message.toLowerCase().includes('rest') ||
          nightResult.message.toLowerCase().includes('night')
      ).toBe(true);
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

    it('returns a quote for every time period', () => {
      for (const hour of [2, 8, 14, 20]) {
        setHour(hour);
        const { quote } = service.getCozyGreeting('Sage');
        expect(typeof quote).toBe('string');
        expect(quote.length).toBeGreaterThan(0);
      }
    });
  });

  // ------------------------------------------------------------------
  // Consistency and idempotency
  // ------------------------------------------------------------------
  describe('consistency', () => {
    it('returns the same time-period greeting when called twice at the same time', () => {
      setHour(9);
      const result1 = service.getCozyGreeting('Echo');
      const result2 = service.getCozyGreeting('Echo');

      expect(result1.message).toBe(result2.message);
      expect(result1.icon).toBe(result2.icon);
    });

    it('produces different messages for different users at the same time', () => {
      setHour(14);
      const result1 = service.getCozyGreeting('Alice');
      const result2 = service.getCozyGreeting('Bob');

      // Messages should differ because the name is interpolated
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
