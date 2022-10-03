export enum LogLevel {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}

export interface Logger {
  debug(msg: string): void
  info(msg: string): void
  warn(msg: string): void
  error(msg: string): void
}

type TestLogger = Logger & {
  get(level?: LogLevel): string[]
  reset(): void
}

function Logger(): TestLogger {
  const messages = [] as { level: LogLevel; msg: string }[]

  function log(level: LogLevel, msg: string) {
    messages.push({ level, msg })
  }

  return {
    debug: (msg: string): void => log(LogLevel.debug, msg),
    info: (msg: string): void => log(LogLevel.info, msg),
    warn: (msg: string): void => log(LogLevel.warn, msg),
    error: (msg: string): void => log(LogLevel.error, msg),
    get: (level?: LogLevel): string[] => messages.filter((m) => !level || m.level === level).map((m) => m.msg),
    reset: (): void => {
      messages.length = 0
    },
  }
}

export default Logger

const logLevel: LogLevel = (process.env.LOGLEVEL as LogLevel) || LogLevel.warn

export const ModuleLogger = (moduleName: string, level = logLevel) => {
  const debugModule = process.env.DEBUG && process.env.DEBUG.split(",").includes(moduleName)
  return {
    debug: level === LogLevel.debug && debugModule ? console.debug : () => undefined,
    info: [LogLevel.debug, LogLevel.info].includes(level) ? console.info : () => undefined,
    warn: [LogLevel.debug, LogLevel.info, LogLevel.warn].includes(level) ? console.warn : () => undefined,
    error: console.error,
  }
}
