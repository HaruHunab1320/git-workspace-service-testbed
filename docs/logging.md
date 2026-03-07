# Logging

## Overview

The `@cozy-village/utils` package provides a standardized logger utility via `createLogger`. It replaces scattered `console.*` calls with a consistent, prefixed, level-aware logging interface.

## Usage

```js
const { createLogger } = require('@cozy-village/utils/logger');

const logger = createLogger('MyComponent');

logger.info('Server started on port 3000');
logger.warn('Deprecated API called');
logger.error('Failed to connect', err);
logger.debug('Request payload:', data);
```

## API

### `createLogger(prefix, options?)`

Creates a logger instance.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prefix` | `string` | *(required)* | Label included in every log message (e.g. component or module name) |
| `options.level` | `string` | `'info'` | Minimum log level. Messages below this level are suppressed. |

**Returns** an object with four methods: `debug`, `info`, `warn`, `error`. Each accepts any number of arguments, matching the `console.*` signature.

### Log Levels

Levels from least to most severe:

| Level | Value | Console method |
|-------|-------|---------------|
| `debug` | 0 | `console.log` |
| `info` | 1 | `console.info` |
| `warn` | 2 | `console.warn` |
| `error` | 3 | `console.error` |

Setting `options.level` to `'warn'` suppresses `debug` and `info` messages.

### `LOG_LEVELS`

Exported constant mapping level names to their numeric values, useful for custom comparisons.

## Output Format

Each log line is prefixed with a timestamp, level, and the logger's prefix:

```
[2026-03-06T12:00:00.000Z] [INFO] [MyComponent] Server started on port 3000
```

## Migration Guide

Replace direct `console.*` calls with logger instances:

```diff
- console.error('Failed to fetch status:', err);
+ const logger = createLogger('App');
+ logger.error('Failed to fetch status:', err);
```

Create one logger per module or component for clear, filterable output.
