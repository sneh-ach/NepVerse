import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

// Force dynamic rendering - this route uses headers and cookies
export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader) || request.cookies.get('auth-token')?.value

  if (!token) return null

  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // In production, mark all notifications as read in database
    return NextResponse.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}




