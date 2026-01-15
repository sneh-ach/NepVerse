import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Force dynamic rendering - this route uses headers, cookies and Prisma
export const dynamic = 'force-dynamic'

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('token')?.value
    if (cookieToken) {
      const payload = verifyToken(cookieToken)
      if (payload) {
        return await prisma.user.findUnique({ where: { id: payload.userId } })
      }
    }
    return null
  }
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Remove push subscription from database
    // await prisma.pushSubscription.delete({
    //   where: { userId: user.id },
    // })

    return NextResponse.json({ message: 'Unsubscribed from push notifications' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


