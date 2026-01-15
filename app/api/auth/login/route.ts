import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { validate, loginSchema } from '@/lib/validation'
import { apiRateLimiter, authRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * 
 * @param body.emailOrPhone - User email or phone number (required)
 * @param body.password - User password (required)
 * @returns User object with JWT token in HTTP-only cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for auth)
    const clientId = getClientIdentifier(request)
    const rateLimit = await authRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const body = await request.json()
    const validation = validate(loginSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    const { emailOrPhone, password } = validation.data

    // Find user by email or phone
    const user = await db.user.findByEmail(emailOrPhone) || 
                 await db.user.findByPhone(emailOrPhone)

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await db.user.verifyPassword(user.id, password)
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate JWT token
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
    })

    // Get user with profile
    const userWithProfile = await db.user.findById(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        profile: userWithProfile?.profile,
        subscription: subscription || null,
        emailVerified: user.emailVerified,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

