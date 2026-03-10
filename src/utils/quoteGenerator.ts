/**
 * CozyQuoteService — A deterministic daily quote generator
 * focused on warmth, comfort, and slow living philosophy.
 */

export namespace CozyQuoteService {
  export interface DailyQuote {
    quote: string;
    author: string;
    theme: string;
  }

  const cozyQuotes: readonly DailyQuote[] = [
    // Hygge
    {
      quote: "Happiness is a cup of tea and a really good book.",
      author: "J.A. Hammerton",
      theme: "hygge",
    },
    {
      quote: "There is no time like the pleasant.",
      author: "Oliver Herford",
      theme: "hygge",
    },
    {
      quote: "Almost everything will work again if you unplug it for a few minutes, including you.",
      author: "Anne Lamott",
      theme: "hygge",
    },

    // Tea
    {
      quote: "Where there's tea there's hope.",
      author: "Arthur Wing Pinero",
      theme: "tea",
    },
    {
      quote: "Drinking a daily cup of tea will surely starve the apothecary.",
      author: "Chinese Proverb",
      theme: "tea",
    },
    {
      quote: "Tea is the elixir of life.",
      author: "Lao Tzu",
      theme: "tea",
    },

    // Reading
    {
      quote: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
      author: "George R.R. Martin",
      theme: "reading",
    },
    {
      quote: "There is no friend as loyal as a book.",
      author: "Ernest Hemingway",
      theme: "reading",
    },
    {
      quote: "Reading is dreaming with open eyes.",
      author: "Anissa Trisdianty",
      theme: "reading",
    },

    // Nature
    {
      quote: "Nature does not hurry, yet everything is accomplished.",
      author: "Lao Tzu",
      theme: "nature",
    },
    {
      quote: "In every walk with nature one receives far more than he seeks.",
      author: "John Muir",
      theme: "nature",
    },
    {
      quote: "The earth has music for those who listen.",
      author: "William Shakespeare",
      theme: "nature",
    },

    // Gentle Productivity
    {
      quote: "It is not enough to be busy. The question is: what are we busy about?",
      author: "Henry David Thoreau",
      theme: "gentle productivity",
    },
    {
      quote: "Do what you can, with what you have, where you are.",
      author: "Theodore Roosevelt",
      theme: "gentle productivity",
    },
    {
      quote: "Slow down and everything you are chasing will come around and catch you.",
      author: "John De Paola",
      theme: "gentle productivity",
    },
  ] as const;

  /**
   * Returns a deterministic daily quote based on the given date.
   * The same date will always produce the same quote.
   *
   * @param date - The date to select a quote for (defaults to today)
   * @returns An object with quote, author, and theme
   */
  export function getDailyQuote(date: Date = new Date()): DailyQuote {
    const index = date.getDate() % cozyQuotes.length;
    return { ...cozyQuotes[index] };
  }

  /** Returns the total number of quotes in the collection. */
  export function getQuoteCount(): number {
    return cozyQuotes.length;
  }

  /** Returns all unique themes available in the quote collection. */
  export function getAvailableThemes(): string[] {
    return [...new Set(cozyQuotes.map((q) => q.theme))];
  }
}
