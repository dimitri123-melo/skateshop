type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  action?: string
  userId?: string
  storeId?: string
  orderId?: string
  error?: unknown
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ?? (process.env.NODE_ENV === "production" ? "info" : "debug")

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    }
  }
  return { raw: String(err) }
}

function log(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) return

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context?.error
      ? { ...context, error: formatError(context.error) }
      : context),
  }

  switch (level) {
    case "debug":
      console.debug(JSON.stringify(entry))
      break
    case "info":
      console.info(JSON.stringify(entry))
      break
    case "warn":
      console.warn(JSON.stringify(entry))
      break
    case "error":
      console.error(JSON.stringify(entry))
      break
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
}
