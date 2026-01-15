import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { watchPartyStore } from '../../store'

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

    const deleted = watchPartyStore.leaveParty(params.id, userId)

    return NextResponse.json({ 
      message: 'Left watch party',
      deleted 
    })
  } catch (error) {
    console.error('Leave watch party error:', error)
    return NextResponse.json(
      { message: 'Failed to leave watch party' },
      { status: 500 }
    )
  }
}
