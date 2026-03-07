export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

export type LogTransport = (entry: LogEntry) => void;

export interface LoggerOptions {
  level?: LogLevel;
  context?: string;
  transports?: LogTransport[];
  timestamp?: () => string;
}

export class Logger {
  private level: LogLevel;
  private context?: string;
  private transports: LogTransport[];
  private timestampFn: () => string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.context = options.context;
    this.transports = options.transports ?? [Logger.consoleTransport];
    this.timestampFn = options.timestamp ?? (() => new Date().toISOString());
  }

  static consoleTransport: LogTransport = (entry: LogEntry) => {
    const prefix = entry.context ? `[${entry.context}]` : '';
    const msg = prefix
      ? `${entry.timestamp} ${LogLevel[entry.level]} ${prefix} ${entry.message}`
      : `${entry.timestamp} ${LogLevel[entry.level]} ${entry.message}`;
    const fn =
      entry.level === LogLevel.DEBUG ? console.debug :
      entry.level === LogLevel.INFO ? console.info :
      entry.level === LogLevel.WARN ? console.warn :
      console.error;
    if (entry.data !== undefined) {
      fn(msg, entry.data);
    } else {
      fn(msg);
    }
  };

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: this.timestampFn(),
    };
    if (this.context) entry.context = this.context;
    if (data !== undefined) entry.data = data;

    for (const transport of this.transports) {
      transport(entry);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  child(context: string): Logger {
    return new Logger({
      level: this.level,
      context: this.context ? `${this.context}:${context}` : context,
      transports: this.transports,
      timestamp: this.timestampFn,
    });
  }
}

export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}
