// gamma
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function createLogger(prefix, options = {}) {
  const minLevel = LOG_LEVELS[options.level || 'info'];

  function log(level, ...args) {
    if (LOG_LEVELS[level] < minLevel) return;
    const timestamp = new Date().toISOString();
    const tag = `[${timestamp}] [${level.toUpperCase()}] [${prefix}]`;
    console[level === 'debug' ? 'log' : level](tag, ...args);
  }

  return {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
  };
}

module.exports = { createLogger, LOG_LEVELS };
