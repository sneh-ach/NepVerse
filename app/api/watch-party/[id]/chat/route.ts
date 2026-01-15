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

// POST: Send a chat message
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
    const { message, userName, userAvatar } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 500) {
      return NextResponse.json(
        { message: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    const chatMessage = watchPartyStore.addChatMessage(
      params.id,
      userId,
      userName || 'User',
      userAvatar,
      message
    )

    if (!chatMessage) {
      return NextResponse.json(
        { message: 'Watch party not found or you are not a member' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...chatMessage,
      createdAt: chatMessage.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Send chat message error:', error)
    return NextResponse.json(
      { message: 'Failed to send chat message' },
      { status: 500 }
    )
  }
}

// GET: Get chat messages
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

    // Verify user is a member
    if (!party.members.has(userId)) {
      return NextResponse.json(
        { message: 'You are not a member of this party' },
        { status: 403 }
      )
    }

    const chatMessages = watchPartyStore.getChatMessages(params.id, since)

    return NextResponse.json({
      messages: chatMessages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      })),
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { message: 'Failed to get chat messages' },
      { status: 500 }
    )
  }
}
