/**
 * Production-ready logging utility
 * Integrates with Sentry for error tracking in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
  userId?: string
  path?: string
  requestId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private sentryEnabled = !!process.env.SENTRY_DSN

  private async log(level: LogLevel, message: string, data?: any, userId?: string, path?: string, requestId?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userId,
      path,
      requestId,
    }

    // In development, log to console
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '')
    }

    // In production, send to Sentry for errors
    if (!this.isDevelopment && this.sentryEnabled && level === 'error') {
      try {
        // Dynamic import to avoid bundling Sentry in development
        const Sentry = await import('@sentry/nextjs').catch(() => null)
        if (Sentry) {
          if (data instanceof Error) {
            Sentry.captureException(data, {
              tags: {
                userId,
                path,
                requestId,
              },
              extra: {
                message,
                ...(typeof data === 'object' && !(data instanceof Error) ? data : {}),
              },
            })
          } else {
            Sentry.captureMessage(message, {
              level: 'error',
              tags: {
                userId,
                path,
                requestId,
              },
              extra: data,
            })
          }
        }
      } catch (sentryError) {
        // Fallback to console if Sentry fails
        console.error('[LOGGER] Sentry error:', sentryError)
        console.error(`[${level.toUpperCase()}]`, message, data || '')
      }
    }
  }

  debug(message: string, data?: any, userId?: string, path?: string, requestId?: string) {
    this.log('debug', message, data, userId, path, requestId)
  }

  info(message: string, data?: any, userId?: string, path?: string, requestId?: string) {
    this.log('info', message, data, userId, path, requestId)
  }

  warn(message: string, data?: any, userId?: string, path?: string, requestId?: string) {
    this.log('warn', message, data, userId, path, requestId)
  }

  error(message: string, error?: Error | any, userId?: string, path?: string, requestId?: string) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...error }
      : error
    this.log('error', message, errorData, userId, path, requestId)
  }
}

export const logger = new Logger()


