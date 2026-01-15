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

    // In production, mark notification as read in database
    return NextResponse.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}




