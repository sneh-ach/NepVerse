import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId: user.id }
    if (unreadOnly) {
      where.read = false
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ])

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    })

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true, readAt: new Date() },
      })
      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true, readAt: new Date() },
      })
      return NextResponse.json({ message: 'Notification marked as read' })
    }

    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
