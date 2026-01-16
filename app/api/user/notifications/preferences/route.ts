import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/user/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailNotifications: true },
    })

    return NextResponse.json({
      emailNotifications: userData?.emailNotifications ?? true,
    })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/user/notifications/preferences - Update user's notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { emailNotifications } = body

    if (typeof emailNotifications !== 'boolean') {
      return NextResponse.json(
        { message: 'emailNotifications must be a boolean' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailNotifications },
    })

    return NextResponse.json({
      message: 'Preferences updated',
      emailNotifications,
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
