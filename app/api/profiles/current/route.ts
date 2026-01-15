import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Force dynamic rendering - this route uses headers, cookies and Prisma
export const dynamic = 'force-dynamic'

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

// GET /api/profiles/current - Get current selected profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current profile from cookie
    const currentProfileId = request.cookies.get('current-profile-id')?.value

    if (currentProfileId) {
      const profile = await prisma.userProfile.findUnique({
        where: { id: currentProfileId },
      })

      if (profile && profile.userId === userId) {
        return NextResponse.json(profile)
      }
    }

    // If no current profile set, get the first profile for this user
    const firstProfile = await prisma.userProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    if (firstProfile) {
      // Auto-set the first profile as current
      const response = NextResponse.json(firstProfile)
      response.cookies.set('current-profile-id', firstProfile.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
      return response
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error('Get current profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/profiles/current - Set current profile
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { profileId } = await request.json()

    if (!profileId) {
      // Clear current profile
      const response = NextResponse.json({ message: 'Current profile cleared' })
      response.cookies.delete('current-profile-id')
      return response
    }

    // Verify profile belongs to user
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
    })

    if (!profile || profile.userId !== userId) {
      return NextResponse.json(
        { message: 'Profile not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json(profile)
    response.cookies.set('current-profile-id', profileId, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch (error) {
    console.error('Set current profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


