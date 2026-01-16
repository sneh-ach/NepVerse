import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailService } from '@/lib/email'
import { validate, passwordResetSchema } from '@/lib/validation'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'

// Force dynamic rendering - this route uses headers
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - wrapped in try-catch to prevent crashes
    let rateLimit = { allowed: true, remaining: 100, resetTime: Date.now() + 60000 }
    try {
      const clientId = getClientIdentifier(request)
      rateLimit = await apiRateLimiter.check(clientId)
    } catch (rateLimitError) {
      console.error('Rate limiter error (allowing request):', rateLimitError)
      // Allow request if rate limiter fails
    }
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const body = await request.json()
    const validation = validate(passwordResetSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Find user by email
    const user = await db.user.findByEmail(email)
    
    // Don't reveal if user exists (security best practice)
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, we\'ve sent a password reset link.',
      })
    }

    // Generate and store reset token
    const { token } = await db.user.createPasswordResetToken(user.id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    
    // Log without sensitive data
    console.log('[Password Reset] ✅ Token created')
    console.log('[Password Reset] Reset URL generated')
    
    // Send email (wrapped in try-catch to prevent crashes)
    console.log('[Password Reset] 📧 Attempting to send email to:', user.email)
    console.log('[Password Reset] Using FROM email:', process.env.EMAIL_FROM || 'NepVerse <onboarding@resend.dev>')
    let emailSent = false
    try {
      emailSent = await emailService.sendPasswordResetEmail(user.email!, token)
      console.log('[Password Reset] Email send result:', emailSent ? '✅ SUCCESS' : '❌ FAILED')
      
      if (emailSent) {
        console.log('[Password Reset] ✅ Email sent! Check Resend dashboard for delivery status.')
        console.log('[Password Reset] 💡 If email not received:')
        console.log('[Password Reset]   1. Check spam/junk folder')
        console.log('[Password Reset]   2. Verify sender domain in Resend dashboard')
        console.log('[Password Reset]   3. Check Resend dashboard for bounce/spam reports')
      } else {
        console.error('[Password Reset] ❌ Email failed to send. Check server logs above for details.')
      }
    } catch (emailError: any) {
      console.error('[Password Reset] ❌ Email service error:', emailError)
      console.error('[Password Reset] Error message:', emailError?.message || 'Unknown error')
      console.error('[Password Reset] Check:')
      console.error('   1. RESEND_API_KEY is set in .env')
      console.error('   2. Email service is properly configured')
      console.error('   3. Sender domain is verified in Resend dashboard')
      // Still return success to user (security best practice)
    }
    
    // In development, log the reset link so it can be tested
    if (process.env.NODE_ENV === 'development' || !emailSent) {
      console.log('\n' + '='.repeat(80))
      console.log('[Password Reset] 🔗 RESET LINK (for testing):')
      console.log(resetUrl)
      console.log('='.repeat(80) + '\n')
    }
    
    if (!emailSent) {
      console.warn('[Password Reset] ⚠️ Email not sent, but returning success to user (security best practice)')
      console.warn('[Password Reset] ⚠️ Check server logs above for the reset link in development mode')
    }

    // In development, include the reset link in the response for testing
    const response: any = {
      message: 'If an account with that email exists, we\'ve sent a password reset link.',
    }
    
    // Only include reset link in development mode for testing
    if (process.env.NODE_ENV === 'development' && !emailSent) {
      response.devResetLink = resetUrl
      response.devMessage = 'Email service not configured. Use the reset link above to test password reset.'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Password reset error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Password reset error details:', { errorMessage, errorStack })
    
    // Import error handler dynamically to avoid circular dependencies
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Password reset', undefined, '/api/auth/password-reset')
    const errorInfo = handleError(error)
    
    // Still return success message to user (security best practice)
    // But log the actual error for debugging
    return NextResponse.json(
      { message: 'If an account with that email exists, we\'ve sent a password reset link.' },
      { status: 200 }
    )
  }
}

