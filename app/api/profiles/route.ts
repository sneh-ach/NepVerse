import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (!token) {
      const cookieToken = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value
      if (cookieToken) {
        const payload = verifyToken(cookieToken)
        return payload?.userId || null
      }
      return null
    }
    
    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// GET /api/profiles - Get all profiles for current user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const profiles = await prisma.userProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Get profiles error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/profiles
 * Create a new user profile (max 5 profiles per user)
 * 
 * @param body.name - Profile name (required, 1-50 characters)
 * @param body.avatar - Avatar URL (optional, max 2000 characters)
 * @param body.avatarType - Avatar type: 'emoji', 'image', or 'default' (optional)
 * @param body.pin - 4-digit PIN for profile lock (optional)
 * @param body.isKidsProfile - Whether this is a kids profile (optional)
 * @returns Created profile object
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Validate input with Zod
    const { validate, profileCreateSchema } = await import('@/lib/validation')
    const validation = validate(profileCreateSchema, data)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { name, avatar, avatarType, pin, isKidsProfile } = validation.data

    // Check max profiles (5 per user)
    const existingProfiles = await prisma.userProfile.count({
      where: { userId },
    })

    if (existingProfiles >= 5) {
      return NextResponse.json(
        { message: 'Maximum 5 profiles allowed per account' },
        { status: 400 }
      )
    }

    // Validation already done by Zod schema

    // Hash PIN if provided
    let hashedPin: string | undefined
    if (pin && pin.length === 4) {
      const { hashPassword } = await import('@/lib/auth')
      hashedPin = await hashPassword(pin)
    }

    const profile = await prisma.userProfile.create({
      data: {
        userId,
        name,
        avatar: avatar || undefined,
        avatarType: avatarType || 'emoji',
        pin: hashedPin,
        isKidsProfile: isKidsProfile || false,
      },
    })

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Create profile', userId)
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

