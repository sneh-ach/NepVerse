import { NextRequest, NextResponse } from 'next/server'
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

    // Mock notifications - in production, fetch from database
    const notifications = [
      {
        id: '1',
        title: 'Welcome to NepVerse!',
        message: 'Start your free trial and explore unlimited Nepali content.',
        type: 'info' as const,
        read: false,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: '2',
        title: 'New Release',
        message: 'Check out the latest episode of "Kathmandu Connection"',
        type: 'info' as const,
        read: false,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    ]

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}




