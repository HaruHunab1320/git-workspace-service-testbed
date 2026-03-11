/**
 * End-to-end tests for shared packages (utils, logger).
 *
 * Tests the utility functions and logger module as integrated units,
 * verifying they work correctly when composed together.
 */

import { describe, it, expect, vi, beforeEach as _beforeEach } from 'vitest';
import {
  Logger,
  createLogger,
  LogLevel,
  LogTransport,
  LogEntry,
} from '../src/logger';

// ---------------------------------------------------------------------------
// E2E: Logger used as an application logging pipeline
// ---------------------------------------------------------------------------

describe('Logger E2E: Application logging pipeline', () => {
  function createCollector(): LogTransport & { entries: LogEntry[] } {
    const entries: LogEntry[] = [];
    const transport = ((entry: LogEntry) => {
      entries.push(entry);
    }) as LogTransport & { entries: LogEntry[] };
    transport.entries = entries;
    return transport;
  }

  const fixedTime = () => '2026-01-01T00:00:00.000Z';

  it('logs flow through parent and child loggers to shared transport', () => {
    const collector = createCollector();
    const root = createLogger({
      level: LogLevel.DEBUG,
      context: 'App',
      transports: [collector],
      timestamp: fixedTime,
    });

    const dbLogger = root.child('Database');
    const httpLogger = root.child('HTTP');

    root.info('Application starting');
    dbLogger.info('Connected to database', { host: 'localhost', port: 5432 });
    httpLogger.info('Server listening', { port: 3000 });
    dbLogger.debug('Query executed', { sql: 'SELECT 1', ms: 2 });
    httpLogger.warn('Slow response', { path: '/api/data', ms: 5200 });
    root.error('Unhandled error', new Error('something broke'));

    expect(collector.entries).toHaveLength(6);
    expect(collector.entries[0].context).toBe('App');
    expect(collector.entries[1].context).toBe('App:Database');
    expect(collector.entries[2].context).toBe('App:HTTP');
    expect(collector.entries[3].context).toBe('App:Database');
    expect(collector.entries[4].context).toBe('App:HTTP');
    expect(collector.entries[5].context).toBe('App');

    expect(collector.entries[0].level).toBe(LogLevel.INFO);
    expect(collector.entries[4].level).toBe(LogLevel.WARN);
    expect(collector.entries[5].level).toBe(LogLevel.ERROR);
  });

  it('dynamically adjusts log level mid-session', () => {
    const collector = createCollector();
    const logger = createLogger({
      level: LogLevel.INFO,
      transports: [collector],
      timestamp: fixedTime,
    });

    logger.debug('should be filtered');
    logger.info('visible info');

    expect(collector.entries).toHaveLength(1);

    logger.setLevel(LogLevel.DEBUG);
    logger.debug('now visible');

    expect(collector.entries).toHaveLength(2);
    expect(collector.entries[1].message).toBe('now visible');

    logger.setLevel(LogLevel.SILENT);
    logger.error('suppressed');

    expect(collector.entries).toHaveLength(2);
  });

  it('routes entries to multiple transports simultaneously', () => {
    const fileTransport = createCollector();
    const alertTransport = createCollector();

    const logger = createLogger({
      level: LogLevel.DEBUG,
      transports: [fileTransport, alertTransport],
      timestamp: fixedTime,
    });

    logger.info('both');
    logger.error('critical', { code: 500 });

    expect(fileTransport.entries).toHaveLength(2);
    expect(alertTransport.entries).toHaveLength(2);
    expect(fileTransport.entries[1].data).toEqual({ code: 500 });
    expect(alertTransport.entries[1].data).toEqual({ code: 500 });
  });

  it('deeply nested child loggers maintain correct context chain', () => {
    const collector = createCollector();
    const root = createLogger({
      context: 'Service',
      transports: [collector],
      timestamp: fixedTime,
    });

    const controller = root.child('UserController');
    const validator = controller.child('Validator');
    const sanitizer = validator.child('Sanitizer');

    sanitizer.info('Input sanitized', { field: 'email' });

    expect(collector.entries[0].context).toBe(
      'Service:UserController:Validator:Sanitizer'
    );
  });

  it('handles high-volume logging without data loss', () => {
    const collector = createCollector();
    const logger = createLogger({
      level: LogLevel.DEBUG,
      transports: [collector],
      timestamp: fixedTime,
    });

    for (let i = 0; i < 1000; i++) {
      logger.info(`event-${i}`, { index: i });
    }

    expect(collector.entries).toHaveLength(1000);
    expect(collector.entries[0].message).toBe('event-0');
    expect(collector.entries[999].message).toBe('event-999');
    expect(collector.entries[500].data).toEqual({ index: 500 });
  });

  it('console transport formats messages correctly', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const logger = createLogger({
      level: LogLevel.DEBUG,
      context: 'E2E',
      transports: [Logger.consoleTransport],
      timestamp: () => '2026-03-06T12:00:00.000Z',
    });

    logger.debug('debugging');
    logger.info('information');
    logger.warn('warning');
    logger.error('failure', { stack: 'trace' });

    expect(debugSpy).toHaveBeenCalledOnce();
    expect(debugSpy.mock.calls[0][0]).toContain('[E2E]');
    expect(debugSpy.mock.calls[0][0]).toContain('debugging');

    expect(infoSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('failure'), {
      stack: 'trace',
    });

    vi.restoreAllMocks();
  });

  it('log entries have all required fields and correct types', () => {
    const collector = createCollector();
    const logger = createLogger({
      level: LogLevel.DEBUG,
      context: 'TypeCheck',
      transports: [collector],
      timestamp: fixedTime,
    });

    logger.warn('check types', { a: 1 });
    const entry = collector.entries[0];

    expect(typeof entry.level).toBe('number');
    expect(typeof entry.message).toBe('string');
    expect(typeof entry.timestamp).toBe('string');
    expect(typeof entry.context).toBe('string');
    expect(entry.data).toEqual({ a: 1 });
    expect(entry.level).toBe(LogLevel.WARN);
    expect(entry.timestamp).toBe('2026-01-01T00:00:00.000Z');
  });
});
