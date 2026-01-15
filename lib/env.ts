/**
 * Environment variable validation and type-safe access
 */

interface Env {
  // Database
  DATABASE_URL: string

  // JWT
  JWT_SECRET: string

  // Email (at least one required)
  RESEND_API_KEY?: string
  SENDGRID_API_KEY?: string
  AWS_SES_ACCESS_KEY_ID?: string
  AWS_SES_SECRET_ACCESS_KEY?: string
  AWS_SES_REGION?: string

  // Payment
  STRIPE_SECRET_KEY?: string
  STRIPE_PUBLISHABLE_KEY?: string
  ESEWA_SECRET_KEY?: string
  KHALTI_SECRET_KEY?: string

  // Storage
  S3_ACCESS_KEY_ID?: string
  S3_SECRET_ACCESS_KEY?: string
  S3_BUCKET?: string
  S3_REGION?: string
  R2_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET?: string

  // Optional Services
  REDIS_URL?: string
  ELASTICSEARCH_URL?: string
  NEXT_PUBLIC_ALGOLIA_APP_ID?: string
  ALGOLIA_API_KEY?: string
  ML_RECOMMENDATION_ENDPOINT?: string
  VIDEO_PROCESSING_ENDPOINT?: string
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string
  FCM_SERVER_KEY?: string
  NEXT_PUBLIC_GA_ID?: string
  SENTRY_DSN?: string

  // Server
  PORT?: string
  WS_PORT?: string
  NODE_ENV: 'development' | 'production' | 'test'
}

function getEnvVar(key: keyof Env, required = true): string {
  const value = process.env[key]
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || ''
}

function validateEmailService() {
  const hasResend = !!process.env.RESEND_API_KEY
  const hasSendGrid = !!process.env.SENDGRID_API_KEY
  const hasSES = !!process.env.AWS_SES_ACCESS_KEY_ID && !!process.env.AWS_SES_SECRET_ACCESS_KEY

  if (!hasResend && !hasSendGrid && !hasSES) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  No email service configured. Email features will not work.')
      console.warn('   Please set one of: RESEND_API_KEY, SENDGRID_API_KEY, or AWS_SES_*')
    }
  }
}

function validatePaymentService() {
  const hasStripe = !!process.env.STRIPE_SECRET_KEY
  const hasEsewa = !!process.env.ESEWA_SECRET_KEY
  const hasKhalti = !!process.env.KHALTI_SECRET_KEY

  if (!hasStripe && !hasEsewa && !hasKhalti) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  No payment service configured. Payment features will not work.')
      console.warn('   Please set one of: STRIPE_SECRET_KEY, ESEWA_SECRET_KEY, or KHALTI_SECRET_KEY')
    }
  }
}

function validateStorageService() {
  const hasS3 = !!process.env.S3_ACCESS_KEY_ID && !!process.env.S3_SECRET_ACCESS_KEY
  const hasR2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID

  if (!hasS3 && !hasR2) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  No storage service configured. File uploads will not work.')
      console.warn('   Please set S3_* or R2_* environment variables')
    }
  }
}

/**
 * Validate environment variables on startup
 * In production, this will throw and prevent the app from starting
 * if required variables are missing
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    // Required variables - must be present
    try {
      getEnvVar('DATABASE_URL')
    } catch {
      errors.push('DATABASE_URL is required')
    }

    try {
      getEnvVar('JWT_SECRET')
    } catch {
      errors.push('JWT_SECRET is required')
    }

    // In production, fail if required vars are missing
    if (process.env.NODE_ENV === 'production' && errors.length > 0) {
      throw new Error(`Missing required environment variables: ${errors.join(', ')}`)
    }

    // Optional but recommended - warn only
    validateEmailService()
    validatePaymentService()
    validateStorageService()

    if (errors.length === 0) {
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Environment variables validated')
      }
      return { valid: true, errors: [] }
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  Environment validation warnings:', errors.join(', '))
      }
      return { valid: false, errors }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Environment validation failed:', message)
    }
    return { valid: false, errors: [message] }
  }
}

export const env: Env = {
  // Required
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  NODE_ENV: (getEnvVar('NODE_ENV', false) || 'development') as Env['NODE_ENV'],

  // Email
  RESEND_API_KEY: getEnvVar('RESEND_API_KEY', false),
  SENDGRID_API_KEY: getEnvVar('SENDGRID_API_KEY', false),
  AWS_SES_ACCESS_KEY_ID: getEnvVar('AWS_SES_ACCESS_KEY_ID', false),
  AWS_SES_SECRET_ACCESS_KEY: getEnvVar('AWS_SES_SECRET_ACCESS_KEY', false),
  AWS_SES_REGION: getEnvVar('AWS_SES_REGION', false),

  // Payment
  STRIPE_SECRET_KEY: getEnvVar('STRIPE_SECRET_KEY', false),
  STRIPE_PUBLISHABLE_KEY: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', false) || getEnvVar('STRIPE_PUBLISHABLE_KEY', false),
  ESEWA_SECRET_KEY: getEnvVar('ESEWA_SECRET_KEY', false),
  KHALTI_SECRET_KEY: getEnvVar('KHALTI_SECRET_KEY', false),

  // Storage
  S3_ACCESS_KEY_ID: getEnvVar('S3_ACCESS_KEY_ID', false),
  S3_SECRET_ACCESS_KEY: getEnvVar('S3_SECRET_ACCESS_KEY', false),
  S3_BUCKET: getEnvVar('S3_BUCKET', false),
  S3_REGION: getEnvVar('S3_REGION', false),
  R2_ACCOUNT_ID: getEnvVar('R2_ACCOUNT_ID', false),
  R2_ACCESS_KEY_ID: getEnvVar('R2_ACCESS_KEY_ID', false),
  R2_SECRET_ACCESS_KEY: getEnvVar('R2_SECRET_ACCESS_KEY', false),
  R2_BUCKET: getEnvVar('R2_BUCKET', false),

  // Optional
  REDIS_URL: getEnvVar('REDIS_URL', false),
  ELASTICSEARCH_URL: getEnvVar('ELASTICSEARCH_URL', false),
  NEXT_PUBLIC_ALGOLIA_APP_ID: getEnvVar('NEXT_PUBLIC_ALGOLIA_APP_ID', false),
  ALGOLIA_API_KEY: getEnvVar('ALGOLIA_API_KEY', false),
  ML_RECOMMENDATION_ENDPOINT: getEnvVar('ML_RECOMMENDATION_ENDPOINT', false),
  VIDEO_PROCESSING_ENDPOINT: getEnvVar('VIDEO_PROCESSING_ENDPOINT', false),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: getEnvVar('NEXT_PUBLIC_VAPID_PUBLIC_KEY', false),
  FCM_SERVER_KEY: getEnvVar('FCM_SERVER_KEY', false),
  NEXT_PUBLIC_GA_ID: getEnvVar('NEXT_PUBLIC_GA_ID', false),
  SENTRY_DSN: getEnvVar('SENTRY_DSN', false),

  // Server
  PORT: getEnvVar('PORT', false),
  WS_PORT: getEnvVar('WS_PORT', false),
}


