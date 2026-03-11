import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Logger,
  createLogger,
  LogLevel,
  LogEntry,
  LogTransport,
} from '../src/logger';

const FIXED_TIMESTAMP = '2026-01-15T12:00:00.000Z';
const fixedTimestamp = () => FIXED_TIMESTAMP;

function createTestTransport(): LogTransport & { entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  const transport = ((entry: LogEntry) => {
    entries.push(entry);
  }) as LogTransport & { entries: LogEntry[] };
  transport.entries = entries;
  return transport;
}

describe('Logger', () => {
  describe('constructor and defaults', () => {
    it('creates a logger with default options', () => {
      const logger = new Logger();
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });

    it('accepts custom log level', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('accepts custom context', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        context: 'MyModule',
        transports: [transport],
        timestamp: fixedTimestamp,
      });
      logger.info('test');
      expect(transport.entries[0].context).toBe('MyModule');
    });

    it('accepts custom transports', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });
      logger.info('hello');
      expect(transport.entries).toHaveLength(1);
    });

    it('accepts custom timestamp function', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        transports: [transport],
        timestamp: () => 'custom-time',
      });
      logger.info('test');
      expect(transport.entries[0].timestamp).toBe('custom-time');
    });
  });

  describe('log level filtering', () => {
    it('logs messages at or above the configured level', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.WARN,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.debug('debug msg');
      logger.info('info msg');
      logger.warn('warn msg');
      logger.error('error msg');

      expect(transport.entries).toHaveLength(2);
      expect(transport.entries[0].message).toBe('warn msg');
      expect(transport.entries[1].message).toBe('error msg');
    });

    it('logs all messages at DEBUG level', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(transport.entries).toHaveLength(4);
    });

    it('logs nothing at SILENT level', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.SILENT,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(transport.entries).toHaveLength(0);
    });

    it('only logs ERROR at ERROR level', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.ERROR,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(transport.entries).toHaveLength(1);
      expect(transport.entries[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe('log methods', () => {
    let transport: ReturnType<typeof createTestTransport>;
    let logger: Logger;

    beforeEach(() => {
      transport = createTestTransport();
      logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [transport],
        timestamp: fixedTimestamp,
      });
    });

    it('debug() logs at DEBUG level', () => {
      logger.debug('debug message');
      expect(transport.entries[0].level).toBe(LogLevel.DEBUG);
      expect(transport.entries[0].message).toBe('debug message');
    });

    it('info() logs at INFO level', () => {
      logger.info('info message');
      expect(transport.entries[0].level).toBe(LogLevel.INFO);
      expect(transport.entries[0].message).toBe('info message');
    });

    it('warn() logs at WARN level', () => {
      logger.warn('warn message');
      expect(transport.entries[0].level).toBe(LogLevel.WARN);
      expect(transport.entries[0].message).toBe('warn message');
    });

    it('error() logs at ERROR level', () => {
      logger.error('error message');
      expect(transport.entries[0].level).toBe(LogLevel.ERROR);
      expect(transport.entries[0].message).toBe('error message');
    });
  });

  describe('structured data', () => {
    let transport: ReturnType<typeof createTestTransport>;
    let logger: Logger;

    beforeEach(() => {
      transport = createTestTransport();
      logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [transport],
        timestamp: fixedTimestamp,
      });
    });

    it('attaches additional data to log entries', () => {
      const data = { userId: 123, action: 'login' };
      logger.info('user action', data);
      expect(transport.entries[0].data).toEqual(data);
    });

    it('omits data field when no data is provided', () => {
      logger.info('no data');
      expect(transport.entries[0]).not.toHaveProperty('data');
    });

    it('handles null data', () => {
      logger.info('null data', null);
      expect(transport.entries[0].data).toBeNull();
    });

    it('handles undefined data (omits field)', () => {
      logger.info('undef data', undefined);
      expect(transport.entries[0]).not.toHaveProperty('data');
    });

    it('handles complex nested data', () => {
      const nested = { a: { b: { c: [1, 2, 3] } } };
      logger.info('nested', nested);
      expect(transport.entries[0].data).toEqual(nested);
    });

    it('handles Error objects as data', () => {
      const err = new Error('something broke');
      logger.error('failure', err);
      expect(transport.entries[0].data).toBe(err);
    });
  });

  describe('LogEntry structure', () => {
    it('produces entries with correct fields', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        context: 'TestCtx',
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.info('structured', { key: 'val' });

      const entry = transport.entries[0];
      expect(entry).toEqual({
        level: LogLevel.INFO,
        message: 'structured',
        timestamp: FIXED_TIMESTAMP,
        context: 'TestCtx',
        data: { key: 'val' },
      });
    });

    it('omits context when not configured', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.info('no context');
      expect(transport.entries[0]).not.toHaveProperty('context');
    });
  });

  describe('setLevel / getLevel', () => {
    it('dynamically changes log level', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.ERROR,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      logger.info('should not appear');
      expect(transport.entries).toHaveLength(0);

      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);

      logger.info('should appear');
      expect(transport.entries).toHaveLength(1);
    });
  });

  describe('transports', () => {
    it('sends entries to multiple transports', () => {
      const t1 = createTestTransport();
      const t2 = createTestTransport();
      const logger = new Logger({
        transports: [t1, t2],
        timestamp: fixedTimestamp,
      });

      logger.info('multi');

      expect(t1.entries).toHaveLength(1);
      expect(t2.entries).toHaveLength(1);
      expect(t1.entries[0].message).toBe('multi');
      expect(t2.entries[0].message).toBe('multi');
    });

    it('works with no transports', () => {
      const logger = new Logger({ transports: [] });
      expect(() => logger.info('no transports')).not.toThrow();
    });
  });

  describe('consoleTransport', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls console.debug for DEBUG level', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      Logger.consoleTransport({
        level: LogLevel.DEBUG,
        message: 'dbg',
        timestamp: FIXED_TIMESTAMP,
      });
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('dbg');
    });

    it('calls console.info for INFO level', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      Logger.consoleTransport({
        level: LogLevel.INFO,
        message: 'inf',
        timestamp: FIXED_TIMESTAMP,
      });
      expect(spy).toHaveBeenCalledOnce();
    });

    it('calls console.warn for WARN level', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      Logger.consoleTransport({
        level: LogLevel.WARN,
        message: 'wrn',
        timestamp: FIXED_TIMESTAMP,
      });
      expect(spy).toHaveBeenCalledOnce();
    });

    it('calls console.error for ERROR level', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.consoleTransport({
        level: LogLevel.ERROR,
        message: 'err',
        timestamp: FIXED_TIMESTAMP,
      });
      expect(spy).toHaveBeenCalledOnce();
    });

    it('includes context in the console message', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      Logger.consoleTransport({
        level: LogLevel.INFO,
        message: 'msg',
        timestamp: FIXED_TIMESTAMP,
        context: 'App',
      });
      expect(spy.mock.calls[0][0]).toContain('[App]');
    });

    it('passes data as additional argument', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const data = { foo: 'bar' };
      Logger.consoleTransport({
        level: LogLevel.INFO,
        message: 'with data',
        timestamp: FIXED_TIMESTAMP,
        data,
      });
      expect(spy).toHaveBeenCalledWith(expect.any(String), data);
    });

    it('does not pass extra arg when data is undefined', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      Logger.consoleTransport({
        level: LogLevel.INFO,
        message: 'no data',
        timestamp: FIXED_TIMESTAMP,
      });
      expect(spy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('child loggers', () => {
    it('creates a child logger with combined context', () => {
      const transport = createTestTransport();
      const parent = new Logger({
        context: 'App',
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      const child = parent.child('DB');
      child.info('connected');

      expect(transport.entries[0].context).toBe('App:DB');
    });

    it('creates a child with just the child context when parent has none', () => {
      const transport = createTestTransport();
      const parent = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      const child = parent.child('Worker');
      child.info('started');

      expect(transport.entries[0].context).toBe('Worker');
    });

    it('child inherits parent log level', () => {
      const transport = createTestTransport();
      const parent = new Logger({
        level: LogLevel.WARN,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      const child = parent.child('Sub');
      child.info('filtered out');
      child.warn('visible');

      expect(transport.entries).toHaveLength(1);
      expect(transport.entries[0].message).toBe('visible');
    });

    it('child shares transports with parent', () => {
      const transport = createTestTransport();
      const parent = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      const child = parent.child('Sub');
      parent.info('from parent');
      child.info('from child');

      expect(transport.entries).toHaveLength(2);
    });

    it('supports deeply nested children', () => {
      const transport = createTestTransport();
      const root = new Logger({
        context: 'Root',
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      const child = root.child('Mid').child('Leaf');
      child.info('deep');

      expect(transport.entries[0].context).toBe('Root:Mid:Leaf');
    });
  });

  describe('createLogger factory', () => {
    it('returns a Logger instance', () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('passes options through to the constructor', () => {
      const transport = createTestTransport();
      const logger = createLogger({
        level: LogLevel.ERROR,
        context: 'Factory',
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      expect(logger.getLevel()).toBe(LogLevel.ERROR);
      logger.error('test');
      expect(transport.entries[0].context).toBe('Factory');
    });

    it('works with no arguments', () => {
      const logger = createLogger();
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });
  });

  describe('LogLevel enum', () => {
    it('has correct numeric ordering', () => {
      expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
      expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
      expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
      expect(LogLevel.ERROR).toBeLessThan(LogLevel.SILENT);
    });

    it('has expected values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.SILENT).toBe(4);
    });
  });

  describe('timestamp behavior', () => {
    it('uses ISO timestamp by default', () => {
      const transport = createTestTransport();
      const logger = new Logger({ transports: [transport] });
      logger.info('time test');
      // Should be a valid ISO string
      expect(() => new Date(transport.entries[0].timestamp)).not.toThrow();
      expect(transport.entries[0].timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });
  });

  describe('edge cases', () => {
    it('handles empty string messages', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });
      logger.info('');
      expect(transport.entries[0].message).toBe('');
    });

    it('handles very long messages', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });
      const longMsg = 'x'.repeat(10000);
      logger.info(longMsg);
      expect(transport.entries[0].message).toBe(longMsg);
    });

    it('handles rapid sequential logging', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [transport],
        timestamp: fixedTimestamp,
      });

      for (let i = 0; i < 100; i++) {
        logger.info(`msg ${i}`);
      }

      expect(transport.entries).toHaveLength(100);
      expect(transport.entries[99].message).toBe('msg 99');
    });

    it('handles special characters in messages', () => {
      const transport = createTestTransport();
      const logger = new Logger({
        transports: [transport],
        timestamp: fixedTimestamp,
      });
      logger.info('line1\nline2\ttab "quotes" & <html>');
      expect(transport.entries[0].message).toBe(
        'line1\nline2\ttab "quotes" & <html>'
      );
    });
  });
});
