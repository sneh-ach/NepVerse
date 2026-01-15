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
    // Silent fail for token verification - will be handled by route
    return null
  }
}

/**
 * GET /api/profiles/[id]
 * Get a specific profile by ID (must belong to authenticated user)
 * 
 * @param params.id - Profile ID
 * @returns Profile object
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: params.id },
    })

    if (!profile) {
      return NextResponse.json(
        { message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify profile belongs to user
    if (profile.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get profile')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * PUT /api/profiles/[id]
 * Update a profile (must belong to authenticated user)
 * 
 * @param params.id - Profile ID
 * @param body.name - Profile name (optional, 1-50 characters)
 * @param body.avatar - Avatar URL (optional, max 2000 characters)
 * @param body.avatarType - Avatar type (optional)
 * @param body.pin - 4-digit PIN or null to remove (optional)
 * @param body.isKidsProfile - Whether this is a kids profile (optional)
 * @returns Updated profile object
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: params.id },
    })

    if (!profile || profile.userId !== userId) {
      return NextResponse.json(
        { message: 'Profile not found' },
        { status: 404 }
      )
    }

        const data = await request.json()
        
        // Validate input with Zod
        const { validate, profileUpdateSchema } = await import('@/lib/validation')
        const validation = validate(profileUpdateSchema, data)
        
        if (!validation.success) {
          return NextResponse.json(
            { message: validation.error, code: 'VALIDATION_ERROR' },
            { status: 400 }
          )
        }

        const { name, avatar, avatarType, pin, isKidsProfile } = validation.data

        // Hash PIN if provided and changed
        let hashedPin: string | null | undefined = profile.pin
        if (pin !== undefined) {
          if (pin === null || pin === '') {
            hashedPin = null
          } else if (pin && pin.length === 4) {
            const { hashPassword } = await import('@/lib/auth')
            hashedPin = await hashPassword(pin)
          }
        }

        const updated = await prisma.userProfile.update({
          where: { id: params.id },
          data: {
            name: name !== undefined ? name : undefined,
            avatar: avatar !== undefined ? avatar : undefined,
            avatarType: avatarType !== undefined ? avatarType : undefined,
            pin: hashedPin,
            isKidsProfile: isKidsProfile !== undefined ? isKidsProfile : undefined,
          },
        })

        // Invalidate cache for this profile
        const { cacheService } = await import('@/lib/cache')
        await cacheService.delete(`profile:${params.id}`)
        await cacheService.delete(`profiles:${userId}`)

    return NextResponse.json(updated)
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Update profile')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * DELETE /api/profiles/[id]
 * Delete a profile (must belong to authenticated user)
 * 
 * @param params.id - Profile ID
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: params.id },
    })

    if (!profile || profile.userId !== userId) {
      return NextResponse.json(
        { message: 'Profile not found' },
        { status: 404 }
      )
    }

    await prisma.userProfile.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Profile deleted' })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Delete profile')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}


