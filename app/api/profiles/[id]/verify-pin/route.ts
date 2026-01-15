import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, comparePassword } from '@/lib/auth'

// Force dynamic rendering - this route uses headers, cookies and Prisma
export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value
    if (cookieToken) {
      const payload = verifyToken(cookieToken)
      return payload?.userId || null
    }
    return null
  }
  
  const payload = verifyToken(token)
  return payload?.userId || null
}

// POST /api/profiles/[id]/verify-pin - Verify PIN for a profile
export async function POST(
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

    const { pin } = await request.json()

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { message: 'PIN must be 4 digits' },
        { status: 400 }
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

    // Check if profile has a PIN
    if (!profile.pin) {
      return NextResponse.json(
        { valid: true }, // No PIN means no protection
        { status: 200 }
      )
    }

    // Verify PIN
    const valid = await comparePassword(pin, profile.pin)

    return NextResponse.json({ valid })
  } catch (error) {
    console.error('Verify PIN error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


