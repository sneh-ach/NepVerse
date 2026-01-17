import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardAchievements } from '@/lib/achievements'

export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (!token) {
      const cookieToken = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value
      if (cookieToken) {
        const { verifyToken } = await import('@/lib/auth')
        const payload = verifyToken(cookieToken)
        return payload?.userId || null
      }
      return null
    }
    
    const { verifyToken } = await import('@/lib/auth')
    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    return null
  }
}

/**
 * GET /api/user/achievements
 * Get user's achievements
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Initialize achievements if they don't exist
    const achievementCount = await prisma.achievement.count()
    if (achievementCount === 0) {
      try {
        const { initializeAchievements } = await import('@/lib/achievements')
        await initializeAchievements()
      } catch (error) {
        console.error('Error initializing achievements:', error)
      }
    }

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { points: 'desc' },
    })

    // Get user's earned achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    })

    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Combine with earned status
    const achievements = allAchievements.map(achievement => ({
      id: achievement.id,
      type: achievement.type,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points,
      earned: earnedIds.has(achievement.id),
      earnedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.earnedAt || null,
    }))

    const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0)

    return NextResponse.json({
      achievements,
      totalPoints,
      earnedCount: userAchievements.length,
      totalCount: allAchievements.length,
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get achievements')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * POST /api/user/achievements/check
 * Check and award new achievements
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const action = body.action || 'check'

    if (action === 'check') {
      const awarded = await checkAndAwardAchievements(userId)
      return NextResponse.json({
        message: 'Achievements checked',
        newlyAwarded: awarded,
      })
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Check achievements')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
