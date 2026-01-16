import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/debug/user-status - Check user's email notification status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailNotifications: true,
        createdAt: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: userData,
      emailStatus: {
        hasEmail: !!userData.email,
        emailVerified: userData.emailVerified,
        emailNotifications: userData.emailNotifications,
        canReceiveEmails: userData.emailVerified && userData.emailNotifications,
      },
      message: userData.emailVerified && userData.emailNotifications
        ? '✅ You are eligible to receive email notifications'
        : userData.emailVerified
        ? '⚠️ Email notifications are disabled in your preferences'
        : '⚠️ Please verify your email address to receive notifications',
    })
  } catch (error) {
    console.error('Debug user status error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
