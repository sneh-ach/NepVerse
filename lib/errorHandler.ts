/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export function handleError(error: unknown): {
  message: string
  statusCode: number
  code?: string
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    }
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  }
}

export function logError(error: unknown, context?: string, userId?: string, path?: string, requestId?: string) {
  const errorInfo = handleError(error)
  const errorDetails = {
    message: errorInfo.message,
    statusCode: errorInfo.statusCode,
    code: errorInfo.code,
    stack: error instanceof Error ? error.stack : undefined,
    context: context || 'ERROR',
    userId,
    path,
    requestId,
    timestamp: new Date().toISOString(),
  }
  
  // Use logger if available, otherwise console.error
  if (typeof window === 'undefined') {
    try {
      // Dynamic import to avoid circular dependencies
      import('./logger').then(({ logger }) => {
        logger.error(
          context || 'Error occurred',
          error instanceof Error ? error : new Error(errorInfo.message),
          userId,
          path,
          requestId
        )
      }).catch(() => {
        // Logger not available, fall through to console
        console.error(`[${context || 'ERROR'}]`, errorDetails)
      })
      return
    } catch {
      // Fall through to console
    }
  }
  
  console.error(`[${context || 'ERROR'}]`, errorDetails)
}


