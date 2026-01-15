import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { watchPartyStore } from '../../store'

// Force dynamic rendering - this route uses headers and cookies
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

    const body = await request.json()
    const { currentTime, isPlaying } = body

    if (typeof currentTime !== 'number' || typeof isPlaying !== 'boolean') {
      return NextResponse.json(
        { message: 'currentTime (number) and isPlaying (boolean) are required' },
        { status: 400 }
      )
    }

    const success = watchPartyStore.updatePlayback(
      params.id,
      userId,
      currentTime,
      isPlaying
    )

    if (!success) {
      return NextResponse.json(
        { message: 'Only the host can update playback or party not found' },
        { status: 403 }
      )
    }

    return NextResponse.json({ 
      message: 'Playback synced',
      playback: {
        currentTime,
        isPlaying,
        updatedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Sync playback error:', error)
    return NextResponse.json(
      { message: 'Failed to sync playback' },
      { status: 500 }
    )
  }
}
