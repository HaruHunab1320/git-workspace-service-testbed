# Logger Utility

A standardized logging utility for the Cozy Village monorepo. Provides configurable log levels, pluggable transports, and hierarchical child loggers.

**Source:** `src/logger.ts`
**Tests:** `tests/logger.test.ts` (46 tests)

## Quick Start

```ts
import { Logger, createLogger, LogLevel } from '../src/logger';

// Use the factory function
const logger = createLogger({ context: 'MyApp' });

logger.info('Server started');
logger.error('Connection failed', { host: 'localhost', port: 5432 });
```

## Log Levels

Levels are ordered by severity. Messages below the configured minimum level are suppressed.

| Level    | Value | Description                    |
| -------- | ----- | ------------------------------ |
| `DEBUG`  | 0     | Verbose output for development |
| `INFO`   | 1     | General operational messages   |
| `WARN`   | 2     | Potential issues worth noting  |
| `ERROR`  | 3     | Failures that need attention   |
| `SILENT` | 4     | Suppresses all output          |

Default level: `INFO`

```ts
const logger = new Logger({ level: LogLevel.DEBUG });
logger.debug('This will appear');

logger.setLevel(LogLevel.ERROR);
logger.info('This will be suppressed');
```

## API

### `new Logger(options?)`

| Option       | Type             | Default                          | Description                     |
| ------------ | ---------------- | -------------------------------- | ------------------------------- |
| `level`      | `LogLevel`       | `LogLevel.INFO`                  | Minimum level to log            |
| `context`    | `string`         | `undefined`                      | Label prepended to log messages |
| `transports` | `LogTransport[]` | `[Logger.consoleTransport]`      | Output handlers for log entries |
| `timestamp`  | `() => string`   | `() => new Date().toISOString()` | Timestamp generator             |

### Log Methods

All methods accept a message string and optional structured data:

```ts
logger.debug(message: string, data?: unknown): void
logger.info(message: string, data?: unknown): void
logger.warn(message: string, data?: unknown): void
logger.error(message: string, data?: unknown): void
```

### `logger.child(context: string): Logger`

Creates a child logger that inherits the parent's level, transports, and timestamp function. Contexts are joined with `:`.

```ts
const app = new Logger({ context: 'App' });
const db = app.child('DB');
const query = db.child('Query');

query.info('Executed SELECT'); // context: "App:DB:Query"
```

### `logger.setLevel(level: LogLevel): void`

Dynamically changes the minimum log level at runtime.

### `logger.getLevel(): LogLevel`

Returns the current minimum log level.

### `createLogger(options?: LoggerOptions): Logger`

Factory function -- shorthand for `new Logger(options)`.

## Transports

A transport is a function that receives a `LogEntry` and handles output. The built-in `Logger.consoleTransport` routes entries to the appropriate `console.*` method.

```ts
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

type LogTransport = (entry: LogEntry) => void;
```

### Custom Transport Example

```ts
const fileTransport: LogTransport = (entry) => {
  fs.appendFileSync('app.log', JSON.stringify(entry) + '\n');
};

const logger = new Logger({
  transports: [Logger.consoleTransport, fileTransport],
});
```

### Disabling Output

Pass an empty transports array or use `LogLevel.SILENT`:

```ts
const quiet = new Logger({ transports: [] });
const silent = new Logger({ level: LogLevel.SILENT });
```

## Testing

The logger has 46 unit tests covering:

- Level filtering (DEBUG through SILENT)
- Structured data attachment (objects, null, Error instances)
- Console transport routing to correct `console.*` methods
- Child logger context chaining and level inheritance
- `createLogger` factory
- Edge cases (empty messages, long messages, special characters, rapid logging)

Run tests with:

```bash
npx vitest run tests/logger.test.ts
```
