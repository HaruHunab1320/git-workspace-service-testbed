import { describe, it, expect } from 'vitest';
import { getDailyQuote } from '../src/utils/quoteGenerator';

describe('CozyQuoteService - getDailyQuote', () => {
  describe('return type signature', () => {
    it('returns an object with quote, author, and theme properties', () => {
      const result = getDailyQuote();
      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('theme');
    });

    it('returns a string for quote', () => {
      const result = getDailyQuote();
      expect(typeof result.quote).toBe('string');
    });

    it('returns a string for author', () => {
      const result = getDailyQuote();
      expect(typeof result.author).toBe('string');
    });

    it('returns a string for theme', () => {
      const result = getDailyQuote();
      expect(typeof result.theme).toBe('string');
    });

    it('returns non-empty strings for all fields', () => {
      const result = getDailyQuote();
      expect(result.quote.length).toBeGreaterThan(0);
      expect(result.author.length).toBeGreaterThan(0);
      expect(result.theme.length).toBeGreaterThan(0);
    });

    it('returns only the expected keys', () => {
      const result = getDailyQuote();
      expect(Object.keys(result).sort()).toEqual(['author', 'quote', 'theme']);
    });
  });

  describe('deterministic behavior', () => {
    it('returns the same quote for the same date', () => {
      const date = new Date('2026-03-09');
      const result1 = getDailyQuote(date);
      const result2 = getDailyQuote(date);
      expect(result1).toEqual(result2);
    });

    it('returns the same quote when called multiple times with the same date', () => {
      const date = new Date('2026-06-15');
      const results = Array.from({ length: 10 }, () => getDailyQuote(date));
      results.forEach((result) => {
        expect(result).toEqual(results[0]);
      });
    });

    it('returns the same quote for different Date objects representing the same day', () => {
      const date1 = new Date('2026-01-01T00:00:00');
      const date2 = new Date('2026-01-01T23:59:59');
      expect(getDailyQuote(date1)).toEqual(getDailyQuote(date2));
    });

    it('returns potentially different quotes for different dates', () => {
      const dates = Array.from({ length: 31 }, (_, i) => {
        return new Date(`2026-01-${String(i + 1).padStart(2, '0')}`);
      });
      const quotes = dates.map((d) => getDailyQuote(d));
      const uniqueQuotes = new Set(quotes.map((q) => q.quote));
      // With 31 days, we should see more than 1 unique quote
      expect(uniqueQuotes.size).toBeGreaterThan(1);
    });
  });

  describe('default date parameter', () => {
    it('uses today when no date is provided', () => {
      const result = getDailyQuote();
      const resultWithToday = getDailyQuote(new Date());
      expect(result).toEqual(resultWithToday);
    });

    it('accepts an explicit Date argument', () => {
      const specificDate = new Date('2025-12-25');
      const result = getDailyQuote(specificDate);
      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('theme');
    });
  });

  describe('cozy content themes', () => {
    it('theme matches expected cozy categories', () => {
      const cozyThemes = [
        'hygge',
        'tea',
        'reading',
        'nature',
        'gentle productivity',
      ];
      // Check a range of dates to sample themes
      const dates = Array.from({ length: 31 }, (_, i) => {
        return new Date(`2026-01-${String(i + 1).padStart(2, '0')}`);
      });
      const themes = dates.map((d) => getDailyQuote(d).theme.toLowerCase());
      // At least some of the themes should be from the expected cozy categories
      const matchesCozy = themes.some((theme) =>
        cozyThemes.some(
          (cozy) => theme.includes(cozy) || cozy.includes(theme)
        )
      );
      expect(matchesCozy).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles a date at the start of the year', () => {
      const result = getDailyQuote(new Date('2026-01-01'));
      expect(result.quote).toBeTruthy();
      expect(result.author).toBeTruthy();
      expect(result.theme).toBeTruthy();
    });

    it('handles a date at the end of the year', () => {
      const result = getDailyQuote(new Date('2026-12-31'));
      expect(result.quote).toBeTruthy();
      expect(result.author).toBeTruthy();
      expect(result.theme).toBeTruthy();
    });

    it('handles leap year date', () => {
      const result = getDailyQuote(new Date('2028-02-29'));
      expect(result.quote).toBeTruthy();
      expect(result.author).toBeTruthy();
      expect(result.theme).toBeTruthy();
    });

    it('handles dates far in the past', () => {
      const result = getDailyQuote(new Date('1900-01-01'));
      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('theme');
    });

    it('handles dates far in the future', () => {
      const result = getDailyQuote(new Date('2099-12-31'));
      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('theme');
    });
  });

  describe('quote cycling', () => {
    it('cycles through quotes based on the day of the month', () => {
      // Two dates with the same day-of-month should return the same quote
      const jan15 = new Date('2026-01-15');
      const feb15 = new Date('2026-02-15');
      expect(getDailyQuote(jan15)).toEqual(getDailyQuote(feb15));
    });

    it('different days of the month can produce different quotes', () => {
      const day1 = getDailyQuote(new Date('2026-03-01'));
      const day2 = getDailyQuote(new Date('2026-03-02'));
      // They might or might not differ (depends on quotes.length),
      // but at minimum the function should not throw
      expect(day1).toHaveProperty('quote');
      expect(day2).toHaveProperty('quote');
    });
  });
});
