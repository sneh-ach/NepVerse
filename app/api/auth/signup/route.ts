import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailService } from '@/lib/email'
import { validate, signupSchema } from '@/lib/validation'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { generateToken } from '@/lib/auth'
import { isStrongPassword } from '@/lib/security'

/**
 * POST /api/auth/signup
 * Register a new user account
 * 
 * @param body.email - User email (required if no phone)
 * @param body.phone - User phone number (required if no email)
 * @param body.password - User password (required, min 8 characters)
 * @param body.firstName - User first name (optional)
 * @param body.lastName - User last name (optional)
 * @returns User object with JWT token in HTTP-only cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validation = validate(signupSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    const { email, phone, password, firstName, lastName } = validation.data

    // Validate password strength
    const passwordCheck = isStrongPassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { message: passwordCheck.message || 'Password does not meet requirements' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (email) {
      const existing = await db.user.findByEmail(email)
      if (existing) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 409 }
        )
      }
    }

    if (phone) {
      const existing = await db.user.findByPhone(phone)
      if (existing) {
        return NextResponse.json(
          { message: 'Phone already registered' },
          { status: 409 }
        )
      }
    }

    // Create user in database
    const user = await db.user.create({
      email: email || undefined,
      phone: phone || undefined,
      password,
      firstName,
      lastName,
    })

    // Generate email verification token if email provided
    if (email) {
      const { token } = await db.user.createEmailVerificationToken(user.id)
      await emailService.sendEmailVerificationEmail(email, token)
    }

    // Send welcome email
    if (email) {
      await emailService.sendWelcomeEmail(
        email,
        firstName || lastName || 'User'
      )
    }

    // Generate JWT token
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        emailVerified: user.emailVerified,
      },
    })

    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'User signup')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

