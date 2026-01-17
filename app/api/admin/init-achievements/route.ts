import { NextRequest, NextResponse } from 'next/server'
import { initializeAchievements } from '@/lib/achievements'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/init-achievements
 * Initialize achievements in database (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    await initializeAchievements()

    return NextResponse.json({
      message: 'Achievements initialized successfully',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Not authenticated') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Init achievements')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
