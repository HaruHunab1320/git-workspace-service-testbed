# Logging

## Overview

The codebase provides a standardized `Logger` class in `src/logger.ts`. It replaces scattered `console.*` calls with a consistent, prefixed, level-aware logging interface. A default `logger` instance is exported for immediate use.

## Quick Start

```ts
import { logger } from '../src/logger';

logger.info('Server started on port 3000');
logger.warn('Deprecated API called');
logger.error('Failed to connect', err);
logger.debug('Request payload:', data);
```

## Creating a Custom Logger

```ts
import { Logger } from '../src/logger';

const logger = new Logger({ prefix: 'MyService', minLevel: 'warn' });
logger.info('This will be suppressed');
logger.warn('This will be logged');
```

## API

### `new Logger(options?)`

Creates a logger instance.

**`LoggerOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | `"alpha"` | Label included in every log message |
| `minLevel` | `LogLevel` | `"info"` | Minimum severity level; messages below this are suppressed |

### Log Methods

Each method accepts a message string and optional additional arguments:

- **`debug(message, ...args)`** — uses `console.debug`
- **`info(message, ...args)`** — uses `console.info`
- **`warn(message, ...args)`** — uses `console.warn`
- **`error(message, ...args)`** — uses `console.error`

### `child(prefix)`

Creates a new `Logger` instance with a chained prefix and the same `minLevel`. Useful for scoping logs within sub-components or sub-modules.

```ts
const parentLogger = new Logger({ prefix: 'App' });
const childLogger = parentLogger.child('Database');

childLogger.info('Connected');
// Output: [2026-03-06T12:00:00.000Z] [App:Database] INFO: Connected
```

### Log Levels

Levels from least to most severe:

| Level | Value | Console Method |
|-------|-------|---------------|
| `debug` | 0 | `console.debug` |
| `info` | 1 | `console.info` |
| `warn` | 2 | `console.warn` |
| `error` | 3 | `console.error` |

### Exported Types

- **`LogLevel`** — `"debug" | "info" | "warn" | "error"`
- **`LoggerOptions`** — `{ prefix?: string; minLevel?: LogLevel }`

### Default Instance

```ts
export const logger = new Logger();
// prefix: "alpha", minLevel: "info"
```

## Output Format

```
[<ISO timestamp>] [<prefix>] <LEVEL>: <message>
```

Example:

```
[2026-03-06T12:00:00.000Z] [alpha] INFO: Server started on port 3000
```

## Migration Guide

Replace direct `console.*` calls with logger instances:

```diff
- console.error('Failed to fetch status:', err);
+ import { logger } from '../src/logger';
+ logger.error('Failed to fetch status:', err);
```

For module-specific logging, create a scoped logger:

```ts
const log = new Logger({ prefix: 'InventoryShelf' });
log.error('Failed to fetch inventory:', err);
```

Or use `child()` to create sub-scoped loggers from an existing instance:

```ts
const dbLog = logger.child('Database');
dbLog.error('Query failed', err);
// Output: [2026-03-06T12:00:00.000Z] [alpha:Database] ERROR: Query failed
```
