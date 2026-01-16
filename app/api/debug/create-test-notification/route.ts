import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// POST /api/debug/create-test-notification - Create a test notification
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const notification = await createNotification({
      userId: user.id,
      type: 'new_movie',
      title: '🎬 Test Notification',
      message: 'This is a test notification to verify the system is working!',
      link: '/browse',
      imageUrl: undefined,
      sendEmail: false,
    })

    return NextResponse.json({
      message: 'Test notification created successfully',
      notification,
    })
  } catch (error) {
    console.error('Create test notification error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
