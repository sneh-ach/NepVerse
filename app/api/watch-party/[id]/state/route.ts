import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { watchPartyStore } from '../../store'

// Force dynamic rendering - this route uses headers, cookies and searchParams
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

    const searchParams = request.nextUrl.searchParams
    const sinceParam = searchParams.get('since')
    const since = sinceParam ? new Date(sinceParam) : undefined

    const party = watchPartyStore.getParty(params.id)
    if (!party) {
      return NextResponse.json(
        { message: 'Watch party not found or expired' },
        { status: 404 }
      )
    }

    // Update member's last seen
    watchPartyStore.updateMemberLastSeen(params.id, userId)

    // Get chat messages since timestamp
    const chatMessages = watchPartyStore.getChatMessages(params.id, since)

    return NextResponse.json({
      ...watchPartyStore.serializeParty(party),
      chat: chatMessages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      })),
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get watch party state error:', error)
    return NextResponse.json(
      { message: 'Failed to get watch party state' },
      { status: 500 }
    )
  }
}
