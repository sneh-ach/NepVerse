import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route uses headers
export const dynamic = 'force-dynamic'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader) || request.cookies.get('auth-token')?.value

  if (!token) return null

  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // In production, store preferences in database
    // For now, return defaults
    return NextResponse.json({
      autoplay: true,
      autoplayNext: true,
      defaultQuality: 'auto',
      defaultSubtitle: 'off',
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const preferences = await request.json()

    // In production, save to database
    // For now, just return success
    return NextResponse.json({ message: 'Preferences saved', preferences })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}




