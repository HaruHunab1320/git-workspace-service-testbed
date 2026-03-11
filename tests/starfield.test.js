import { describe, it, expect } from 'vitest';
import {
  getStarfield,
  getConstellationLore,
  getSeasonConstellations,
  describeStarfield,
} from '../packages/utils/starfield.js';

describe('Starfield Generator', () => {
  describe('getStarfield', () => {
    it('returns a valid starfield object', () => {
      const sf = getStarfield(1, 'summer');
      expect(sf).toHaveProperty('day', 1);
      expect(sf).toHaveProperty('season', 'summer');
      expect(sf).toHaveProperty('stars');
      expect(sf).toHaveProperty('constellations');
      expect(sf).toHaveProperty('shootingStar');
    });

    it('generates the default number of stars (80)', () => {
      const sf = getStarfield(5, 'winter');
      expect(sf.stars).toHaveLength(80);
    });

    it('respects the starCount option', () => {
      const sf = getStarfield(5, 'winter', { starCount: 20 });
      expect(sf.stars).toHaveLength(20);
    });

    it('produces stars with valid coordinates and brightness', () => {
      const sf = getStarfield(10, 'spring');
      for (const star of sf.stars) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThan(1);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThan(1);
        expect(star.brightness).toBeGreaterThanOrEqual(0.3);
        expect(star.brightness).toBeLessThanOrEqual(1);
        expect(star.size).toBeGreaterThanOrEqual(1);
        expect(star.size).toBeLessThanOrEqual(3);
      }
    });

    it('is deterministic — same inputs produce same output', () => {
      const a = getStarfield(42, 'autumn');
      const b = getStarfield(42, 'autumn');
      expect(a).toEqual(b);
    });

    it('produces different results for different days', () => {
      const a = getStarfield(1, 'spring');
      const b = getStarfield(2, 'spring');
      expect(a.stars).not.toEqual(b.stars);
    });

    it('produces different results for different seasons', () => {
      const a = getStarfield(1, 'spring');
      const b = getStarfield(1, 'winter');
      expect(a.stars).not.toEqual(b.stars);
    });

    it('normalises season to lowercase', () => {
      const sf = getStarfield(1, 'SUMMER');
      expect(sf.season).toBe('summer');
    });

    it('throws on invalid season', () => {
      expect(() => getStarfield(1, 'monsoon')).toThrow(/Invalid season/);
    });

    it('returns 3 constellations per season', () => {
      for (const season of ['spring', 'summer', 'autumn', 'winter']) {
        const sf = getStarfield(1, season);
        expect(sf.constellations).toHaveLength(3);
      }
    });

    it('marks constellations as visible or not', () => {
      const sf = getStarfield(1, 'winter');
      for (const c of sf.constellations) {
        expect(typeof c.visible).toBe('boolean');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('anchor');
        expect(c).toHaveProperty('brightness');
      }
    });

    it('shooting star has valid shape when present', () => {
      // Brute-force find a day with a shooting star
      let found = null;
      for (let day = 1; day <= 200; day++) {
        const sf = getStarfield(day, 'summer');
        if (sf.shootingStar) {
          found = sf.shootingStar;
          break;
        }
      }
      expect(found).not.toBeNull();
      expect(found.startX).toBeGreaterThanOrEqual(0);
      expect(found.startX).toBeLessThanOrEqual(1);
      expect(found.startY).toBeGreaterThanOrEqual(0);
      expect(found.startY).toBeLessThanOrEqual(0.5);
      expect(found.angle).toBeGreaterThanOrEqual(30);
      expect(found.angle).toBeLessThanOrEqual(150);
      expect(found.speed).toBeGreaterThan(0);
    });
  });

  describe('getConstellationLore', () => {
    it('returns lore for a known constellation', () => {
      const lore = getConstellationLore('The Hearth');
      expect(lore).toContain('brightest winter constellation');
    });

    it('returns null for an unknown constellation', () => {
      expect(getConstellationLore('The Platypus')).toBeNull();
    });

    it('has lore for every seasonal constellation', () => {
      for (const season of ['spring', 'summer', 'autumn', 'winter']) {
        const names = getSeasonConstellations(season);
        for (const name of names) {
          expect(getConstellationLore(name)).not.toBeNull();
        }
      }
    });
  });

  describe('getSeasonConstellations', () => {
    it('returns 3 names per season', () => {
      for (const season of ['spring', 'summer', 'autumn', 'winter']) {
        const names = getSeasonConstellations(season);
        expect(names).toHaveLength(3);
        names.forEach((n) => expect(typeof n).toBe('string'));
      }
    });

    it('throws on invalid season', () => {
      expect(() => getSeasonConstellations('drought')).toThrow(
        /Invalid season/
      );
    });
  });

  describe('describeStarfield', () => {
    it('includes star count', () => {
      const sf = getStarfield(1, 'spring');
      const desc = describeStarfield(sf);
      expect(desc).toContain(`${sf.stars.length} stars`);
    });

    it('mentions visible constellations by name', () => {
      // Create a starfield with at least one visible constellation
      const sf = {
        stars: new Array(50),
        constellations: [
          {
            name: 'The Hearth',
            anchor: { x: 0.5, y: 0.2 },
            brightness: 1,
            visible: true,
          },
          {
            name: 'The Snowflake',
            anchor: { x: 0.3, y: 0.5 },
            brightness: 0.9,
            visible: false,
          },
        ],
        shootingStar: null,
      };
      const desc = describeStarfield(sf);
      expect(desc).toContain('The Hearth');
      expect(desc).not.toContain('The Snowflake');
    });

    it('notes when constellations are hidden', () => {
      const sf = {
        stars: new Array(30),
        constellations: [
          {
            name: 'Test',
            anchor: { x: 0, y: 0 },
            brightness: 1,
            visible: false,
          },
        ],
        shootingStar: null,
      };
      const desc = describeStarfield(sf);
      expect(desc).toContain('hidden behind clouds');
    });

    it('includes shooting star message when present', () => {
      const sf = {
        stars: new Array(10),
        constellations: [],
        shootingStar: { startX: 0.5, startY: 0.2, angle: 45, speed: 1 },
      };
      const desc = describeStarfield(sf);
      expect(desc).toContain('shooting star');
    });
  });
});
