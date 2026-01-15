import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailService } from '@/lib/email'
import { validate, passwordResetSchema } from '@/lib/validation'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
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
    // Log without sensitive data
    console.log('[Password Reset] ✅ Token created')
    console.log('[Password Reset] Reset URL generated')
    
    // Send email
    console.log('[Password Reset] 📧 Attempting to send email...')
    const emailSent = await emailService.sendPasswordResetEmail(user.email!, token)
    console.log('[Password Reset] Email send result:', emailSent ? '✅ SUCCESS' : '❌ FAILED')
    
    if (!emailSent) {
      console.error('[Password Reset] ❌ Failed to send email. Check:')
      console.error('   1. RESEND_API_KEY is set in .env')
      console.error('   2. Email service is properly configured')
      console.error('   3. Check server console above for detailed error messages')
      // Still return success to user (security best practice)
    } else {
      console.log('[Password Reset] ✅ Email sent successfully!')
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent a password reset link.',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

