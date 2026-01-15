import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { watchPartyStore } from '../store'

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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentId, contentType, episodeId, userName, userAvatar } = body

    if (!contentId || !contentType) {
      return NextResponse.json(
        { message: 'contentId and contentType are required' },
        { status: 400 }
      )
    }

    if (contentType !== 'movie' && contentType !== 'series') {
      return NextResponse.json(
        { message: 'contentType must be "movie" or "series"' },
        { status: 400 }
      )
    }

    const party = watchPartyStore.createParty(
      contentId,
      contentType,
      userId,
      userName || 'User',
      userAvatar,
      episodeId
    )

    return NextResponse.json(watchPartyStore.serializeParty(party))
  } catch (error) {
    console.error('Create watch party error:', error)
    return NextResponse.json(
      { message: 'Failed to create watch party' },
      { status: 500 }
    )
  }
}
