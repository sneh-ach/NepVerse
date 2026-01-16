import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/debug/notifications - Debug notification system
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user details
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailNotifications: true,
      },
    })

    // Get all notifications for this user
    const allNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get notification stats
    const stats = {
      total: await prisma.notification.count({ where: { userId: user.id } }),
      unread: await prisma.notification.count({ where: { userId: user.id, read: false } }),
      read: await prisma.notification.count({ where: { userId: user.id, read: true } }),
      byType: {
        new_movie: await prisma.notification.count({ where: { userId: user.id, type: 'new_movie' } }),
        new_series: await prisma.notification.count({ where: { userId: user.id, type: 'new_series' } }),
        system: await prisma.notification.count({ where: { userId: user.id, type: 'system' } }),
        promotion: await prisma.notification.count({ where: { userId: user.id, type: 'promotion' } }),
      },
    }

    // Get all users count
    const totalUsers = await prisma.user.count()

    return NextResponse.json({
      user: userData,
      notifications: {
        all: allNotifications,
        stats,
      },
      system: {
        totalUsers,
        message: allNotifications.length === 0
          ? '⚠️ No notifications found. Check if notifications were created when movies were uploaded.'
          : `✅ Found ${allNotifications.length} notifications`,
      },
    })
  } catch (error) {
    console.error('Debug notifications error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
