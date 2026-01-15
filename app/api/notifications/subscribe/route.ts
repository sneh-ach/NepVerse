import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription is required' },
        { status: 400 }
      )
    }

    // TODO: Store push subscription in database
    // Create PushSubscription model in Prisma schema
    // await prisma.pushSubscription.upsert({
    //   where: { userId: user.id },
    //   update: { subscription: JSON.stringify(subscription) },
    //   create: {
    //     userId: user.id,
    //     subscription: JSON.stringify(subscription),
    //   },
    // })

    return NextResponse.json({ message: 'Subscribed to push notifications' })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


